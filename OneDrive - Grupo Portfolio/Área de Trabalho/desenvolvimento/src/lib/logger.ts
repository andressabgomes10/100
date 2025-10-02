import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: isDevelopment ? 'debug' : 'info',
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname'
    }
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime
});

export type LogContext = {
  request_id?: string;
  route?: string;
  method?: string;
  status?: number;
  responseTime?: number;
  cep?: string;
  provider?: string;
  cache_hit?: boolean;
  error?: string;
  cnpj?: string;
  distancia_km?: number;
  api_key_id?: string;
  ip?: string;
  user_agent?: string;
  [key: string]: unknown;
};

export function logRequest(context: LogContext) {
  logger.info(context, 'Request processed');
}

export function logError(context: LogContext, error: Error) {
  logger.error({
    ...context,
    error: error.message,
    stack: error.stack
  }, 'Request failed');
}

export function logCepLookup(cep: string, provider: string, cache_hit: boolean, responseTime: number) {
  logger.info({
    cep,
    provider,
    cache_hit,
    responseTime,
    operation: 'cep_lookup'
  }, 'CEP lookup completed');
}

export function logNearestQuery(cep: string, cnpj: string, distancia_km: number, responseTime: number) {
  logger.info({
    cep,
    cnpj,
    distancia_km,
    responseTime,
    operation: 'nearest_query'
  }, 'Nearest revenda query completed');
}
