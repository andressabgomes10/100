import { FastifyRequest, FastifyReply } from 'fastify';
import { logger } from '../lib/logger';

export interface ApiKeyRequest extends FastifyRequest {
  headers: {
    'x-api-key'?: string;
  };
}

/**
 * Middleware para validar API Key
 * Bloqueia requisições sem x-api-key igual a process.env.API_KEY
 * Exceções: GET /health
 */
export async function apiKeyMiddleware(
  request: ApiKeyRequest,
  reply: FastifyReply
): Promise<void> {
  const { method, url } = request;
  
  // Exceção para rota de health
  if (method === 'GET' && url === '/health') {
    return;
  }

  const apiKey = request.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;

  if (!expectedApiKey) {
    logger.error('API_KEY not configured in environment variables');
    return reply.status(500).send({
      message: 'Server configuration error',
      code: 'MISSING_API_KEY'
    });
  }

  if (!apiKey) {
    logger.warn({
      method,
      url,
      ip: request.ip
    }, 'Request rejected: missing API key');
    
    return reply.status(401).send({
      message: 'API key is required',
      code: 'MISSING_API_KEY'
    });
  }

  if (apiKey !== expectedApiKey) {
    logger.warn({
      method,
      url,
      ip: request.ip,
      providedKey: apiKey.substring(0, 8) + '...'
    }, 'Request rejected: invalid API key');
    
    return reply.status(401).send({
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  logger.debug({
    method,
    url,
    ip: request.ip
  }, 'API key validated successfully');
}
