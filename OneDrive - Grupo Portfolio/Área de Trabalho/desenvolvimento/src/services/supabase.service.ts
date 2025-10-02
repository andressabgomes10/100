// 🗄️ Serviço Supabase para Revenda Proximidade API
// Substitui o arquivo JSON por banco PostgreSQL

import { createClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger';
import { Revenda } from '../types';

export class SupabaseService {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    logger.info('SupabaseService initialized');
  }

  // 📋 Listar revendas com paginação
  async listRevendas(limit: number = 50, offset: number = 0): Promise<{
    data: Revenda[];
    total: number;
    limit: number;
    offset: number;
  }> {
    try {
      const { data, error, count } = await this.supabase
        .from('revendas')
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error({ error }, 'Erro ao listar revendas');
        throw error;
      }

      return {
        data: data || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (error) {
      logger.error({ error }, 'Erro no SupabaseService.listRevendas');
      throw error;
    }
  }

  // 🔍 Buscar revenda por CNPJ
  async getRevendaByCnpj(cnpj: string): Promise<Revenda | null> {
    try {
      const { data, error } = await this.supabase
        .from('revendas')
        .select('*')
        .eq('cnpj', cnpj)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        logger.error({ error, cnpj }, 'Erro ao buscar revenda por CNPJ');
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ error, cnpj }, 'Erro no SupabaseService.getRevendaByCnpj');
      throw error;
    }
  }

  // ➕ Criar ou atualizar revenda
  async upsertRevenda(revendaData: Partial<Revenda> & { cnpj: string }): Promise<Revenda> {
    try {
      const { data, error } = await this.supabase
        .from('revendas')
        .upsert(revendaData, { 
          onConflict: 'cnpj',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        logger.error({ error, cnpj: revendaData.cnpj }, 'Erro ao upsert revenda');
        throw error;
      }

      logger.info({ cnpj: revendaData.cnpj }, 'Revenda upserted successfully');
      return data;
    } catch (error) {
      logger.error({ error, cnpj: revendaData.cnpj }, 'Erro no SupabaseService.upsertRevenda');
      throw error;
    }
  }

  // 🎯 Encontrar revenda mais próxima
  async nearestRevendaByPoint(
    lat: number, 
    lng: number, 
    filters: { atende_empresarial?: boolean; atende_residencial?: boolean } = {}
  ): Promise<{ revenda: Revenda; distancia_km: number } | null> {
    try {
      const { data, error } = await this.supabase
        .rpc('find_nearest_revenda', {
          p_lat: lat,
          p_lng: lng,
          p_atende_empresarial: filters.atende_empresarial || null,
          p_atende_residencial: filters.atende_residencial || null
        });

      if (error) {
        logger.error({ error, lat, lng, filters }, 'Erro ao buscar revenda mais próxima');
        throw error;
      }

      if (!data || data.length === 0) {
        return null;
      }

      const result = data[0];
      return {
        revenda: {
          cnpj: result.cnpj,
          razao_social: result.razao_social,
          nome_fantasia: result.nome_fantasia,
          cep: result.cep,
          endereco: result.endereco,
          bairro: result.bairro,
          cidade: result.cidade,
          uf: result.uf,
          telefone: result.telefone,
          whatsapp: result.whatsapp,
          canal_preferencial: result.canal_preferencial,
          latitude: result.latitude,
          longitude: result.longitude,
          ativo: result.ativo,
          service_radius_km: result.service_radius_km,
          prioridade: result.prioridade,
          atende_empresarial: result.atende_empresarial,
          atende_residencial: result.atende_residencial
        },
        distancia_km: result.distancia_km
      };
    } catch (error) {
      logger.error({ error, lat, lng, filters }, 'Erro no SupabaseService.nearestRevendaByPoint');
      throw error;
    }
  }

  // 📊 Obter estatísticas
  async getStats(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_api_stats');

      if (error) {
        logger.error({ error }, 'Erro ao obter estatísticas');
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ error }, 'Erro no SupabaseService.getStats');
      throw error;
    }
  }

  // 📈 Incrementar estatística
  async incrementStat(metricName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .rpc('increment_stat', { metric_name: metricName });

      if (error) {
        logger.error({ error, metricName }, 'Erro ao incrementar estatística');
        throw error;
      }
    } catch (error) {
      logger.error({ error, metricName }, 'Erro no SupabaseService.incrementStat');
      throw error;
    }
  }

  // 💾 Cache de CEP
  async getCepFromCache(cep: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('cep_cache')
        .select('*')
        .eq('cep', cep)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado ou expirado
        }
        logger.error({ error, cep }, 'Erro ao buscar CEP no cache');
        throw error;
      }

      return data;
    } catch (error) {
      logger.error({ error, cep }, 'Erro no SupabaseService.getCepFromCache');
      throw error;
    }
  }

  // 💾 Salvar CEP no cache
  async saveCepToCache(cepData: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cep_cache')
        .upsert({
          cep: cepData.cep,
          cidade: cepData.cidade,
          uf: cepData.uf,
          rua: cepData.rua,
          bairro: cepData.bairro,
          ibge: cepData.ibge,
          provider: cepData.provider,
          lat: cepData.lat,
          lng: cepData.lng,
          cached_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
        }, { onConflict: 'cep' });

      if (error) {
        logger.error({ error, cep: cepData.cep }, 'Erro ao salvar CEP no cache');
        throw error;
      }
    } catch (error) {
      logger.error({ error, cep: cepData.cep }, 'Erro no SupabaseService.saveCepToCache');
      throw error;
    }
  }

  // 🧹 Limpar cache expirado
  async cleanExpiredCache(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('cep_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        logger.error({ error }, 'Erro ao limpar cache expirado');
        throw error;
      }

      logger.info('Cache expirado limpo com sucesso');
    } catch (error) {
      logger.error({ error }, 'Erro no SupabaseService.cleanExpiredCache');
      throw error;
    }
  }
}

// Instância singleton
export const supabaseService = new SupabaseService();
