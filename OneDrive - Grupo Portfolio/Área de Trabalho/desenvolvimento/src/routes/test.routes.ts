import { FastifyInstance } from 'fastify';
import { testController } from '../controllers/test.controller';

/**
 * Registra rotas de teste
 */
export async function testRoutes(fastify: FastifyInstance) {
  // POST /test/revenda-mais-proxima - Encontra revenda mais próxima por coordenadas
  fastify.post('/test/revenda-mais-proxima', {
    schema: {
      description: 'Encontra revenda mais próxima por coordenadas (para teste)',
      tags: ['Test'],
      body: {
        type: 'object',
        required: ['lat', 'lng'],
        properties: {
          lat: {
            type: 'number',
            minimum: -90,
            maximum: 90
          },
          lng: {
            type: 'number',
            minimum: -180,
            maximum: 180
          },
          tipo: {
            type: 'string',
            enum: ['empresarial', 'residencial']
          }
        }
      },
      response: {
        200: {
          description: 'Revenda mais próxima encontrada',
          type: 'object',
          properties: {
            revenda: {
              type: 'object',
              properties: {
                cnpj: { type: 'string' },
                nome_fantasia: { type: 'string' },
                distancia_km: { type: 'number' }
              }
            },
            origem: {
              type: 'object',
              properties: {
                lat: { type: 'number' },
                lng: { type: 'number' }
              }
            },
            criterio: { type: 'string' },
            observacoes: { type: 'array', items: { type: 'string' } }
          }
        },
        404: {
          description: 'Sem cobertura para estas coordenadas',
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, testController.findNearestRevendaByCoords);
}
