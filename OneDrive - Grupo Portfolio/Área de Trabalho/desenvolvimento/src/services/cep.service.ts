import { z } from 'zod';
import { CepInfo, BrasilApiCepResponse, ViaCepResponse } from '../types';
import { httpRequestWithRetry, HttpError } from '../lib/http';
import { logger, logCepLookup } from '../lib/logger';
import { throwCepError } from '../middlewares/errorHandler';

// Cache in-memory para CEPs com TTL de 30 dias
const cepCache = new Map<string, { data: CepInfo; expires: number }>();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 dias em ms

// Schema de validação para CEP
const cepSchema = z.string()
  .regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos')
  .transform(val => val.replace(/\D/g, ''));

/**
 * Normaliza CEP removendo caracteres não numéricos e validando formato
 */
export function normalizeCep(cep: string): string {
  try {
    return cepSchema.parse(cep);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throwCepError(error.errors[0].message);
    }
    throw error;
  }
}

/**
 * Busca informações do CEP na BrasilAPI
 */
export async function fetchFromBrasilAPI(cep: string): Promise<CepInfo> {
  const startTime = Date.now();
  
  try {
    const url = `https://brasilapi.com.br/api/cep/v1/${cep}`;
    logger.debug({ url, cep }, 'Fetching CEP from BrasilAPI');
    
    const response = await httpRequestWithRetry(url, {}, 2);
    const data = await response.json() as BrasilApiCepResponse;
    
    const cepInfo: CepInfo = {
      cep: data.cep.replace(/\D/g, ''),
      rua: data.street || null,
      bairro: data.neighborhood || null,
      cidade: data.city,
      uf: data.state,
      provider: 'brasilapi'
    };
    
    const responseTime = Date.now() - startTime;
    logCepLookup(cep, 'brasilapi', false, responseTime);
    
    return cepInfo;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error({ cep, error, responseTime }, 'Failed to fetch CEP from BrasilAPI');
    
    if (error instanceof HttpError && error.status === 404) {
      throw new Error(`CEP ${cep} não encontrado`);
    }
    
    throw error;
  }
}

/**
 * Busca informações do CEP na ViaCEP
 */
export async function fetchFromViaCEP(cep: string): Promise<CepInfo> {
  const startTime = Date.now();
  
  try {
    const url = `https://viacep.com.br/ws/${cep}/json/`;
    logger.debug({ url, cep }, 'Fetching CEP from ViaCEP');
    
    const response = await httpRequestWithRetry(url, {}, 2);
    const data = await response.json() as ViaCepResponse;
    
    if (data.erro) {
      throw new Error(`CEP ${cep} não encontrado`);
    }
    
    const cepInfo: CepInfo = {
      cep: data.cep.replace(/\D/g, ''),
      rua: data.logradouro || null,
      bairro: data.bairro || null,
      cidade: data.localidade,
      uf: data.uf,
      ibge: data.ibge || null,
      provider: 'viacep'
    };
    
    const responseTime = Date.now() - startTime;
    logCepLookup(cep, 'viacep', false, responseTime);
    
    return cepInfo;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logger.error({ cep, error, responseTime }, 'Failed to fetch CEP from ViaCEP');
    
    if (error instanceof Error && error.message.includes('não encontrado')) {
      throw error;
    }
    
    throw new Error(`Erro ao consultar CEP ${cep} na ViaCEP`);
  }
}

/**
 * Busca informações do CEP com fallback entre BrasilAPI e ViaCEP
 * Implementa cache in-memory com TTL de 30 dias
 */
export async function getCepInfo(cep: string): Promise<CepInfo> {
  const normalizedCep = normalizeCep(cep);
  const startTime = Date.now();
  
  // Verificar cache
  const cached = cepCache.get(normalizedCep);
  if (cached && cached.expires > Date.now()) {
    const responseTime = Date.now() - startTime;
    logCepLookup(normalizedCep, cached.data.provider, true, responseTime);
    logger.debug({ cep: normalizedCep }, 'CEP found in cache');
    return cached.data;
  }
  
  let cepInfo: CepInfo;
  let provider: 'brasilapi' | 'viacep';
  
  try {
    // Tentar BrasilAPI primeiro
    cepInfo = await fetchFromBrasilAPI(normalizedCep);
    provider = 'brasilapi';
  } catch (error) {
    logger.warn({ cep: normalizedCep, error }, 'BrasilAPI failed, trying ViaCEP');
    
    try {
      // Fallback para ViaCEP
      cepInfo = await fetchFromViaCEP(normalizedCep);
      provider = 'viacep';
    } catch (viacepError) {
      logger.error({ cep: normalizedCep, error, viacepError }, 'Both CEP providers failed');
      throw new Error(`CEP ${normalizedCep} não encontrado em nenhum provedor`);
    }
  }
  
  // Armazenar no cache
  cepCache.set(normalizedCep, {
    data: cepInfo,
    expires: Date.now() + CACHE_TTL
  });
  
  const responseTime = Date.now() - startTime;
  logCepLookup(normalizedCep, provider, false, responseTime);
  
  logger.info({
    cep: normalizedCep,
    provider,
    cidade: cepInfo.cidade,
    uf: cepInfo.uf,
    responseTime
  }, 'CEP lookup completed successfully');
  
  return cepInfo;
}

/**
 * Limpa o cache de CEPs (útil para testes)
 */
export function clearCepCache(): void {
  cepCache.clear();
  logger.info('CEP cache cleared');
}

/**
 * Retorna estatísticas do cache de CEP
 */
export function getCepCacheStats(): { size: number; entries: Array<{ cep: string; expires: number }> } {
  const entries = Array.from(cepCache.entries()).map(([cep, data]) => ({
    cep,
    expires: data.expires
  }));
  
  return {
    size: cepCache.size,
    entries
  };
}
