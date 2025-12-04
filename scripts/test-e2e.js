const { config } = require('dotenv');
const { Pool } = require('@neondatabase/serverless');
const crypto = require('crypto');

function generateId(prefix = '') {
  return prefix + crypto.randomUUID();
}

// Cargar variables de entorno
config();

class E2ETestSuite {
  constructor() {
    this.results = [];
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  async runTest(name, testFn) {
    const startTime = Date.now();
    try {
      console.log(`🧪 Ejecutando: ${name}`);
      await testFn();
      const duration = Date.now() - startTime;
      this.results.push({ name, success: true, duration });
      console.log(`✅ ${name} - ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.push({ 
        name, 
        success: false, 
        error: error.message,
        duration 
      });
      console.log(`❌ ${name} - ${duration}ms - Error: ${error.message}`);
    }
  }

  async testDatabaseConnection() {
    const client = await this.pool.connect();
    await client.query('SELECT 1');
    client.release();
  }

  async testUserOperations() {
    const client = await this.pool.connect();
    
    try {
      // Verificar usuario demo
      const demoResult = await client.query('SELECT * FROM users WHERE id = $1', ['demo-user']);
      if (demoResult.rows.length === 0) {
        // Crear usuario demo si no existe
        await client.query(`
          INSERT INTO users (id, email, first_name, last_name, role, is_active) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, ['demo-user', 'demo@example.com', 'Demo', 'User', 'admin', true]);
      }

      // Crear usuario de prueba
      const testUserId = generateId('test-user-');
      await client.query(`
        INSERT INTO users (id, email, first_name, last_name, role) 
        VALUES ($1, $2, $3, $4, $5)
      `, [testUserId, 'test@example.com', 'Test', 'User', 'analyst']);

      // Verificar que se creó
      const testResult = await client.query('SELECT * FROM users WHERE id = $1', [testUserId]);
      if (testResult.rows.length === 0) throw new Error('Usuario de prueba no creado');

      // Actualizar rol
      await client.query('UPDATE users SET role = $1 WHERE id = $2', ['admin', testUserId]);
      
      // Verificar actualización
      const updatedResult = await client.query('SELECT * FROM users WHERE id = $1', [testUserId]);
      if (updatedResult.rows[0].role !== 'admin') throw new Error('Rol no actualizado');

      console.log(`   Usuario creado: ${testResult.rows[0].email}`);
    } finally {
      client.release();
    }
  }

  async testLogProcessing() {
    const client = await this.pool.connect();
    
    try {
      const testLogContent = `
2024-01-15 10:30:15 INFO Application started
2024-01-15 10:30:20 ERROR Database connection failed
2024-01-15 10:30:25 WARN Retrying connection
2024-01-15 10:30:30 INFO Connected to database
2024-01-15 10:31:00 ERROR 500 Internal Server Error
2024-01-15 10:31:05 WARN 404 Page not found
2024-01-15 10:31:10 FATAL System crash detected
`;

      const logId = generateId('test-log-');
      const fileHash = 'test-hash-' + Date.now();

      // Crear log
      await client.query(`
        INSERT INTO logs (id, file_name, file_hash, file_size, content, uploaded_by, status) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [logId, 'test.log', fileHash, testLogContent.length, testLogContent, 'demo-user', 'processing']);

      // Simular detección de errores
      const errors = [
        { type: 'ERROR', message: 'Database connection failed', lineNumber: 2, severity: 'medio' },
        { type: '500', message: 'Internal Server Error', lineNumber: 5, severity: 'critico' },
        { type: '404', message: 'Page not found', lineNumber: 6, severity: 'medio' },
        { type: 'FATAL_ERROR', message: 'System crash detected', lineNumber: 7, severity: 'critico' }
      ];

      // Guardar errores
      for (const error of errors) {
        const errorId = generateId('error-');
        await client.query(`
          INSERT INTO errors (id, log_id, error_type, message, line_number, severity) 
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [errorId, logId, error.type, error.message, error.lineNumber, error.severity]);
      }

      // Verificar errores guardados
      const savedErrors = await client.query('SELECT * FROM errors WHERE log_id = $1', [logId]);
      if (savedErrors.rows.length !== errors.length) {
        throw new Error('Número de errores guardados no coincide');
      }

      // Actualizar estado del log
      await client.query('UPDATE logs SET status = $1 WHERE id = $2', ['completed', logId]);

      console.log(`   Log procesado: ${errors.length} errores detectados`);
    } finally {
      client.release();
    }
  }

  async testProjectSimulation() {
    const client = await this.pool.connect();
    
    try {
      const projectId = generateId('test-project-');
      const projectName = 'Test Project ' + Date.now();

      // Crear proyecto
      await client.query(`
        INSERT INTO projects (id, name, description, created_by) 
        VALUES ($1, $2, $3, $4)
      `, [projectId, projectName, 'Proyecto de prueba E2E', 'demo-user']);

      // Crear simulación
      const simulationId = generateId('test-sim-');
      await client.query(`
        INSERT INTO simulations (id, project_id, name, iterations, config) 
        VALUES ($1, $2, $3, $4, $5)
      `, [simulationId, projectId, 'Test Simulation', 100, JSON.stringify({ testParam: 'value' })]);

      // Crear escenario
      const scenarioId = generateId('test-scenario-');
      const variables = [{ name: 'x', distribution: 'normal', params: { mean: 0, std: 1 } }];
      await client.query(`
        INSERT INTO scenarios (id, simulation_id, name, variables) 
        VALUES ($1, $2, $3, $4)
      `, [scenarioId, simulationId, 'Test Scenario', JSON.stringify(variables)]);

      console.log(`   Proyecto creado: ${projectName}`);
    } finally {
      client.release();
    }
  }

  async testNotifications() {
    const client = await this.pool.connect();
    
    try {
      const notificationId = generateId('test-notification-');
      
      // Crear notificación
      await client.query(`
        INSERT INTO notifications (id, user_id, type, message, sent) 
        VALUES ($1, $2, $3, $4, $5)
      `, [notificationId, 'demo-user', 'test_notification', 'Notificación de prueba E2E', false]);

      // Obtener notificaciones pendientes
      const pending = await client.query('SELECT * FROM notifications WHERE sent = false AND id = $1', [notificationId]);
      if (pending.rows.length === 0) throw new Error('Notificación no encontrada en pendientes');

      // Marcar como enviada
      await client.query('UPDATE notifications SET sent = true, sent_at = NOW() WHERE id = $1', [notificationId]);

      console.log(`   Notificación procesada: ${pending.rows[0].message}`);
    } finally {
      client.release();
    }
  }

  async testDashboardStats() {
    const client = await this.pool.connect();
    
    try {
      // Estadísticas de logs
      const logStats = await client.query('SELECT COUNT(*) as total_files FROM logs');
      const completedLogs = await client.query('SELECT COUNT(*) as completed_files FROM logs WHERE status = $1', ['completed']);
      
      // Estadísticas de errores
      const errorStats = await client.query('SELECT COUNT(*) as total_errors FROM errors');
      const errorDistribution = await client.query(`
        SELECT error_type, COUNT(*) as count 
        FROM errors 
        GROUP BY error_type 
        ORDER BY count DESC
      `);

      // Tendencias de errores (últimos 7 días)
      const errorTrends = await client.query(`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM errors 
        WHERE created_at >= NOW() - INTERVAL '7 days'
        GROUP BY DATE(created_at) 
        ORDER BY date
      `);

      const totalFiles = parseInt(logStats.rows[0].total_files);
      const totalErrors = parseInt(errorStats.rows[0].total_errors);

      if (isNaN(totalFiles)) throw new Error('Estadísticas de logs inválidas');
      if (isNaN(totalErrors)) throw new Error('Estadísticas de errores inválidas');

      console.log(`   Stats: ${totalFiles} logs, ${totalErrors} errores`);
    } finally {
      client.release();
    }
  }

  async runAllTests() {
    console.log('🚀 Iniciando pruebas E2E del sistema Take a Look\n');

    await this.runTest('Conexión a Base de Datos', () => this.testDatabaseConnection());
    await this.runTest('Operaciones de Usuario', () => this.testUserOperations());
    await this.runTest('Procesamiento de Logs', () => this.testLogProcessing());
    await this.runTest('Proyectos y Simulaciones', () => this.testProjectSimulation());
    await this.runTest('Sistema de Notificaciones', () => this.testNotifications());
    await this.runTest('Estadísticas del Dashboard', () => this.testDashboardStats());

    await this.pool.end();
    this.printResults();
  }

  printResults() {
    console.log('\n📊 RESULTADOS DE PRUEBAS E2E');
    console.log('================================');
    
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`✅ Pasaron: ${passed}`);
    console.log(`❌ Fallaron: ${failed}`);
    console.log(`⏱️  Tiempo total: ${totalTime}ms`);
    console.log(`📈 Tasa de éxito: ${((passed / this.results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ PRUEBAS FALLIDAS:');
      this.results
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
    }

    console.log('\n🎉 Pruebas E2E completadas');
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

async function main() {
  const testSuite = new E2ETestSuite();
  await testSuite.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}