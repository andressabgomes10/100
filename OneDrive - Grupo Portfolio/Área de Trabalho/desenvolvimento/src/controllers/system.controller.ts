import { FastifyRequest, FastifyReply } from 'fastify';
import { HealthResponse, StatsResponse } from '../types';
import { statsService } from '../services/stats.service';
import { revendasService } from '../services/revendas.service';
import { logger, logRequest } from '../lib/logger';

/**
 * Controller para operações do sistema (health, stats)
 */
export class SystemController {
  /**
   * GET /health - Verificação de saúde da aplicação
   */
  async health(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      const response: HealthResponse = {
        ok: true,
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        uptime_s: Math.floor(process.uptime()),
        env: process.env.NODE_ENV || 'development',
        node_version: process.version
      };
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/health',
        method: 'GET',
        status: 200,
        responseTime
      });
      
      return reply.status(200).send(response);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/health',
        method: 'GET',
        status: 500,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * GET /stats - Estatísticas da aplicação
   */
  async stats(request: FastifyRequest, reply: FastifyReply) {
    const startTime = Date.now();
    
    try {
      // Obter estatísticas das revendas
      const revendasStats = await revendasService.getStats();
      
      // Obter estatísticas gerais
      const generalStats = statsService.getStats();
      
      const response: StatsResponse = {
        ...generalStats,
        revendas: revendasStats
      };
      
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/stats',
        method: 'GET',
        status: 200,
        responseTime
      });
      
      logger.info({
        stats: statsService.getFormattedStats(),
        revendas: revendasStats
      }, 'Stats endpoint accessed');
      
      return reply.status(200).send(response);
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logRequest({
        route: '/stats',
        method: 'GET',
        status: 500,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }
}

// Instância singleton do controller
export const systemController = new SystemController();
