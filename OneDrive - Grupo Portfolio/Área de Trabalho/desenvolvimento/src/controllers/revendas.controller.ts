import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { Revenda, RevendaMaisProximaResponse, RevendaFilters } from '../types';
import { revendasService } from '../services/revendas.service';
import { getCepInfo } from '../services/cep.service';
import { geocodeService } from '../services/geocode.service';
import { statsService } from '../services/stats.service';
import { logger, logRequest, logNearestQuery } from '../lib/logger';
import { throwNotFoundError, throwValidationError } from '../middlewares/errorHandler';

// Schemas de validação
const revendaSchema = z.object({
  cnpj: z.string().min(14).max(14).regex(/^\d{14}$/, 'CNPJ deve conter exatamente 14 dígitos'),
  razao_social: z.string().optional().nullable(),
  nome_fantasia: z.string().optional().nullable(),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos').optional().nullable(),
  endereco: z.string().optional().nullable(),
  bairro: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().length(2).optional().nullable(),
  telefone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  canal_preferencial: z.enum(['whatsapp', 'telefone']).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  ativo: z.boolean().optional(),
  service_radius_km: z.number().positive().optional().nullable(),
  prioridade: z.number().int().optional(),
  atende_empresarial: z.boolean().optional(),
  atende_residencial: z.boolean().optional()
});

const nearestRevendaSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos'),
  tipo: z.enum(['empresarial', 'residencial']).optional()
});

const paginationSchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional()
});

export interface RevendaParams {
  cnpj: string;
}

export interface RevendaQuery extends z.infer<typeof paginationSchema> {}

export interface NearestRevendaBody extends z.infer<typeof nearestRevendaSchema> {}

/**
 * Controller para operações relacionadas a revendas
 */
export class RevendasController {
  /**
   * GET /revendas - Lista revendas com paginação
   */
  async listRevendas(request: FastifyRequest<{ Querystring: RevendaQuery }>, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const query = paginationSchema.parse(request.query);
      const result = await revendasService.listRevendas(query);
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas',
        method: 'GET',
        status: 200,
        responseTime,
        limit: query.limit,
        offset: query.offset
      });
      
      return reply.status(200).send(result);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas',
        method: 'GET',
        status: 400,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * GET /revendas/:cnpj - Busca revenda por CNPJ
   */
  async getRevendaByCnpj(request: FastifyRequest<{ Params: RevendaParams }>, reply: FastifyReply) {
    const startTime = Date.now();
    const { cnpj } = request.params;
    
    try {
      const revenda = await revendasService.getRevendaByCnpj(cnpj);
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas/:cnpj',
        method: 'GET',
        status: 200,
        responseTime,
        cnpj
      });
      
      return reply.status(200).send(revenda);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas/:cnpj',
        method: 'GET',
        status: 404,
        responseTime,
        cnpj,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * POST /revendas - Cria ou atualiza revenda
   */
  async upsertRevenda(request: FastifyRequest<{ Body: Partial<Revenda> & { cnpj: string } }>, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const validatedData = revendaSchema.parse(request.body);
      const revenda = await revendasService.upsertRevenda(validatedData);
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas',
        method: 'POST',
        status: 200,
        responseTime,
        cnpj: revenda.cnpj
      });
      
      return reply.status(200).send(revenda);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revendas',
        method: 'POST',
        status: 400,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * POST /revenda-mais-proxima - Encontra revenda mais próxima por CEP
   */
  async findNearestRevenda(request: FastifyRequest<{ Body: NearestRevendaBody }>, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const { cep, tipo } = nearestRevendaSchema.parse(request.body);
      
      logger.debug({ cep, tipo }, 'Starting nearest revenda search');
      
      // Buscar informações do CEP
      const cepInfo = await getCepInfo(cep);
      
      // Tentar obter coordenadas
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (geocodeService.isEnabled()) {
        try {
          const geocodeResult = await geocodeService.geocodeAddress(cepInfo);
          if (geocodeResult) {
            lat = geocodeResult.lat;
            lng = geocodeResult.lng;
            logger.debug({ cep, lat, lng }, 'CEP geocoded for nearest search');
          }
        } catch (error) {
          logger.warn({ cep, error }, 'Geocoding failed for nearest search');
        }
      }
      
      // Se não temos coordenadas, verificar se há revendas com coordenadas
      if (!lat || !lng) {
        const revendasStats = await revendasService.getStats();
        
        if (revendasStats.com_coordenadas === 0) {
          statsService.incrementNoCoverage();
          throwNotFoundError('Sem cobertura para este CEP - nenhuma revenda possui coordenadas geográficas');
        }
        
        throwNotFoundError('Sem cobertura para este CEP - geocodificação não disponível');
      }
      
      // Buscar revenda mais próxima
      const filters: RevendaFilters = tipo ? { tipo } : {};
      const result = await revendasService.nearestRevendaByPoint(lat, lng, filters);
      
      if (!result) {
        statsService.incrementNoCoverage();
        throwNotFoundError('Sem cobertura para este CEP');
      }
      
      statsService.incrementNearestQueries();
      
      const response: RevendaMaisProximaResponse = {
        revenda: {
          ...result.revenda,
          distancia_km: result.distancia_km
        },
        origem: {
          cep: cepInfo.cep,
          cidade: cepInfo.cidade,
          uf: cepInfo.uf,
          lat,
          lng
        },
        criterio: 'nearest_with_rules',
        observacoes: [
          result.revenda.service_radius_km ? 'raio_ok' : 'sem_raio',
          result.revenda.prioridade ? 'prioridade_aplicada' : 'sem_prioridade'
        ]
      };
      
      const responseTime = Date.now() - startTime;
      
      logNearestQuery(cep, result.revenda.cnpj, result.distancia_km, responseTime);
      
      logRequest({
        route: '/revenda-mais-proxima',
        method: 'POST',
        status: 200,
        responseTime,
        cep,
        cnpj: result.revenda.cnpj,
        distancia_km: result.distancia_km
      });
      
      return reply.status(200).send(response);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/revenda-mais-proxima',
        method: 'POST',
        status: error instanceof Error && error.message.includes('não encontrado') ? 404 : 400,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Instância singleton do controller
export const revendasController = new RevendasController();
