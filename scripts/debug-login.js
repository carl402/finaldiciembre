require('dotenv/config');
const { neon } = require('@neondatabase/serverless');

async function debugLogin() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔍 Verificando usuarios en la base de datos...');
    
    // Verificar todos los usuarios
    const users = await sql`SELECT id, email, password, first_name, role FROM users ORDER BY email`;
    
    console.log('📋 Usuarios encontrados:');
    users.forEach(user => {
      console.log(`  - ID: ${user.id}`);
      console.log(`    Email: ${user.email}`);
      console.log(`    Password: ${user.password}`);
      console.log(`    Name: ${user.first_name}`);
      console.log(`    Role: ${user.role}`);
      console.log('    ---');
    });
    
    // Probar login específico
    const testEmail = 'admin@montecarlo.com';
    const testPassword = 'admin123';
    
    console.log(`🧪 Probando login con: ${testEmail} / ${testPassword}`);
    
    const loginUser = await sql`
      SELECT id, email, password, first_name, role 
      FROM users 
      WHERE email = ${testEmail} AND password = ${testPassword}
    `;
    
    if (loginUser.length > 0) {
      console.log('✅ Login exitoso:', loginUser[0]);
    } else {
      console.log('❌ Login fallido - usuario no encontrado');
      
      // Verificar si existe el email
      const emailCheck = await sql`SELECT email, password FROM users WHERE email = ${testEmail}`;
      if (emailCheck.length > 0) {
        console.log('📧 Email existe, pero contraseña no coincide:');
        console.log(`   Esperada: ${testPassword}`);
        console.log(`   En BD: ${emailCheck[0].password}`);
      } else {
        console.log('📧 Email no existe en la base de datos');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugLogin();