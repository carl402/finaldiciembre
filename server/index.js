require('dotenv/config');
const express = require('express');
const { Pool } = require('@neondatabase/serverless');
const path = require('path');

const app = express();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Take a Look...');
    
    // Verificar conexión a base de datos
    console.log('📡 Verificando conexión a base de datos...');
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada en las variables de entorno');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Conexión a base de datos exitosa');
    
    // Middleware básico
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false, limit: '50mb' }));
    
    // Middleware de logging
    app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
    
    // Middleware de manejo de errores
    app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
    
    // Servir archivos estáticos básicos
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Take a Look - Log Analysis System</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            h1 { color: #333; text-align: center; }
            .status { background: #e8f5e8; padding: 20px; border-radius: 4px; margin: 20px 0; }
            .api-list { background: #f8f9fa; padding: 20px; border-radius: 4px; }
            .endpoint { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚀 Take a Look System</h1>
            <div class="status">
              <h3>✅ Sistema Operativo</h3>
              <p>El servidor está funcionando correctamente.</p>
            </div>
            <div class="api-list">
              <h3>📡 API Endpoints Disponibles:</h3>
              <div class="endpoint"><strong>GET /health</strong> - Health check</div>
              <div class="endpoint"><strong>GET /api/auth/user</strong> - Usuario demo</div>
              <div class="endpoint"><strong>GET /api/logs</strong> - Lista de logs</div>
              <div class="endpoint"><strong>GET /api/dashboard/stats</strong> - Estadísticas</div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
    
    // Health check
    app.get('/health', async (req, res) => {
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
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
          error: error.message
        });
      }
    });
    
    // API básica con manejo de errores
    app.get('/api/auth/user', (req, res) => {
      try {
        res.json({
          id: "demo-user",
          email: "demo@example.com",
          firstName: "Demo",
          lastName: "User",
          role: "admin"
        });
      } catch (error) {
        res.status(500).json({ error: 'Auth error' });
      }
    });
    
    // API endpoints básicos
    app.get('/api/logs', async (req, res) => {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM logs ORDER BY created_at DESC LIMIT 50');
        client.release();
        res.json(result.rows || []);
      } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
      }
    });
    
    app.get('/api/dashboard/stats', async (req, res) => {
      try {
        const client = await pool.connect();
        const logsResult = await client.query('SELECT COUNT(*) as total FROM logs');
        const errorsResult = await client.query('SELECT COUNT(*) as total FROM errors');
        client.release();
        
        res.json({
          totalFiles: parseInt(logsResult.rows[0]?.total || 0),
          totalErrors: parseInt(errorsResult.rows[0]?.total || 0),
          successRate: 95,
          errorTrends: []
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
    
    // Catch all API errors
    app.use('/api', (req, res, next) => {
      if (!res.headersSent) {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
    

    
    // Configurar puerto
    const port = parseInt(process.env.PORT || '5001', 10);
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';
    
    // Iniciar servidor
    app.listen(port, host, () => {
      console.log(`🌐 Servidor ejecutándose en http://${host}:${port}`);
      console.log(`🏥 Health check disponible en http://${host}:${port}/health`);
      console.log('✨ Servidor listo para recibir conexiones');
    });
    
  } catch (error) {
    console.error('❌ Error fatal iniciando servidor:', error);
    process.exit(1);
  }
}

startServer();