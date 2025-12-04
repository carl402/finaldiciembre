import 'dotenv/config';
import { initializeDatabase } from './init-db';
import { storage } from '../server/storage';
import { fileProcessor } from '../server/services/fileProcessor';

interface TestResult {
  name: string;
  success: boolean;
  error?: string;
  duration: number;
}

class E2ETestSuite {
  private results: TestResult[] = [];

  async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
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
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      console.log(`❌ ${name} - ${duration}ms - Error: ${error}`);
    }
  }

  async testDatabaseConnection(): Promise<void> {
    await initializeDatabase();
  }

  async testUserOperations(): Promise<void> {
    // Crear usuario de prueba
    const testUser = await storage.upsertUser({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'analyst'
    });

    if (!testUser.id) throw new Error('Usuario no creado correctamente');

    // Obtener usuario
    const retrievedUser = await storage.getUser(testUser.id);
    if (!retrievedUser) throw new Error('Usuario no encontrado');

    // Actualizar rol
    await storage.updateUserRole(testUser.id, 'admin');
    
    // Verificar actualización
    const updatedUser = await storage.getUser(testUser.id);
    if (updatedUser?.role !== 'admin') throw new Error('Rol no actualizado');

    console.log(`   Usuario creado: ${testUser.email}`);
  }

  async testLogProcessing(): Promise<void> {
    // Crear log de prueba
    const testLogContent = `
2024-01-15 10:30:15 INFO Application started
2024-01-15 10:30:20 ERROR Database connection failed
2024-01-15 10:30:25 WARN Retrying connection
2024-01-15 10:30:30 INFO Connected to database
2024-01-15 10:31:00 ERROR 500 Internal Server Error
2024-01-15 10:31:05 WARN 404 Page not found
2024-01-15 10:31:10 FATAL System crash detected
`;

    const log = await storage.createLog({
      fileName: 'test.log',
      fileHash: 'test-hash-' + Date.now(),
      fileSize: testLogContent.length,
      content: testLogContent,
      uploadedBy: 'demo-user',
      status: 'processing'
    });

    if (!log.id) throw new Error('Log no creado correctamente');

    // Procesar archivo
    const detectedErrors = await fileProcessor.processLogFile(log.id, testLogContent);
    
    if (detectedErrors.length === 0) throw new Error('No se detectaron errores en el log');

    // Guardar errores
    for (const error of detectedErrors) {
      await storage.createError({
        logId: log.id,
        errorType: error.type,
        message: error.message,
        lineNumber: error.lineNumber,
        severity: error.severity
      });
    }

    // Verificar errores guardados
    const savedErrors = await storage.getErrorsByLogId(log.id);
    if (savedErrors.length !== detectedErrors.length) {
      throw new Error('Número de errores guardados no coincide');
    }

    // Actualizar estado del log
    await storage.updateLogStatus(log.id, 'completed');

    console.log(`   Log procesado: ${detectedErrors.length} errores detectados`);
  }

  async testProjectSimulation(): Promise<void> {
    // Crear proyecto
    const project = await storage.createProject({
      name: 'Test Project ' + Date.now(),
      description: 'Proyecto de prueba E2E',
      createdBy: 'demo-user'
    });

    if (!project.id) throw new Error('Proyecto no creado');

    // Crear simulación
    const simulation = await storage.createSimulation({
      projectId: project.id,
      name: 'Test Simulation',
      iterations: 100,
      config: { testParam: 'value' }
    });

    if (!simulation.id) throw new Error('Simulación no creada');

    // Crear escenario
    const scenario = await storage.createScenario({
      simulationId: simulation.id,
      name: 'Test Scenario',
      variables: [{ name: 'x', distribution: 'normal', params: { mean: 0, std: 1 } }]
    });

    if (!scenario.id) throw new Error('Escenario no creado');

    console.log(`   Proyecto creado: ${project.name}`);
  }

  async testNotifications(): Promise<void> {
    // Crear notificación
    const notification = await storage.createNotification({
      userId: 'demo-user',
      type: 'test_notification',
      message: 'Notificación de prueba E2E',
      sent: false
    });

    if (!notification.id) throw new Error('Notificación no creada');

    // Obtener notificaciones pendientes
    const pending = await storage.getPendingNotifications();
    const testNotification = pending.find(n => n.id === notification.id);
    
    if (!testNotification) throw new Error('Notificación no encontrada en pendientes');

    // Marcar como enviada
    await storage.markNotificationSent(notification.id);

    console.log(`   Notificación procesada: ${notification.message}`);
  }

  async testDashboardStats(): Promise<void> {
    const logStats = await storage.getLogStats();
    const errorStats = await storage.getErrorStats();
    const errorTrends = await storage.getErrorTrends(7);

    if (typeof logStats.totalFiles !== 'number') {
      throw new Error('Estadísticas de logs inválidas');
    }

    if (typeof errorStats.totalErrors !== 'number') {
      throw new Error('Estadísticas de errores inválidas');
    }

    if (!Array.isArray(errorTrends)) {
      throw new Error('Tendencias de errores inválidas');
    }

    console.log(`   Stats: ${logStats.totalFiles} logs, ${errorStats.totalErrors} errores`);
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Iniciando pruebas E2E del sistema Take a Look\n');

    await this.runTest('Conexión a Base de Datos', () => this.testDatabaseConnection());
    await this.runTest('Operaciones de Usuario', () => this.testUserOperations());
    await this.runTest('Procesamiento de Logs', () => this.testLogProcessing());
    await this.runTest('Proyectos y Simulaciones', () => this.testProjectSimulation());
    await this.runTest('Sistema de Notificaciones', () => this.testNotifications());
    await this.runTest('Estadísticas del Dashboard', () => this.testDashboardStats());

    this.printResults();
  }

  private printResults(): void {
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