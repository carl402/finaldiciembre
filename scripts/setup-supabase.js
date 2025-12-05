const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.cowlhqyvwlreakopucki:montecarlo@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function setupSupabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up Supabase database...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR UNIQUE,
        password VARCHAR,
        first_name VARCHAR,
        last_name VARCHAR,
        role VARCHAR DEFAULT 'analyst',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Users table created');
    
    // Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        description TEXT,
        status VARCHAR DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Projects table created');
    
    // Create simulation_reports table
    await client.query(`
      CREATE TABLE IF NOT EXISTS simulation_reports (
        id SERIAL PRIMARY KEY,
        name VARCHAR,
        project_name VARCHAR,
        config JSONB,
        results JSONB,
        variables JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Reports table created');
    
    // Insert demo users
    await client.query(`
      INSERT INTO users (email, password, first_name, last_name, role)
      VALUES 
        ('admin@montecarlo.com', 'admin123', 'Admin', 'Sistema', 'admin'),
        ('analyst@montecarlo.com', 'analyst123', 'Ana', 'Lyst', 'analyst')
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role
    `);
    console.log('✅ Demo users created');
    
    // Insert demo projects
    await client.query(`
      INSERT INTO projects (name, description)
      VALUES 
        ('Proyecto Demo', 'Proyecto de demostración Monte Carlo'),
        ('Análisis Financiero', 'Simulación de riesgo financiero')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Demo projects created');
    
    console.log('\n🎯 Supabase setup completed!');
    console.log('📋 Login credentials:');
    console.log('   Email: admin@montecarlo.com');
    console.log('   Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

setupSupabase();