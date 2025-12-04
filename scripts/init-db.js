const { config } = require('dotenv');
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
config();

async function initializeDatabase() {
  console.log('🚀 Inicializando base de datos...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL no está configurada en el archivo .env');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Verificar conexión
    console.log('📡 Verificando conexión a la base de datos...');
    const client = await pool.connect();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Ejecutar migraciones
    console.log('📋 Ejecutando migraciones...');
    
    // Migración de corrección de IDs
    const fixMigrationPath = path.join(__dirname, '..', 'migrations', '0002_fix_ids.sql');
    const fixMigrationSQL = fs.readFileSync(fixMigrationPath, 'utf-8');
    
    await client.query(fixMigrationSQL);
    console.log('✅ Migraciones ejecutadas correctamente');
    
    // Verificar que las tablas se crearon
    console.log('🔍 Verificando tablas creadas...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log('📊 Tablas encontradas:', tables);
    
    const expectedTables = [
      'sessions', 'users', 'logs', 'errors', 'notifications', 
      'projects', 'simulations', 'scenarios', 'simulation_reports'
    ];
    
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    if (missingTables.length > 0) {
      console.warn('⚠️  Tablas faltantes:', missingTables);
    } else {
      console.log('✅ Todas las tablas requeridas están presentes');
    }
    
    // Verificar usuario demo
    const userResult = await client.query('SELECT * FROM users WHERE id = $1', ['demo-user']);
    if (userResult.rows.length > 0) {
      console.log('✅ Usuario demo encontrado:', userResult.rows[0].email);
    } else {
      console.log('⚠️  Usuario demo no encontrado');
    }
    
    client.release();
    console.log('🎉 Inicialización de base de datos completada');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  initializeDatabase().catch(console.error);
}

module.exports = { initializeDatabase };