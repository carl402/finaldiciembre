const { config } = require('dotenv');
const { Pool } = require('@neondatabase/serverless');

// Cargar variables de entorno
config();

async function testDatabaseConnection() {
  console.log('🔍 Verificando conexión a la base de datos...');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada en el archivo .env');
    process.exit(1);
  }

  console.log('📡 URL de conexión configurada:', process.env.DATABASE_URL.replace(/:[^:@]*@/, ':****@'));

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    console.log('🔌 Intentando conectar...');
    const client = await pool.connect();
    
    console.log('✅ Conexión exitosa!');
    
    // Probar una consulta simple
    console.log('🧪 Ejecutando consulta de prueba...');
    const result = await client.query('SELECT NOW() as current_time, version() as db_version');
    
    console.log('📊 Información de la base de datos:');
    console.log('   Tiempo actual:', result.rows[0].current_time);
    console.log('   Versión:', result.rows[0].db_version.split(' ').slice(0, 2).join(' '));
    
    // Verificar si existen tablas
    console.log('🔍 Verificando tablas existentes...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Tablas encontradas:');
      tablesResult.rows.forEach(row => {
        console.log('   -', row.table_name);
      });
    } else {
      console.log('⚠️  No se encontraron tablas. La base de datos necesita ser inicializada.');
    }
    
    client.release();
    console.log('🎉 Verificación completada exitosamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Sugerencia: Verifica que la URL de la base de datos sea correcta');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Sugerencia: El servidor de base de datos no está disponible');
    } else if (error.message.includes('password authentication failed')) {
      console.error('💡 Sugerencia: Verifica las credenciales de la base de datos');
    } else if (error.message.includes('SSL')) {
      console.error('💡 Sugerencia: Problema con la conexión SSL');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testDatabaseConnection();
}

module.exports = { testDatabaseConnection };