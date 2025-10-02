import { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';

/**
 * Middleware para gerar request-id único para cada requisição
 * Facilita rastreamento e correlação de logs
 */
export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = randomUUID();
  
  // Adicionar request-id ao contexto da requisição
  (request as any).requestId = requestId;
  
  // Adicionar header de resposta
  reply.header('x-request-id', requestId);
  
  // Adicionar ao contexto de log (se disponível)
  if (request.log && (request.log as any).addBindings) {
    (request.log as any).addBindings({ request_id: requestId });
  }
}
