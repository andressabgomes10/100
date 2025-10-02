import { promises as fs } from 'fs';
import { parse } from 'csv-parse/sync';
import { Revenda } from '../types';
import { revendasService } from '../services/revendas.service';
import { logger } from '../lib/logger';

/**
 * Script para carregar dados de CSV para o banco de revendas
 * Uso: npm run etl:csv path=./data/novos_enderecos.csv
 */
async function loadCsv() {
  try {
    // Obter caminho do arquivo CSV dos argumentos da linha de comando
    const csvPath = process.argv.find(arg => arg.startsWith('path='))?.split('=')[1];
    
    if (!csvPath) {
      logger.error('CSV path not provided. Usage: npm run etl:csv path=./data/novos_enderecos.csv');
      process.exit(1);
    }
    
    logger.info({ csvPath }, 'Starting CSV load...');
    
    // Ler arquivo CSV
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    logger.info({ recordCount: records.length }, 'CSV parsed successfully');
    
    let processed = 0;
    let errors = 0;
    
    // Processar cada registro
    for (const record of records) {
      try {
        const revendaData = normalizeCsvRecord(record);
        
        if (revendaData.cnpj) {
          await revendasService.upsertRevenda(revendaData);
          processed++;
          
          if (processed % 100 === 0) {
            logger.info({ processed }, 'Processed records...');
          }
        }
      } catch (error) {
        errors++;
        logger.warn({ 
          record, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }, 'Failed to process record');
      }
    }
    
    logger.info({ 
      total: records.length, 
      processed, 
      errors 
    }, 'CSV load completed');
    
  } catch (error) {
    logger.error({ error }, 'Failed to load CSV');
    process.exit(1);
  }
}

/**
 * Normaliza registro do CSV para formato Revenda
 */
function normalizeCsvRecord(record: Record<string, string>): Partial<Revenda> & { cnpj: string } {
  // Normalizar CNPJ (apenas dígitos)
  const cnpj = record.cnpj?.replace(/\D/g, '') || '';
  
  if (cnpj.length !== 14) {
    throw new Error(`CNPJ inválido: ${record.cnpj}`);
  }
  
  // Normalizar CEP (apenas dígitos)
  const cep = record.cep?.replace(/\D/g, '') || null;
  if (cep && cep.length !== 8) {
    throw new Error(`CEP inválido: ${record.cep}`);
  }
  
  // Normalizar telefones (apenas dígitos)
  const telefone = record.telefone?.replace(/\D/g, '') || null;
  const whatsapp = record.whatsapp?.replace(/\D/g, '') || null;
  
  // Normalizar UF (2 letras maiúsculas)
  const uf = record.uf?.toUpperCase().substring(0, 2) || null;
  
  // Normalizar booleanos
  const normalizeBoolean = (value: string | undefined): boolean => {
    if (!value) return true; // Default true
    const normalized = value.toLowerCase().trim();
    return ['sim', 'true', '1', 'yes', 's'].includes(normalized);
  };
  
  // Normalizar números
  const normalizeNumber = (value: string | undefined): number | null => {
    if (!value) return null;
    const num = parseFloat(value.replace(',', '.'));
    return isNaN(num) ? null : num;
  };
  
  return {
    cnpj,
    razao_social: record.razao_social || null,
    nome_fantasia: record.nome_fantasia || null,
    cep,
    endereco: record.endereco || null,
    bairro: record.bairro || null,
    cidade: record.cidade || null,
    uf,
    telefone,
    whatsapp,
    canal_preferencial: record.canal_preferencial as 'whatsapp' | 'telefone' || null,
    latitude: normalizeNumber(record.latitude),
    longitude: normalizeNumber(record.longitude),
    ativo: normalizeBoolean(record.ativo),
    service_radius_km: normalizeNumber(record.service_radius_km),
    prioridade: normalizeNumber(record.prioridade) || 0,
    atende_empresarial: normalizeBoolean(record.atende_empresarial),
    atende_residencial: normalizeBoolean(record.atende_residencial)
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  loadCsv().then(() => {
    logger.info('CSV load completed');
    process.exit(0);
  }).catch((error) => {
    logger.error({ error }, 'CSV load failed');
    process.exit(1);
  });
}

export { loadCsv };
