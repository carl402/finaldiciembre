require('dotenv/config');
const { neon } = require('@neondatabase/serverless');
const fs = require('fs');

async function runMigration() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('🔄 Ejecutando migración Monte Carlo...');
    
    // Leer y ejecutar migración
    const migration = fs.readFileSync('./migrations/0003_monte_carlo_structure.sql', 'utf8');
    
    // Dividir en comandos individuales
    const commands = migration.split(';').filter(cmd => cmd.trim());
    
    for (const command of commands) {
      if (command.trim()) {
        try {
          await sql(command);
          console.log('✅ Comando ejecutado:', command.substring(0, 50) + '...');
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('⚠️ Ya existe:', command.substring(0, 50) + '...');
          } else {
            console.error('❌ Error:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Migración completada');
    
    // Verificar tablas creadas
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('📋 Tablas en la base de datos:');
    tables.forEach(table => console.log(`  - ${table.table_name}`));
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
  }
}

runMigration();