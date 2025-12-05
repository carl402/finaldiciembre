require('dotenv/config');
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();

async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Take a Look...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL no está configurada');
    }
    
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
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
    
    // Authentication routes
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        const client = await pool.connect();
        const result = await client.query(
          'SELECT id, email, first_name, last_name, role FROM users WHERE email = $1 AND password = $2',
          [email, password]
        );
        client.release();
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          res.json({
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (error) {
        res.status(500).json({ error: 'Server error' });
      }
    });
    
    // Projects routes
    app.get('/api/projects', async (req, res) => {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM projects ORDER BY created_at DESC');
        client.release();
        res.json(result.rows);
      } catch (error) {
        res.json([]);
      }
    });
    
    app.post('/api/projects', async (req, res) => {
      try {
        const { name, description } = req.body;
        const client = await pool.connect();
        const result = await client.query(
          'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *',
          [name, description]
        );
        client.release();
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create project' });
      }
    });
    
    app.delete('/api/projects/:id', async (req, res) => {
      try {
        const client = await pool.connect();
        await client.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
        client.release();
        res.json({ message: 'Project deleted' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete project' });
      }
    });
    
    // Users routes
    app.get('/api/users', async (req, res) => {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT id, email, first_name, last_name, role FROM users ORDER BY created_at DESC');
        client.release();
        res.json(result.rows);
      } catch (error) {
        res.json([]);
      }
    });
    
    app.post('/api/users', async (req, res) => {
      try {
        const { firstName, lastName, email, password, role } = req.body;
        const client = await pool.connect();
        const result = await client.query(
          'INSERT INTO users (email, password, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, first_name, last_name, role',
          [email, password || 'default123', firstName, lastName, role || 'analyst']
        );
        client.release();
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create user' });
      }
    });
    
    app.put('/api/users/:id', async (req, res) => {
      try {
        const { firstName, lastName, email, password, role } = req.body;
        const client = await pool.connect();
        let query, params;
        
        if (password) {
          query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, password = $4, role = $5 WHERE id = $6 RETURNING id, email, first_name, last_name, role';
          params = [firstName, lastName, email, password, role, req.params.id];
        } else {
          query = 'UPDATE users SET first_name = $1, last_name = $2, email = $3, role = $4 WHERE id = $5 RETURNING id, email, first_name, last_name, role';
          params = [firstName, lastName, email, role, req.params.id];
        }
        
        const result = await client.query(query, params);
        client.release();
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
      }
    });
    
    app.delete('/api/users/:id', async (req, res) => {
      try {
        const client = await pool.connect();
        await client.query('DELETE FROM users WHERE id = $1', [req.params.id]);
        client.release();
        res.json({ message: 'User deleted' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
      }
    });
    
    // Reports routes
    app.get('/api/reports', async (req, res) => {
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM simulation_reports ORDER BY created_at DESC');
        client.release();
        res.json(result.rows);
      } catch (error) {
        res.json([]);
      }
    });
    
    app.post('/api/reports', async (req, res) => {
      try {
        const { name, project, projectName, config, results, variables } = req.body;
        const client = await pool.connect();
        const result = await client.query(
          'INSERT INTO simulation_reports (name, project_name, config, results, variables) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [name, projectName || project, JSON.stringify(config), JSON.stringify(results), JSON.stringify(variables)]
        );
        client.release();
        res.json(result.rows[0]);
      } catch (error) {
        res.status(500).json({ error: 'Failed to create report' });
      }
    });
    
    app.delete('/api/reports/:id', async (req, res) => {
      try {
        const client = await pool.connect();
        await client.query('DELETE FROM simulation_reports WHERE id = $1', [req.params.id]);
        client.release();
        res.json({ message: 'Report deleted' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete report' });
      }
    });
    
    // Download route
    app.post('/api/reports/:id/download', async (req, res) => {
      try {
        const { format } = req.body;
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM simulation_reports WHERE id = $1', [req.params.id]);
        client.release();
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Report not found' });
        }
        
        const report = result.rows[0];
        const content = `REPORTE MONTE CARLO\n\nProyecto: ${report.project_name}\nFecha: ${new Date(report.created_at).toLocaleDateString()}\n\nReporte generado por Sistema Monte Carlo`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${report.name}.txt"`);
        res.send(content);
      } catch (error) {
        res.status(500).json({ error: 'Failed to generate document' });
      }
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