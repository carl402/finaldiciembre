import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
// Auth simplificado para producción
import { fileProcessor } from "./services/fileProcessor";
import { telegramService } from "./services/telegramService";
import { simulationService } from "./services/simulationService";
import multer from "multer";
import crypto from "crypto";
import { insertLogSchema, insertErrorSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.log', '.txt', '.pdf'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only .log, .txt, and .pdf files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Demo user for immediate functionality
  const demoUser = {
    id: "demo-user",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
    profileImageUrl: null,
    role: "admin",
    isActive: true,
    telegramChatId: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Auth routes - simplified for demo
  app.get('/api/auth/user', async (req: any, res) => {
    res.json(demoUser);
  });

  app.get('/api/login', (req, res) => {
    res.redirect('/');
  });

  app.get('/api/logout', (req, res) => {
    res.redirect('/');
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const logStats = await storage.getLogStats();
      const errorStats = await storage.getErrorStats();
      const errorTrends = await storage.getErrorTrends(7);

      res.json({
        ...logStats,
        ...errorStats,
        errorTrends,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // File upload and processing
  app.post('/api/logs/upload', upload.single('file'), async (req: any, res) => {
    try {
      console.log('--- Upload endpoint hit ---');
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      if (!req.file) {
        console.error('No file uploaded. Multer req.file:', req.file);
        return res.status(400).json({ message: "No file uploaded", debug: { headers: req.headers, body: req.body, multerFile: req.file } });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const fileHash = crypto.createHash('md5').update(fileContent).digest('hex');

      // Check for duplicates
      const existingLog = await storage.getLogByHash(fileHash);
      if (existingLog) {
        return res.status(409).json({ message: "File already exists", logId: existingLog.id });
      }

      // Create log entry
      const logData = insertLogSchema.parse({
        fileName: req.file.originalname,
        fileHash,
        fileSize: req.file.size,
        content: fileContent,
        uploadedBy: "demo-user",
        status: "processing",
      });

      const log = await storage.createLog(logData);

      // Procesar archivo y devolver conteo de errores por categoría
      fileProcessor.processLogFile(log.id, fileContent)
        .then(async (detectedErrors) => {
          for (const error of detectedErrors) {
            await storage.createError({
              logId: log.id,
              errorType: error.type,
              message: error.message,
              lineNumber: error.lineNumber,
              severity: error.severity,
            } as any);
          }
          await storage.updateLogStatus(log.id, "completed");
          // Conteo por categoría
          const resumen = { leve: 0, medio: 0, critico: 0 };
          for (const err of detectedErrors) {
            if (err.severity === 'leve') resumen.leve++;
            if (err.severity === 'medio') resumen.medio++;
            if (err.severity === 'critico') resumen.critico++;
          }
          // Guardar notificación persistente
          await storage.createNotification({
            userId: "demo-user",
            type: "processing_complete",
            message: `Análisis de ${log.fileName}: Leve: ${resumen.leve}, Medio: ${resumen.medio}, Crítico: ${resumen.critico}`,
            sent: false,
          } as any);
        })
        .catch(async (error) => {
          console.error("Error processing log file:", error);
          await storage.updateLogStatus(log.id, "failed");
        });

      // Responder de inmediato con el log y resumen vacío (el frontend puede hacer polling o esperar notificación)
      res.json({ ...log, resumen: { leve: 0, medio: 0, critico: 0 }, status: 'processing' });
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file", debug: error?.message });
    }
  });

  // Eliminar log y sus errores asociados
  app.delete('/api/logs/:id', async (req, res) => {
    try {
      const log = await storage.getLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }
      // Eliminar errores asociados
      await storage.deleteErrorsByLogId(log.id);
      // Eliminar log
      await storage.deleteLog(log.id);
      res.json({ message: "Log deleted" });
    } catch (error) {
      console.error("Error deleting log:", error);
      res.status(500).json({ message: "Failed to delete log" });
    }
  });

  // Get all logs
  app.get('/api/logs', async (req, res) => {
    try {
      console.log('--- /api/logs llamado ---');
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;
      console.log('Parámetros:', { page, limit, offset });

      const logs = await storage.getAllLogs(limit, offset);
      console.log('Logs obtenidos:', logs);

      const logsWithErrorCounts = await Promise.all(
        logs.map(async (log) => {
          try {
            const logErrors = await storage.getErrorsByLogId(log.id);
            console.log(`Errores para log ${log.id}:`, logErrors);
            return { ...log, errorCount: logErrors.length };
          } catch (e) {
            console.error(`Error obteniendo errores para log ${log.id}:`, e);
            return { ...log, errorCount: -1, error: String(e) };
          }
        })
      );

      console.log('logsWithErrorCounts:', logsWithErrorCounts);
      res.json(logsWithErrorCounts);
    } catch (error) {
      console.error("Error fetching logs:", error);
      let debug = '';
      try {
        debug = typeof error === 'string' ? error : JSON.stringify(error as any, Object.getOwnPropertyNames(error as any));
      } catch (e) {
        debug = String(error);
      }
      res.status(500).json({ message: "Failed to fetch logs", debug });
    }
  });

  // Get specific log with errors
  app.get('/api/logs/:id', async (req, res) => {
    try {
      const log = await storage.getLogById(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Log not found" });
      }

      const errors = await storage.getErrorsByLogId(log.id);
      res.json({ ...log, errors });
    } catch (error) {
      console.error("Error fetching log:", error);
      res.status(500).json({ message: "Failed to fetch log" });
    }
  });

  // User management routes (demo mode - returns sample data)
  app.get('/api/users', async (req: any, res) => {
    try {
      // Return demo users for testing
      const demoUsers = [
        {
          id: "demo-user-1",
          email: "admin@example.com",
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: "demo-user-2", 
          email: "analyst@example.com",
          firstName: "Analyst",
          lastName: "User", 
          role: "analyst",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      res.json(demoUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.patch('/api/users/:id/role', async (req: any, res) => {
    try {
      // Demo mode - just return success
      res.json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch('/api/users/:id/deactivate', async (req: any, res) => {
    try {
      // Demo mode - just return success
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Failed to deactivate user" });
    }
  });

  // Telegram settings
  app.post('/api/telegram/settings', async (req: any, res) => {
    try {
      const { chatId } = req.body;
      // Demo mode - just return success
      res.json({ success: true, message: "Telegram settings saved successfully" });
    } catch (error) {
      console.error("Error saving telegram settings:", error);
      res.status(500).json({ message: "Failed to save telegram settings" });
    }
  });

  // Projects and simulations
  app.post('/api/projects', async (req: any, res) => {
    try {
      const { name, description, createdBy } = req.body;
      const project = await storage.createProject({ name, description, createdBy } as any);
      res.json(project);
    } catch (error) {
      console.error('Error creating project', error);
      res.status(500).json({ message: 'Failed to create project' });
    }
  });

  app.post('/api/simulations', async (req: any, res) => {
    try {
      const { projectId, name, iterations, config } = req.body;
      const sim = await storage.createSimulation({ projectId, name, iterations, config } as any);
      res.json(sim);
    } catch (error) {
      console.error('Error creating simulation', error);
      res.status(500).json({ message: 'Failed to create simulation' });
    }
  });

  app.post('/api/simulations/:id/scenarios', async (req: any, res) => {
    try {
      const simulationId = req.params.id;
      const { name, variables } = req.body;
      const sc = await storage.createScenario({ simulationId, name, variables } as any);
      res.json(sc);
    } catch (error) {
      console.error('Error creating scenario', error);
      res.status(500).json({ message: 'Failed to create scenario' });
    }
  });

  app.post('/api/simulations/:id/run', async (req: any, res) => {
    try {
      const simulationId = req.params.id;
      const report = await simulationService.runSimulation(simulationId);
      res.json(report);
    } catch (error) {
      console.error('Error running simulation', error);
      res.status(500).json({ message: 'Failed to run simulation', debug: String(error) });
    }
  });

  app.get('/api/reports', async (req: any, res) => {
    try {
      const projectName = req.query.projectName as string;
      if (!projectName) return res.status(400).json({ message: 'projectName query is required' });
      const reports = await storage.getReportsByProjectName(projectName);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  });

  app.get('/api/reports/:id', async (req: any, res) => {
    try {
      const id = req.params.id;
      const report = await storage.getSimulationReportById(id);
      if (!report) return res.status(404).json({ message: 'Report not found' });
      res.json(report);
    } catch (error) {
      console.error('Error fetching report', error);
      res.status(500).json({ message: 'Failed to fetch report' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
