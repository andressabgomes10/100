import { StatsResponse } from '../types';
import { logger } from '../lib/logger';

/**
 * Serviço de estatísticas em memória
 * TODO: Substituir por sistema de métricas mais robusto (Prometheus, etc.)
 */
class StatsService {
  private stats: StatsResponse = {
    cep_lookups: 0,
    cep_cache_hits: 0,
    nearest_queries: 0,
    no_coverage: 0,
    provider_errors: {
      brasilapi: 0,
      viacep: 0
    }
  };

  /**
   * Incrementa contador de consultas de CEP
   */
  incrementCepLookups(): void {
    this.stats.cep_lookups++;
    logger.debug({ total: this.stats.cep_lookups }, 'CEP lookup incremented');
  }

  /**
   * Incrementa contador de cache hits de CEP
   */
  incrementCepCacheHits(): void {
    this.stats.cep_cache_hits++;
    logger.debug({ total: this.stats.cep_cache_hits }, 'CEP cache hit incremented');
  }

  /**
   * Incrementa contador de consultas de proximidade
   */
  incrementNearestQueries(): void {
    this.stats.nearest_queries++;
    logger.debug({ total: this.stats.nearest_queries }, 'Nearest query incremented');
  }

  /**
   * Incrementa contador de sem cobertura
   */
  incrementNoCoverage(): void {
    this.stats.no_coverage++;
    logger.debug({ total: this.stats.no_coverage }, 'No coverage incremented');
  }

  /**
   * Incrementa contador de erros de provedor
   */
  incrementProviderError(provider: 'brasilapi' | 'viacep'): void {
    this.stats.provider_errors[provider]++;
    logger.debug({ 
      provider, 
      total: this.stats.provider_errors[provider] 
    }, 'Provider error incremented');
  }

  /**
   * Retorna estatísticas atuais
   */
  getStats(): StatsResponse {
    return { ...this.stats };
  }

  /**
   * Reseta todas as estatísticas
   */
  resetStats(): void {
    this.stats = {
      cep_lookups: 0,
      cep_cache_hits: 0,
      nearest_queries: 0,
      no_coverage: 0,
      provider_errors: {
        brasilapi: 0,
        viacep: 0
      }
    };
    logger.info('Stats reset');
  }

  /**
   * Retorna estatísticas formatadas para logs
   */
  getFormattedStats(): string {
    const { cep_lookups, cep_cache_hits, nearest_queries, no_coverage, provider_errors } = this.stats;
    const cacheHitRate = cep_lookups > 0 ? ((cep_cache_hits / cep_lookups) * 100).toFixed(1) : '0.0';
    
    return [
      `CEP Lookups: ${cep_lookups}`,
      `Cache Hits: ${cep_cache_hits} (${cacheHitRate}%)`,
      `Nearest Queries: ${nearest_queries}`,
      `No Coverage: ${no_coverage}`,
      `Provider Errors - BrasilAPI: ${provider_errors.brasilapi}, ViaCEP: ${provider_errors.viacep}`
    ].join(' | ');
  }
}

// Instância singleton do serviço
export const statsService = new StatsService();
