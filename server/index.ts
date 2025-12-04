import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { db } from "./db";

const app = express();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Monte Carlo...');
    
    // Verificar conexión a base de datos
    console.log('📡 Verificando conexión a base de datos...');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada en las variables de entorno');
    }
    
    // Probar conexión
    await db.execute('SELECT 1');
    console.log('✅ Conexión a base de datos exitosa');
    
    // Registrar rutas
    console.log('🛣️  Registrando rutas de la API...');
    const server = await registerRoutes(app);
    
    // Middleware de parsing después de las rutas de upload
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    
    // Middleware de manejo de errores global
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error('❌ Error del servidor:', {
        status,
        message,
        stack: err.stack,
        url: _req.url,
        method: _req.method
      });
      
      res.status(status).json({ 
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
    
    // Servir archivos estáticos en producción
    if (process.env.NODE_ENV === 'production') {
      const path = require('path');
      const distPath = path.join(__dirname, '../../client/dist');

      // ensure the build exists
      try {
        const fs = require('fs');
        if (!fs.existsSync(distPath)) {
          console.warn(`Production build not found at ${distPath}. Make sure to run client build.`);
        } else {
          app.use(express.static(distPath));

          // serve index.html for any non-API route so SPA routing works
          app.get('*', (req, res, next) => {
            if (req.path.startsWith('/api/') || req.path === '/health') return next();
            res.sendFile(path.join(distPath, 'index.html'));
          });
        }
      } catch (err) {
        console.warn('Error checking production dist path', err);
      }
    }
    
    // Ruta de health check
    app.get('/health', async (_req, res) => {
      try {
        await db.execute('SELECT 1');
        res.json({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          database: 'connected'
        });
      } catch (error) {
        res.status(503).json({ 
          status: 'unhealthy', 
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
    
    // Configurar puerto
    const port = parseInt(process.env.PORT || '5001', 10);
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    
    // Iniciar servidor
    server.listen({ port, host }, () => {
      console.log(`🌐 Servidor ejecutándose en http://${host}:${port}`);
      console.log(`🏥 Health check disponible en http://${host}:${port}/health`);
      console.log('✨ Servidor listo para recibir conexiones');
    });
    
    // Manejo de señales de cierre
    process.on('SIGTERM', () => {
      console.log('📴 Recibida señal SIGTERM, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      console.log('📴 Recibida señal SIGINT, cerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();
