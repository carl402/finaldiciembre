require('dotenv/config');
const { neon } = require('@neondatabase/serverless');

async function createDemoUsers() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('👥 Creando usuarios de demostración...');
    
    // Crear usuarios demo
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
    
    // Verificar usuarios
    const users = await sql`SELECT email, first_name, role FROM users ORDER BY email`;
    console.log('\n📋 Usuarios en la base de datos:');
    users.forEach(user => console.log(`  - ${user.email} (${user.first_name} - ${user.role})`));
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
  }
}

createDemoUsers();