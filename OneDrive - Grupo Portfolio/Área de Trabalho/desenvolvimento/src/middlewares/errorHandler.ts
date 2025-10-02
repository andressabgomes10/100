import { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { HttpError, TimeoutError } from '../lib/http';
import { logger, logError } from '../lib/logger';

export interface ErrorResponse {
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Middleware global de tratamento de erros
 * Padroniza respostas de erro em formato JSON
 */
export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const { method, url } = request;
  
  // Log do erro
  logError({
    method,
    url,
    status: error.statusCode || 500
  }, error);

  let statusCode = 500;
  let response: ErrorResponse = {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  };

  // Erro de validação Zod
  if (error instanceof ZodError) {
    statusCode = 400;
    response = {
      message: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    };
  }
  // Erro HTTP (timeout, 4xx, 5xx)
  else if (error instanceof HttpError) {
    statusCode = error.status;
    response = {
      message: error.message,
      code: error.status >= 500 ? 'PROVIDER_UNAVAILABLE' : 'HTTP_ERROR'
    };
  }
  // Erro de timeout
  else if (error instanceof TimeoutError) {
    statusCode = 408;
    response = {
      message: 'Request timeout',
      code: 'TIMEOUT_ERROR'
    };
  }
  // Erro de validação de CEP
  else if (error.message.includes('CEP') && error.message.includes('inválido')) {
    statusCode = 400;
    response = {
      message: error.message,
      code: 'INVALID_CEP'
    };
  }
  // Erro de CEP não encontrado
  else if (error.message.includes('CEP não encontrado')) {
    statusCode = 404;
    response = {
      message: error.message,
      code: 'CEP_NOT_FOUND'
    };
  }
  // Erro de cobertura
  else if (error.message.includes('Sem cobertura')) {
    statusCode = 404;
    response = {
      message: error.message,
      code: 'NO_COVERAGE'
    };
  }
  // Erro de Fastify (statusCode já definido)
  else if (error.statusCode) {
    statusCode = error.statusCode;
    response = {
      message: error.message || 'Request failed',
      code: error.code || 'FASTIFY_ERROR'
    };
  }

  // Em desenvolvimento, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      stack: error.stack,
      originalError: error.message
    };
  }

  reply.status(statusCode).send(response);
}

/**
 * Classe para erros customizados da aplicação
 */
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'APP_ERROR'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Função helper para lançar erros de validação
 */
export function throwValidationError(message: string, field?: string): never {
  const error = new AppError(message, 400, 'VALIDATION_ERROR');
  if (field) {
    error.message = `${field}: ${message}`;
  }
  throw error;
}

/**
 * Função helper para lançar erros de CEP
 */
export function throwCepError(message: string): never {
  throw new AppError(message, 400, 'INVALID_CEP');
}

/**
 * Função helper para lançar erros de não encontrado
 */
export function throwNotFoundError(message: string): never {
  throw new AppError(message, 404, 'NOT_FOUND');
}
