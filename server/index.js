require('dotenv/config');
const express = require('express');
const { Pool } = require('@neondatabase/serverless');
const path = require('path');

const app = express();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Take a Look...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ Base de datos conectada');
    
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    
    // Servir archivos estáticos
    app.use(express.static(path.join(__dirname, '../public')));
    
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
    
    app.get('/health', async (req, res) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });
    
    app.get('/api/auth/user', (req, res) => {
      res.json({ id: "demo-user", email: "demo@example.com", firstName: "Demo", lastName: "User", role: "admin" });
    });
    
    app.get('/api/dashboard/stats', async (req, res) => {
      try {
        const client = await pool.connect();
        const logsResult = await client.query('SELECT COUNT(*) as total FROM logs');
        const errorsResult = await client.query('SELECT COUNT(*) as total FROM errors');
        client.release();
        res.json({ totalFiles: parseInt(logsResult.rows[0]?.total || 0), totalErrors: parseInt(errorsResult.rows[0]?.total || 0), successRate: 100 });
      } catch (error) {
        res.json({ totalFiles: 0, totalErrors: 0, successRate: 100 });
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