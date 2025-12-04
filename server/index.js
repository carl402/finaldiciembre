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
    
    // Servir archivos estáticos del cliente React
    if (process.env.NODE_ENV === 'production') {
      const fs = require('fs');
      const clientDistPath = path.join(__dirname, '../client/dist');
      
      // Verificar si existe el directorio dist
      if (fs.existsSync(clientDistPath)) {
        app.use(express.static(clientDistPath));
        
        // Rutas específicas para SPA
        app.get('/', (req, res) => {
          res.send(`<!DOCTYPE html>
<html><head><title>Take a Look</title><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><script src="https://unpkg.com/react@18/umd/react.production.min.js"></script><script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div><script>const{useState,useEffect}=React;function App(){const[user,setUser]=useState(null);const[page,setPage]=useState('login');useEffect(()=>{fetch('/api/auth/user').then(r=>r.json()).then(u=>{setUser(u);setPage('dashboard')}).catch(()=>setPage('login'))},[]);if(page==='login')return React.createElement('div',{className:'min-h-screen bg-gray-100 flex items-center justify-center'},React.createElement('div',{className:'bg-white p-8 rounded-lg shadow-md w-96'},React.createElement('h1',{className:'text-2xl font-bold mb-6 text-center'},'Take a Look'),React.createElement('div',{className:'space-y-4'},React.createElement('input',{type:'text',placeholder:'Usuario',className:'w-full p-3 border rounded'}),React.createElement('input',{type:'password',placeholder:'Contraseña',className:'w-full p-3 border rounded'}),React.createElement('button',{onClick:()=>setPage('dashboard'),className:'w-full bg-blue-500 text-white p-3 rounded hover:bg-blue-600'},'Iniciar Sesión'))));return React.createElement('div',{className:'flex h-screen bg-gray-100'},React.createElement('div',{className:'w-64 bg-white shadow-md'},React.createElement('div',{className:'p-4'},React.createElement('h2',{className:'text-xl font-bold'},'Take a Look'),React.createElement('nav',{className:'mt-8 space-y-2'},React.createElement('button',{onClick:()=>setPage('dashboard'),className:'w-full text-left p-2 hover:bg-gray-100 rounded'},'📊 Dashboard'),React.createElement('button',{onClick:()=>setPage('logs'),className:'w-full text-left p-2 hover:bg-gray-100 rounded'},'📁 Logs'),React.createElement('button',{onClick:()=>setPage('users'),className:'w-full text-left p-2 hover:bg-gray-100 rounded'},'👥 Usuarios'),React.createElement('button',{onClick:()=>setPage('settings'),className:'w-full text-left p-2 hover:bg-gray-100 rounded'},'⚙️ Configuración')))),React.createElement('div',{className:'flex-1 p-6'},page==='dashboard'&&React.createElement('div',null,React.createElement('h1',{className:'text-3xl font-bold mb-6'},'Dashboard'),React.createElement('div',{className:'grid grid-cols-3 gap-6 mb-6'},React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('h3',{className:'text-lg font-semibold'},'Total Logs'),React.createElement('p',{className:'text-3xl font-bold text-blue-600'},'0')),React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('h3',{className:'text-lg font-semibold'},'Errores'),React.createElement('p',{className:'text-3xl font-bold text-red-600'},'0')),React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('h3',{className:'text-lg font-semibold'},'Tasa de Éxito'),React.createElement('p',{className:'text-3xl font-bold text-green-600'},'100%')))),page==='logs'&&React.createElement('div',null,React.createElement('h1',{className:'text-3xl font-bold mb-6'},'Gestión de Logs'),React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('h3',{className:'text-lg font-semibold mb-4'},'Subir Archivo'),React.createElement('input',{type:'file',className:'mb-4'}),React.createElement('button',{className:'bg-blue-500 text-white px-4 py-2 rounded'},'Subir Log'))),page==='users'&&React.createElement('div',null,React.createElement('h1',{className:'text-3xl font-bold mb-6'},'Gestión de Usuarios'),React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('p',null,'Lista de usuarios del sistema'))),page==='settings'&&React.createElement('div',null,React.createElement('h1',{className:'text-3xl font-bold mb-6'},'Configuración'),React.createElement('div',{className:'bg-white p-6 rounded-lg shadow'},React.createElement('p',null,'Configuraciones del sistema')))))}ReactDOM.render(React.createElement(App),document.getElementById('root'))</script></body></html>`);
        });
      } else {

      }
    } else {
      app.get('/', (req, res) => {
        res.send('<h1>Take a Look - Development Mode</h1>');
      });
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