const { spawn } = require('child_process');
const { config } = require('dotenv');

// Cargar variables de entorno
config();

console.log('🚀 Iniciando servidor Take a Look...');

// Verificar que las variables de entorno estén configuradas
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL no está configurada');
  process.exit(1);
}

// Iniciar el servidor usando ts-node
const serverProcess = spawn('npx', ['ts-node', '-P', 'tsconfig.scripts.json', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('❌ Error iniciando servidor:', error);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  console.log(`🔄 Servidor terminado con código: ${code}`);
});

// Manejar señales de cierre
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  serverProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  serverProcess.kill('SIGTERM');
});