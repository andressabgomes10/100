import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';
import { logger } from './lib/logger';
import { apiKeyMiddleware } from './middlewares/apiKey';
import { errorHandler } from './middlewares/errorHandler';
import { requestIdMiddleware } from './middlewares/requestId';
import { cepRoutes } from './routes/cep.routes';
import { revendasRoutes } from './routes/revendas.routes';
import { systemRoutes } from './routes/system.routes';
import { testRoutes } from './routes/test.routes';

// Carregar variáveis de ambiente
config();

/**
 * Configuração e inicialização do servidor Fastify
 */
async function buildServer() {
  const fastify = Fastify({
    logger: false, // Usamos nosso próprio logger
    trustProxy: true,
    bodyLimit: 1048576, // 1MB
    requestTimeout: 30000, // 30s
    keepAliveTimeout: 5000,
    connectionTimeout: 10000
  });

  // Registrar plugins
  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'];
  await fastify.register(cors, {
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  await fastify.register(rateLimit, {
    max: parseInt(process.env.RATE_LIMIT_MAX || '60'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIME_WINDOW || '60000'),
    errorResponseBuilder: () => ({
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    })
  });

  // Registrar middlewares
  fastify.addHook('preHandler', requestIdMiddleware);
  fastify.addHook('preHandler', apiKeyMiddleware);
  fastify.setErrorHandler(errorHandler);

  // Registrar rotas
  await fastify.register(cepRoutes);
  await fastify.register(revendasRoutes);
  await fastify.register(systemRoutes);
  await fastify.register(testRoutes);

  // Rota raiz
  fastify.get('/', {
    schema: {
      description: 'Informações da API',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            version: { type: 'string' },
            description: { type: 'string' },
            endpoints: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      name: 'Revenda Proximidade API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'API para encontrar revenda mais próxima por CEP',
      endpoints: [
        'GET /health - Verificação de saúde',
        'GET /stats - Estatísticas da aplicação',
        'GET /cep/:cep - Busca informações de CEP',
        'GET /revendas - Lista revendas',
        'GET /revendas/:cnpj - Busca revenda por CNPJ',
        'POST /revendas - Cria/atualiza revenda',
        'POST /revenda-mais-proxima - Encontra revenda mais próxima'
      ]
    };
  });

  return fastify;
}

/**
 * Inicializa o servidor
 */
async function start() {
  try {
    const server = await buildServer();
    
    const port = parseInt(process.env.PORT || '3001');
    const host = process.env.HOST || '0.0.0.0';
    
    await server.listen({ port, host });
    
    logger.info({
      port,
      host,
      nodeEnv: process.env.NODE_ENV,
      geoProvider: process.env.GEO_PROVIDER
    }, 'Server started successfully');
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      
      try {
        await server.close();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  start();
}

export { buildServer, start };
