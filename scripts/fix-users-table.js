require('dotenv/config');
const { neon } = require('@neondatabase/serverless');

async function fixUsersTable() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔧 Verificando estructura de tabla users...');
    
    // Verificar columnas existentes
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    console.log('📋 Columnas actuales en users:');
    columns.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
    
    // Agregar columna password si no existe
    const hasPassword = columns.some(col => col.column_name === 'password');
    
    if (!hasPassword) {
      console.log('➕ Agregando columna password...');
      await sql`ALTER TABLE users ADD COLUMN password VARCHAR`;
      console.log('✅ Columna password agregada');
    } else {
      console.log('✅ Columna password ya existe');
    }
    
    // Crear usuarios demo
    console.log('👥 Creando usuarios de demostración...');
    
    await sql`
      INSERT INTO users (email, password, first_name, last_name, role) 
      VALUES 
        ('admin@montecarlo.com', 'admin123', 'Admin', 'User', 'admin'),
        ('analyst@montecarlo.com', 'analyst123', 'Analyst', 'User', 'analyst')
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role
    `;
    
    console.log('✅ Usuarios creados:');
    console.log('  - admin@montecarlo.com / admin123 (Admin)');
    console.log('  - analyst@montecarlo.com / analyst123 (Analyst)');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixUsersTable();