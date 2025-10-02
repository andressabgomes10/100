import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { revendasService } from '../services/revendas.service';
import { logger, logRequest } from '../lib/logger';

const coordenadasSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  tipo: z.enum(['empresarial', 'residencial']).optional()
});

export interface CoordenadasBody extends z.infer<typeof coordenadasSchema> {}

/**
 * Controller para testes especiais
 */
export class TestController {
  /**
   * POST /test/revenda-mais-proxima - Encontra revenda mais próxima por coordenadas (para teste)
   */
  async findNearestRevendaByCoords(request: FastifyRequest<{ Body: CoordenadasBody }>, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const { lat, lng, tipo } = coordenadasSchema.parse(request.body);
      
      logger.debug({ lat, lng, tipo }, 'Starting nearest revenda search by coordinates');
      
      // Buscar revenda mais próxima
      const filters = tipo ? { tipo } : {};
      const result = await revendasService.nearestRevendaByPoint(lat, lng, filters);
      
      if (!result) {
        return reply.status(404).send({
          message: 'Sem cobertura para estas coordenadas',
          code: 'NO_COVERAGE'
        });
      }
      
      const response = {
        revenda: {
          ...result.revenda,
          distancia_km: result.distancia_km
        },
        origem: {
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
      
      logRequest({
        route: '/test/revenda-mais-proxima',
        method: 'POST',
        status: 200,
        responseTime,
        lat,
        lng,
        cnpj: result.revenda.cnpj,
        distancia_km: result.distancia_km
      });
      
      return reply.status(200).send(response);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/test/revenda-mais-proxima',
        method: 'POST',
        status: 400,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Instância singleton do controller
export const testController = new TestController();
