import { FastifyInstance } from 'fastify';
import { systemController } from '../controllers/system.controller';

/**
 * Registra rotas do sistema (health, stats)
 */
export async function systemRoutes(fastify: FastifyInstance) {
  // GET /health - Verificação de saúde da aplicação
  fastify.get('/health', {
    schema: {
      description: 'Verificação de saúde da aplicação',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            ok: { type: 'boolean' },
            version: { type: 'string' },
            timestamp: { type: 'string' }
          },
          required: ['ok', 'version', 'timestamp']
        }
      }
    }
  }, systemController.health);

  // GET /stats - Estatísticas da aplicação
  fastify.get('/stats', {
    schema: {
      description: 'Estatísticas da aplicação',
      tags: ['System'],
      response: {
        200: {
          type: 'object',
          properties: {
            cep_lookups: { type: 'number' },
            cep_cache_hits: { type: 'number' },
            nearest_queries: { type: 'number' },
            no_coverage: { type: 'number' },
            provider_errors: {
              type: 'object',
              properties: {
                brasilapi: { type: 'number' },
                viacep: { type: 'number' }
              }
            },
            revendas: {
              type: 'object',
              properties: {
                total: { type: 'number' },
                ativas: { type: 'number' },
                com_coordenadas: { type: 'number' },
                atendem_empresarial: { type: 'number' },
                atendem_residencial: { type: 'number' }
              }
            }
          }
        }
      }
    }
  }, systemController.stats);
}
