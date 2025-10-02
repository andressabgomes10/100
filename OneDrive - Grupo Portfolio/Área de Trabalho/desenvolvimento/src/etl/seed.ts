import { revendasDB } from '../lib/filedb';
import { logger } from '../lib/logger';

/**
 * Script para inicializar o banco de dados de revendas
 * Cria o arquivo db/revendas.json se não existir
 */
async function seed() {
  try {
    logger.info('Starting database seed...');
    
    // Verificar se o arquivo já existe
    const exists = await revendasDB.exists();
    
    if (exists) {
      logger.info('Database file already exists, skipping seed');
      return;
    }
    
    // Criar diretório se não existir
    await revendasDB.ensureDir();
    
    // Inicializar com array vazio
    await revendasDB.write([]);
    
    logger.info('Database seeded successfully with empty array');
    
  } catch (error) {
    logger.error({ error }, 'Failed to seed database');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  seed().then(() => {
    logger.info('Seed completed');
    process.exit(0);
  }).catch((error) => {
    logger.error({ error }, 'Seed failed');
    process.exit(1);
  });
}

export { seed };
