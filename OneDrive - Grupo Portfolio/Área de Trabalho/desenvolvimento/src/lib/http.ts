import fetch, { Response } from 'node-fetch';
import { logger } from './logger';

export interface HttpOptions {
  timeout?: number;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: string;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    message?: string
  ) {
    super(message || `HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
  }
}

export class TimeoutError extends Error {
  constructor(timeout: number) {
    super(`Request timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

export async function httpRequest(
  url: string,
  options: HttpOptions = {}
): Promise<Response> {
  const {
    timeout = parseInt(process.env.HTTP_TIMEOUT || '8000'),
    headers = {},
    method = 'GET',
    body
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'User-Agent': 'RevendaProximidadeAPI/1.0.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers
      },
      body,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new HttpError(
        response.status,
        response.statusText,
        url,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(timeout);
    }
    
    throw error;
  }
}

export async function httpGet(url: string, options: Omit<HttpOptions, 'method' | 'body'> = {}): Promise<Response> {
  return httpRequest(url, { ...options, method: 'GET' });
}

export async function httpPost(url: string, body: string, options: Omit<HttpOptions, 'method' | 'body'> = {}): Promise<Response> {
  return httpRequest(url, { ...options, method: 'POST', body });
}

/**
 * Executa requisição HTTP com retry exponencial
 */
export async function httpRequestWithRetry(
  url: string,
  options: HttpOptions = {},
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await httpRequest(url, options);
    } catch (error) {
      lastError = error as Error;
      
      // Não fazer retry para erros 4xx (exceto 408 timeout)
      if (error instanceof HttpError && error.status >= 400 && error.status < 500 && error.status !== 408) {
        throw error;
      }
      
      // Se é a última tentativa, lança o erro
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Backoff exponencial: 300ms, 1200ms, 4800ms...
      const delay = 300 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      logger.warn({
        url,
        attempt: attempt + 1,
        maxRetries,
        delay,
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 'HTTP request failed, retrying...');
    }
  }
  
  throw lastError!;
}
