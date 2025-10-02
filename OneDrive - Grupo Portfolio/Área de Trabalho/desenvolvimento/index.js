// Arquivo de entrada simplificado para Railway
console.log('🚀 Iniciando API de Revendas...');

// Verificar se o build foi feito
const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, 'dist', 'server.js');

if (!fs.existsSync(distPath)) {
  console.error('❌ Arquivo dist/server.js não encontrado. Execute npm run build primeiro.');
  process.exit(1);
}

console.log('✅ Arquivo dist/server.js encontrado. Iniciando servidor...');

// Importar e iniciar o servidor principal
try {
  require('./dist/server.js');
} catch (error) {
  console.error('❌ Erro ao iniciar servidor:', error.message);
  process.exit(1);
}
