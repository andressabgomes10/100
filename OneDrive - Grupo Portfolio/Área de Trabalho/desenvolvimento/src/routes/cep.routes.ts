import { FastifyInstance } from 'fastify';
import { cepController } from '../controllers/cep.controller';

/**
 * Registra rotas relacionadas a CEP
 */
export async function cepRoutes(fastify: FastifyInstance) {
  // GET /cep/:cep - Busca informações de um CEP
  fastify.get('/cep/:cep', {
    schema: {
      description: 'Busca informações de um CEP',
      tags: ['CEP'],
      params: {
        type: 'object',
        properties: {
          cep: {
            type: 'string',
            pattern: '^\\d{8}$',
            description: 'CEP com 8 dígitos'
          }
        },
        required: ['cep']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            cep: { type: 'string' },
            rua: { type: 'string', nullable: true },
            bairro: { type: 'string', nullable: true },
            cidade: { type: 'string' },
            uf: { type: 'string' },
            ibge: { type: 'string', nullable: true },
            provider: { type: 'string', enum: ['brasilapi', 'viacep'] },
            lat: { type: 'number', nullable: true },
            lng: { type: 'number', nullable: true }
          },
          required: ['cep', 'cidade', 'uf', 'provider']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        },
        404: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' }
          }
        }
      }
    }
  }, cepController.getCepInfo);
}
