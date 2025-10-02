import { FastifyInstance } from 'fastify';
import { revendasController } from '../controllers/revendas.controller';

/**
 * Registra rotas relacionadas a revendas
 */
export async function revendasRoutes(fastify: FastifyInstance) {
  // GET /revendas - Lista revendas com paginação
  fastify.get('/revendas', {
    schema: {
      description: 'Lista revendas com paginação',
      tags: ['Revendas'],
      querystring: {
        type: 'object',
        properties: {
          limit: {
            type: 'string',
            pattern: '^\\d+$',
            description: 'Número máximo de resultados'
          },
          offset: {
            type: 'string',
            pattern: '^\\d+$',
            description: 'Número de resultados para pular'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  cnpj: { type: 'string' },
                  razao_social: { type: 'string', nullable: true },
                  nome_fantasia: { type: 'string', nullable: true },
                  cep: { type: 'string', nullable: true },
                  endereco: { type: 'string', nullable: true },
                  bairro: { type: 'string', nullable: true },
                  cidade: { type: 'string', nullable: true },
                  uf: { type: 'string', nullable: true },
                  telefone: { type: 'string', nullable: true },
                  whatsapp: { type: 'string', nullable: true },
                  canal_preferencial: { type: 'string', enum: ['whatsapp', 'telefone'], nullable: true },
                  latitude: { type: 'number', nullable: true },
                  longitude: { type: 'number', nullable: true },
                  ativo: { type: 'boolean' },
                  service_radius_km: { type: 'number', nullable: true },
                  prioridade: { type: 'number' },
                  atende_empresarial: { type: 'boolean' },
                  atende_residencial: { type: 'boolean' }
                },
                required: ['cnpj', 'ativo']
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' }
          }
        }
      }
    }
  }, revendasController.listRevendas);

  // GET /revendas/:cnpj - Busca revenda por CNPJ
  fastify.get('/revendas/:cnpj', {
    schema: {
      description: 'Busca revenda por CNPJ',
      tags: ['Revendas'],
      params: {
        type: 'object',
        properties: {
          cnpj: {
            type: 'string',
            pattern: '^\\d{14}$',
            description: 'CNPJ com 14 dígitos'
          }
        },
        required: ['cnpj']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            cnpj: { type: 'string' },
            razao_social: { type: 'string', nullable: true },
            nome_fantasia: { type: 'string', nullable: true },
            cep: { type: 'string', nullable: true },
            endereco: { type: 'string', nullable: true },
            bairro: { type: 'string', nullable: true },
            cidade: { type: 'string', nullable: true },
            uf: { type: 'string', nullable: true },
            telefone: { type: 'string', nullable: true },
            whatsapp: { type: 'string', nullable: true },
            canal_preferencial: { type: 'string', enum: ['whatsapp', 'telefone'], nullable: true },
            latitude: { type: 'number', nullable: true },
            longitude: { type: 'number', nullable: true },
            ativo: { type: 'boolean' },
            service_radius_km: { type: 'number', nullable: true },
            prioridade: { type: 'number' },
            atende_empresarial: { type: 'boolean' },
            atende_residencial: { type: 'boolean' }
          },
          required: ['cnpj', 'ativo']
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
  }, revendasController.getRevendaByCnpj);

  // POST /revendas - Cria ou atualiza revenda
  fastify.post('/revendas', {
    schema: {
      description: 'Cria ou atualiza revenda',
      tags: ['Revendas'],
      body: {
        type: 'object',
        properties: {
          cnpj: {
            type: 'string',
            pattern: '^\\d{14}$',
            description: 'CNPJ com 14 dígitos'
          },
          razao_social: { type: 'string', nullable: true },
          nome_fantasia: { type: 'string', nullable: true },
          cep: { type: 'string', pattern: '^\\d{8}$', nullable: true },
          endereco: { type: 'string', nullable: true },
          bairro: { type: 'string', nullable: true },
          cidade: { type: 'string', nullable: true },
          uf: { type: 'string', minLength: 2, maxLength: 2, nullable: true },
          telefone: { type: 'string', nullable: true },
          whatsapp: { type: 'string', nullable: true },
          canal_preferencial: { type: 'string', enum: ['whatsapp', 'telefone'], nullable: true },
          latitude: { type: 'number', minimum: -90, maximum: 90, nullable: true },
          longitude: { type: 'number', minimum: -180, maximum: 180, nullable: true },
          ativo: { type: 'boolean' },
          service_radius_km: { type: 'number', minimum: 0, nullable: true },
          prioridade: { type: 'number', nullable: true },
          atende_empresarial: { type: 'boolean' },
          atende_residencial: { type: 'boolean' }
        },
        required: ['cnpj']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            cnpj: { type: 'string' },
            razao_social: { type: 'string', nullable: true },
            nome_fantasia: { type: 'string', nullable: true },
            cep: { type: 'string', nullable: true },
            endereco: { type: 'string', nullable: true },
            bairro: { type: 'string', nullable: true },
            cidade: { type: 'string', nullable: true },
            uf: { type: 'string', nullable: true },
            telefone: { type: 'string', nullable: true },
            whatsapp: { type: 'string', nullable: true },
            canal_preferencial: { type: 'string', enum: ['whatsapp', 'telefone'], nullable: true },
            latitude: { type: 'number', nullable: true },
            longitude: { type: 'number', nullable: true },
            ativo: { type: 'boolean' },
            service_radius_km: { type: 'number', nullable: true },
            prioridade: { type: 'number' },
            atende_empresarial: { type: 'boolean' },
            atende_residencial: { type: 'boolean' }
          },
          required: ['cnpj', 'ativo']
        },
        400: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'array' }
          }
        }
      }
    }
  }, revendasController.upsertRevenda);

  // POST /revenda-mais-proxima - Encontra revenda mais próxima por CEP
  fastify.post('/revenda-mais-proxima', {
    schema: {
      description: 'Encontra revenda mais próxima por CEP',
      tags: ['Revendas'],
      body: {
        type: 'object',
        properties: {
          cep: {
            type: 'string',
            pattern: '^\\d{8}$',
            description: 'CEP com 8 dígitos'
          },
          tipo: {
            type: 'string',
            enum: ['empresarial', 'residencial'],
            description: 'Tipo de atendimento'
          }
        },
        required: ['cep']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            revenda: {
              type: 'object',
              properties: {
                cnpj: { type: 'string' },
                razao_social: { type: 'string', nullable: true },
                nome_fantasia: { type: 'string', nullable: true },
                cep: { type: 'string', nullable: true },
                endereco: { type: 'string', nullable: true },
                bairro: { type: 'string', nullable: true },
                cidade: { type: 'string', nullable: true },
                uf: { type: 'string', nullable: true },
                telefone: { type: 'string', nullable: true },
                whatsapp: { type: 'string', nullable: true },
                canal_preferencial: { type: 'string', enum: ['whatsapp', 'telefone'], nullable: true },
                latitude: { type: 'number', nullable: true },
                longitude: { type: 'number', nullable: true },
                ativo: { type: 'boolean' },
                service_radius_km: { type: 'number', nullable: true },
                prioridade: { type: 'number' },
                atende_empresarial: { type: 'boolean' },
                atende_residencial: { type: 'boolean' },
                distancia_km: { type: 'number' }
              },
              required: ['cnpj', 'ativo', 'distancia_km']
            },
            origem: {
              type: 'object',
              properties: {
                cep: { type: 'string' },
                cidade: { type: 'string' },
                uf: { type: 'string' },
                lat: { type: 'number', nullable: true },
                lng: { type: 'number', nullable: true }
              },
              required: ['cep', 'cidade', 'uf']
            },
            criterio: { type: 'string' },
            observacoes: { type: 'array', items: { type: 'string' } }
          }
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
  }, revendasController.findNearestRevenda);
}
