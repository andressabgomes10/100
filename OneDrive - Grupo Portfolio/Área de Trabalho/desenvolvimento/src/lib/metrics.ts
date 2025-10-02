import { logger } from './logger';

/**
 * Interface para métricas da aplicação
 */
export interface Metrics {
  // Contadores
  requests_total: number;
  requests_success: number;
  requests_error: number;
  
  // CEP
  cep_lookups_total: number;
  cep_cache_hits: number;
  cep_provider_errors: Record<string, number>;
  
  // Revendas
  nearest_queries_total: number;
  nearest_no_coverage: number;
  revendas_total: number;
  revendas_active: number;
  
  // Performance
  avg_response_time_ms: number;
  max_response_time_ms: number;
  
  // Sistema
  uptime_start: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
}

/**
 * Classe para coleta e gerenciamento de métricas
 */
export class MetricsCollector {
  private metrics: Metrics;
  private responseTimes: number[] = [];
  private maxResponseTimes = 1000; // Manter apenas os últimos 1000 tempos

  constructor() {
    this.metrics = {
      requests_total: 0,
      requests_success: 0,
      requests_error: 0,
      cep_lookups_total: 0,
      cep_cache_hits: 0,
      cep_provider_errors: {},
      nearest_queries_total: 0,
      nearest_no_coverage: 0,
      revendas_total: 0,
      revendas_active: 0,
      avg_response_time_ms: 0,
      max_response_time_ms: 0,
      uptime_start: Date.now(),
      memory_usage_mb: 0,
      cpu_usage_percent: 0
    };
  }

  /**
   * Incrementa contador de requisições
   */
  incrementRequests(success: boolean = true): void {
    this.metrics.requests_total++;
    
    if (success) {
      this.metrics.requests_success++;
    } else {
      this.metrics.requests_error++;
    }
  }

  /**
   * Registra tempo de resposta
   */
  recordResponseTime(responseTimeMs: number): void {
    this.responseTimes.push(responseTimeMs);
    
    // Manter apenas os últimos N tempos
    if (this.responseTimes.length > this.maxResponseTimes) {
      this.responseTimes.shift();
    }
    
    // Atualizar métricas de tempo
    this.updateTimeMetrics();
    
    // Atualizar máximo
    if (responseTimeMs > this.metrics.max_response_time_ms) {
      this.metrics.max_response_time_ms = responseTimeMs;
    }
  }

  /**
   * Incrementa contador de lookups de CEP
   */
  incrementCepLookups(): void {
    this.metrics.cep_lookups_total++;
  }

  /**
   * Incrementa contador de cache hits de CEP
   */
  incrementCepCacheHits(): void {
    this.metrics.cep_cache_hits++;
  }

  /**
   * Incrementa contador de erros de provider de CEP
   */
  incrementCepProviderError(provider: string): void {
    if (!this.metrics.cep_provider_errors[provider]) {
      this.metrics.cep_provider_errors[provider] = 0;
    }
    this.metrics.cep_provider_errors[provider]++;
  }

  /**
   * Incrementa contador de queries de revenda mais próxima
   */
  incrementNearestQueries(): void {
    this.metrics.nearest_queries_total++;
  }

  /**
   * Incrementa contador de sem cobertura
   */
  incrementNoCoverage(): void {
    this.metrics.nearest_no_coverage++;
  }

  /**
   * Atualiza estatísticas de revendas
   */
  updateRevendasStats(total: number, active: number): void {
    this.metrics.revendas_total = total;
    this.metrics.revendas_active = active;
  }

  /**
   * Atualiza métricas de tempo
   */
  private updateTimeMetrics(): void {
    if (this.responseTimes.length === 0) return;
    
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.metrics.avg_response_time_ms = Math.round(sum / this.responseTimes.length);
  }

  /**
   * Atualiza métricas do sistema
   */
  updateSystemMetrics(): void {
    const memUsage = process.memoryUsage();
    this.metrics.memory_usage_mb = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    // CPU usage seria mais complexo de implementar, deixando como 0 por enquanto
    this.metrics.cpu_usage_percent = 0;
  }

  /**
   * Retorna métricas atuais
   */
  getMetrics(): Metrics {
    this.updateSystemMetrics();
    
    return {
      ...this.metrics,
      uptime_start: this.metrics.uptime_start
    };
  }

  /**
   * Retorna métricas formatadas para logs
   */
  getFormattedMetrics(): Record<string, any> {
    const metrics = this.getMetrics();
    const uptimeMs = Date.now() - metrics.uptime_start;
    
    return {
      // Requests
      requests_total: metrics.requests_total,
      requests_success: metrics.requests_success,
      requests_error: metrics.requests_error,
      success_rate: metrics.requests_total > 0 
        ? Math.round((metrics.requests_success / metrics.requests_total) * 100) 
        : 0,
      
      // CEP
      cep_lookups_total: metrics.cep_lookups_total,
      cep_cache_hits: metrics.cep_cache_hits,
      cep_cache_hit_rate: metrics.cep_lookups_total > 0 
        ? Math.round((metrics.cep_cache_hits / metrics.cep_lookups_total) * 100) 
        : 0,
      cep_provider_errors: metrics.cep_provider_errors,
      
      // Revendas
      nearest_queries_total: metrics.nearest_queries_total,
      nearest_no_coverage: metrics.nearest_no_coverage,
      revendas_total: metrics.revendas_total,
      revendas_active: metrics.revendas_active,
      
      // Performance
      avg_response_time_ms: metrics.avg_response_time_ms,
      max_response_time_ms: metrics.max_response_time_ms,
      
      // Sistema
      uptime_hours: Math.round(uptimeMs / (1000 * 60 * 60) * 100) / 100,
      memory_usage_mb: metrics.memory_usage_mb
    };
  }

  /**
   * Loga métricas atuais
   */
  logMetrics(): void {
    const formatted = this.getFormattedMetrics();
    logger.info(formatted, 'Application metrics');
  }

  /**
   * Reseta métricas
   */
  reset(): void {
    this.metrics = {
      requests_total: 0,
      requests_success: 0,
      requests_error: 0,
      cep_lookups_total: 0,
      cep_cache_hits: 0,
      cep_provider_errors: {},
      nearest_queries_total: 0,
      nearest_no_coverage: 0,
      revendas_total: 0,
      revendas_active: 0,
      avg_response_time_ms: 0,
      max_response_time_ms: 0,
      uptime_start: Date.now(),
      memory_usage_mb: 0,
      cpu_usage_percent: 0
    };
    
    this.responseTimes = [];
    
    logger.info('Metrics reset');
  }
}

// Instância global
export const metricsCollector = new MetricsCollector();

// Log de métricas a cada 5 minutos
setInterval(() => {
  metricsCollector.logMetrics();
}, 5 * 60 * 1000);
