import { Revenda, RevendaComDistancia, RevendaFilters, PaginationQuery } from '../types';
import { revendasDB } from '../lib/filedb';
import { haversine, safeHaversine } from '../lib/haversine';
import { logger } from '../lib/logger';
import { throwNotFoundError } from '../middlewares/errorHandler';

/**
 * Serviço para operações com revendas
 * TODO: Substituir por Postgres+PostGIS no futuro
 */
export class RevendasService {
  /**
   * Lista revendas com paginação
   */
  async listRevendas(query: PaginationQuery = {}): Promise<{
    data: Revenda[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit = 50, offset = 0 } = query;
    
    const revendas = await revendasDB.readOrDefault([]);
    
    const total = revendas.length;
    const data = revendas.slice(offset, offset + limit);
    
    logger.debug({ total, limit, offset, returned: data.length }, 'Listed revendas');
    
    return { data, total, limit, offset };
  }

  /**
   * Busca revenda por CNPJ
   */
  async getRevendaByCnpj(cnpj: string): Promise<Revenda> {
    const revendas = await revendasDB.readOrDefault([]);
    const revenda = revendas.find(r => r.cnpj === cnpj);
    
    if (!revenda) {
      throwNotFoundError(`Revenda com CNPJ ${cnpj} não encontrada`);
    }
    
    logger.debug({ cnpj }, 'Found revenda by CNPJ');
    return revenda;
  }

  /**
   * Insere ou atualiza revenda por CNPJ
   */
  async upsertRevenda(data: Partial<Revenda> & { cnpj: string }): Promise<Revenda> {
    const revendas = await revendasDB.readOrDefault([]);
    const existingIndex = revendas.findIndex(r => r.cnpj === data.cnpj);
    
    const revendaData: Revenda = {
      cnpj: data.cnpj,
      razao_social: data.razao_social || null,
      nome_fantasia: data.nome_fantasia || null,
      cep: data.cep || null,
      endereco: data.endereco || null,
      bairro: data.bairro || null,
      cidade: data.cidade || null,
      uf: data.uf || null,
      telefone: data.telefone || null,
      whatsapp: data.whatsapp || null,
      canal_preferencial: data.canal_preferencial || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      ativo: data.ativo ?? true,
      service_radius_km: data.service_radius_km || null,
      prioridade: data.prioridade || 0,
      atende_empresarial: data.atende_empresarial ?? true,
      atende_residencial: data.atende_residencial ?? true,
      ...data
    };
    
    if (existingIndex >= 0) {
      revendas[existingIndex] = revendaData;
      logger.info({ cnpj: data.cnpj }, 'Updated existing revenda');
    } else {
      revendas.push(revendaData);
      logger.info({ cnpj: data.cnpj }, 'Created new revenda');
    }
    
    await revendasDB.write(revendas);
    return revendaData;
  }

  /**
   * Busca revenda mais próxima de um ponto geográfico
   */
  async nearestRevendaByPoint(
    lat: number,
    lng: number,
    filters: RevendaFilters = {}
  ): Promise<{ revenda: RevendaComDistancia; distancia_km: number } | null> {
    const revendas = await revendasDB.readOrDefault([]);
    
    // Filtrar revendas ativas com coordenadas
    const activeRevendas = revendas.filter(revenda => {
      if (!revenda.ativo) return false;
      if (!revenda.latitude || !revenda.longitude) return false;
      
      // Filtrar por tipo de atendimento
      if (filters.tipo === 'empresarial' && !revenda.atende_empresarial) return false;
      if (filters.tipo === 'residencial' && !revenda.atende_residencial) return false;
      
      return true;
    });
    
    if (activeRevendas.length === 0) {
      logger.warn({ lat, lng, filters }, 'No active revendas with coordinates found');
      return null;
    }
    
    // Calcular distâncias e filtrar por raio de serviço
    const revendasComDistancia: RevendaComDistancia[] = [];
    
    for (const revenda of activeRevendas) {
      const distancia = safeHaversine(
        lat, lng,
        revenda.latitude!, revenda.longitude!
      );
      
      if (distancia === null) continue;
      
      // Verificar raio de serviço se definido
      if (revenda.service_radius_km && distancia > revenda.service_radius_km) {
        logger.debug({
          cnpj: revenda.cnpj,
          distancia,
          service_radius: revenda.service_radius_km
        }, 'Revenda outside service radius');
        continue;
      }
      
      revendasComDistancia.push({
        ...revenda,
        distancia_km: distancia
      });
    }
    
    if (revendasComDistancia.length === 0) {
      logger.warn({ lat, lng, filters }, 'No revendas within service radius');
      return null;
    }
    
    // Ordenar por distância, desempate por prioridade
    revendasComDistancia.sort((a, b) => {
      if (Math.abs(a.distancia_km - b.distancia_km) < 0.1) {
        // Desempate por prioridade (maior prioridade primeiro)
        return (b.prioridade || 0) - (a.prioridade || 0);
      }
      return a.distancia_km - b.distancia_km;
    });
    
    const nearest = revendasComDistancia[0];
    
    logger.info({
      cnpj: nearest.cnpj,
      distancia_km: nearest.distancia_km,
      prioridade: nearest.prioridade,
      total_candidates: revendasComDistancia.length
    }, 'Found nearest revenda');
    
    return {
      revenda: nearest,
      distancia_km: nearest.distancia_km
    };
  }

  /**
   * Busca revendas próximas de um ponto (múltiplas)
   */
  async nearestRevendasByPoint(
    lat: number,
    lng: number,
    limit: number = 5,
    filters: RevendaFilters = {}
  ): Promise<RevendaComDistancia[]> {
    const revendas = await revendasDB.readOrDefault([]);
    
    const activeRevendas = revendas.filter(revenda => {
      if (!revenda.ativo) return false;
      if (!revenda.latitude || !revenda.longitude) return false;
      
      if (filters.tipo === 'empresarial' && !revenda.atende_empresarial) return false;
      if (filters.tipo === 'residencial' && !revenda.atende_residencial) return false;
      
      return true;
    });
    
    const revendasComDistancia: RevendaComDistancia[] = [];
    
    for (const revenda of activeRevendas) {
      const distancia = safeHaversine(
        lat, lng,
        revenda.latitude!, revenda.longitude!
      );
      
      if (distancia === null) continue;
      
      if (revenda.service_radius_km && distancia > revenda.service_radius_km) {
        continue;
      }
      
      revendasComDistancia.push({
        ...revenda,
        distancia_km: distancia
      });
    }
    
    revendasComDistancia.sort((a, b) => {
      if (Math.abs(a.distancia_km - b.distancia_km) < 0.1) {
        return (b.prioridade || 0) - (a.prioridade || 0);
      }
      return a.distancia_km - b.distancia_km;
    });
    
    return revendasComDistancia.slice(0, limit);
  }

  /**
   * Retorna estatísticas das revendas
   */
  async getStats(): Promise<{
    total: number;
    ativas: number;
    com_coordenadas: number;
    atendem_empresarial: number;
    atendem_residencial: number;
  }> {
    const revendas = await revendasDB.readOrDefault([]);
    
    const stats = {
      total: revendas.length,
      ativas: revendas.filter(r => r.ativo).length,
      com_coordenadas: revendas.filter(r => r.latitude && r.longitude).length,
      atendem_empresarial: revendas.filter(r => r.atende_empresarial).length,
      atendem_residencial: revendas.filter(r => r.atende_residencial).length
    };
    
    logger.debug(stats, 'Revendas stats calculated');
    return stats;
  }
}

// Instância singleton do serviço
export const revendasService = new RevendasService();
