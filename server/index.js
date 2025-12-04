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
    
    // Servir archivos estáticos en producción
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/dist')));
    }
    
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
    
    // API básica
    app.get('/api/auth/user', (req, res) => {
      res.json({
        id: "demo-user",
        email: "demo@example.com",
        firstName: "Demo",
        lastName: "User",
        role: "admin"
      });
    });
    
    // Catch-all para SPA
    if (process.env.NODE_ENV === 'production') {
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/') || req.path === '/health') {
          return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
      });
    }
    
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