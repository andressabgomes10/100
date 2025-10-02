import { logger } from './logger';

/**
 * Interface para implementações de cache
 */
export interface CacheInterface<T> {
  get(key: string): Promise<T | null>;
  set(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  has(key: string): Promise<boolean>;
}

/**
 * Cache em memória simples com TTL
 */
export class MemoryCache<T> implements CacheInterface<T> {
  private cache = new Map<string, { value: T; expires: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private defaultTTLSeconds: number = 300) {
    // Limpeza automática a cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async get(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.defaultTTLSeconds;
    const expires = Date.now() + (ttl * 1000);
    
    this.cache.set(key, { value, expires });
    
    logger.debug({ key, ttl }, 'Cache item set');
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    logger.debug({ key }, 'Cache item deleted');
  }

  async clear(): Promise<void> {
    this.cache.clear();
    logger.debug('Cache cleared');
  }

  async has(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    return item ? Date.now() <= item.expires : false;
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expires) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      logger.debug({ cleaned, total: this.cache.size }, 'Cache cleanup completed');
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

/**
 * Cache para CEP com TTL específico
 */
export class CepCache {
  private cache: MemoryCache<any>;

  constructor() {
    // Cache de CEP por 30 dias
    this.cache = new MemoryCache(30 * 24 * 60 * 60);
  }

  async get(cep: string): Promise<any | null> {
    const key = `cep:${cep}`;
    return await this.cache.get(key);
  }

  async set(cep: string, data: any): Promise<void> {
    const key = `cep:${cep}`;
    await this.cache.set(key, data, 30 * 24 * 60 * 60); // 30 dias
  }

  async delete(cep: string): Promise<void> {
    const key = `cep:${cep}`;
    await this.cache.delete(key);
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }
}

/**
 * Cache para resultados de busca de revendas
 */
export class RevendaCache {
  private cache: MemoryCache<any>;

  constructor() {
    // Cache de resultados por 1 hora
    this.cache = new MemoryCache(60 * 60);
  }

  async get(lat: number, lng: number, filters: any): Promise<any | null> {
    const key = `revenda:${lat.toFixed(6)}:${lng.toFixed(6)}:${JSON.stringify(filters)}`;
    return await this.cache.get(key);
  }

  async set(lat: number, lng: number, filters: any, data: any): Promise<void> {
    const key = `revenda:${lat.toFixed(6)}:${lng.toFixed(6)}:${JSON.stringify(filters)}`;
    await this.cache.set(key, data, 60 * 60); // 1 hora
  }

  async clear(): Promise<void> {
    await this.cache.clear();
  }
}

// Instâncias globais
export const cepCache = new CepCache();
export const revendaCache = new RevendaCache();
