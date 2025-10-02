import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { getCepInfo } from '../services/cep.service';
import { geocodeService } from '../services/geocode.service';
import { statsService } from '../services/stats.service';
import { logger, logRequest } from '../lib/logger';
import { throwCepError } from '../middlewares/errorHandler';

// Schema de validação para parâmetro CEP
const cepParamsSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve conter exatamente 8 dígitos')
});

export interface CepParams {
  cep: string;
}

/**
 * Controller para operações relacionadas a CEP
 */
export class CepController {
  /**
   * GET /cep/:cep - Busca informações de um CEP
   */
  async getCepInfo(request: FastifyRequest<{ Params: CepParams }>, reply: FastifyReply) {
    const startTime = Date.now();
    const { cep } = request.params;
    
    try {
      // Validar parâmetro CEP
      const validatedParams = cepParamsSchema.parse({ cep });
      const normalizedCep = validatedParams.cep;
      
      logger.debug({ cep: normalizedCep }, 'Starting CEP lookup');
      
      // Buscar informações do CEP
      const cepInfo = await getCepInfo(normalizedCep);
      
      // Tentar geocodificação se habilitada
      if (geocodeService.isEnabled()) {
        try {
          const geocodeResult = await geocodeService.geocodeAddress(cepInfo);
          if (geocodeResult) {
            cepInfo.lat = geocodeResult.lat;
            cepInfo.lng = geocodeResult.lng;
            logger.debug({ cep: normalizedCep }, 'CEP geocoded successfully');
          }
        } catch (error) {
          logger.warn({ cep: normalizedCep, error }, 'Geocoding failed, continuing without coordinates');
        }
      }
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/cep/:cep',
        method: 'GET',
        status: 200,
        responseTime,
        cep: normalizedCep,
        provider: cepInfo.provider
      });
      
      return reply.status(200).send(cepInfo);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof z.ZodError) {
        throwCepError(error.errors[0].message);
      }
      
      logRequest({
        route: '/cep/:cep',
        method: 'GET',
        status: 400,
        responseTime,
        cep,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Instância singleton do controller
export const cepController = new CepController();
