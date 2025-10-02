-- 🗄️ Configuração do Banco Supabase para Revenda Proximidade API
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Criar tabela de revendas
CREATE TABLE IF NOT EXISTS revendas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj VARCHAR(14) UNIQUE NOT NULL,
  razao_social VARCHAR(255),
  nome_fantasia VARCHAR(255),
  cep VARCHAR(8),
  endereco TEXT,
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  canal_preferencial VARCHAR(20) CHECK (canal_preferencial IN ('whatsapp', 'telefone')),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  ativo BOOLEAN DEFAULT true,
  service_radius_km INTEGER DEFAULT 10,
  prioridade INTEGER DEFAULT 0,
  atende_empresarial BOOLEAN DEFAULT true,
  atende_residencial BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de estatísticas
CREATE TABLE IF NOT EXISTS api_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_name VARCHAR(50) UNIQUE NOT NULL,
  metric_value BIGINT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de cache de CEP
CREATE TABLE IF NOT EXISTS cep_cache (
  cep VARCHAR(8) PRIMARY KEY,
  cidade VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL,
  rua VARCHAR(255),
  bairro VARCHAR(100),
  ibge VARCHAR(20),
  provider VARCHAR(20) NOT NULL,
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days')
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_revendas_ativo ON revendas(ativo);
CREATE INDEX IF NOT EXISTS idx_revendas_coordenadas ON revendas(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_revendas_cidade ON revendas(cidade);
CREATE INDEX IF NOT EXISTS idx_revendas_atende_empresarial ON revendas(atende_empresarial);
CREATE INDEX IF NOT EXISTS idx_revendas_atende_residencial ON revendas(atende_residencial);
CREATE INDEX IF NOT EXISTS idx_cep_cache_expires ON cep_cache(expires_at);

-- 5. Inserir estatísticas iniciais
INSERT INTO api_stats (metric_name, metric_value) VALUES
  ('cep_lookups', 0),
  ('cep_cache_hits', 0),
  ('nearest_queries', 0),
  ('no_coverage', 0),
  ('provider_errors_brasilapi', 0),
  ('provider_errors_viacep', 0)
ON CONFLICT (metric_name) DO NOTHING;

-- 6. Inserir dados de exemplo
INSERT INTO revendas (
  cnpj, nome_fantasia, razao_social, cep, endereco, cidade, uf,
  telefone, whatsapp, canal_preferencial, latitude, longitude,
  ativo, service_radius_km, prioridade, atende_empresarial, atende_residencial
) VALUES
  ('12345678000199', 'Revenda Centro', 'Revenda Centro Ltda', '60000000', 'Rua Central, 123', 'Fortaleza', 'CE', '8533333333', '5585999999999', 'whatsapp', -3.7172, -38.5434, true, 15, 5, true, true),
  ('98765432000188', 'Revenda Aldeota', 'Revenda Aldeota Ltda', '60115000', 'Rua Ildefonso Albano, 456', 'Fortaleza', 'CE', '8533334444', '5585999888888', 'whatsapp', -3.73, -38.52, true, 12, 3, true, true),
  ('11223344000177', 'Revenda Meireles', 'Revenda Meireles Ltda', '60115000', 'Rua Dr. José Lourenço, 789', 'Fortaleza', 'CE', '8533335555', '5585999777777', 'telefone', -3.72, -38.51, true, 10, 2, true, true),
  ('55667788000199', 'Revenda Maracanaú', 'Revenda Maracanaú Ltda', '61900000', 'Av. Central, 321', 'Maracanaú', 'CE', '8533336666', '5585999666666', 'whatsapp', -3.88, -38.63, true, 20, 4, true, true),
  ('99887766000111', 'Revenda Caucaia', 'Revenda Caucaia Ltda', '61600000', 'Rua Principal, 654', 'Caucaia', 'CE', '8533337777', '5585999555555', 'whatsapp', -3.73, -38.66, true, 18, 3, true, true),
  ('44332211000122', 'Revenda Sobral', 'Revenda Sobral Ltda', '62000000', 'Av. Dom José, 987', 'Sobral', 'CE', '8533338888', '5585999444444', 'telefone', -3.68, -40.24, false, 25, 1, true, false)
ON CONFLICT (cnpj) DO NOTHING;

-- 7. Criar função para atualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Criar trigger para atualizar timestamp automaticamente
CREATE TRIGGER update_revendas_updated_at BEFORE UPDATE ON revendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 9. Criar função para buscar revenda mais próxima
CREATE OR REPLACE FUNCTION find_nearest_revenda(
  p_lat DECIMAL(10, 8),
  p_lng DECIMAL(11, 8),
  p_atende_empresarial BOOLEAN DEFAULT NULL,
  p_atende_residencial BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  cnpj VARCHAR(14),
  nome_fantasia VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  uf VARCHAR(2),
  telefone VARCHAR(20),
  whatsapp VARCHAR(20),
  canal_preferencial VARCHAR(20),
  distancia_km DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH distances AS (
    SELECT 
      r.*,
      ST_Distance(
        ST_Point(r.longitude, r.latitude)::geography,
        ST_Point(p_lng, p_lat)::geography
      ) / 1000 AS distancia_km
    FROM revendas r
    WHERE r.ativo = true
      AND r.latitude IS NOT NULL
      AND r.longitude IS NOT NULL
      AND (p_atende_empresarial IS NULL OR r.atende_empresarial = p_atende_empresarial)
      AND (p_atende_residencial IS NULL OR r.atende_residencial = p_atende_residencial)
  )
  SELECT 
    d.id,
    d.cnpj,
    d.nome_fantasia,
    d.endereco,
    d.cidade,
    d.uf,
    d.telefone,
    d.whatsapp,
    d.canal_preferencial,
    d.distancia_km
  FROM distances d
  ORDER BY d.distancia_km ASC, d.prioridade DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 10. Habilitar extensão PostGIS (se disponível)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 11. Criar políticas RLS (Row Level Security)
ALTER TABLE revendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE cep_cache ENABLE ROW LEVEL SECURITY;

-- 12. Criar políticas de acesso
CREATE POLICY "Allow all operations for service role" ON revendas
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON api_stats
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow all operations for service role" ON cep_cache
  FOR ALL USING (auth.role() = 'service_role');

-- 13. Criar função para incrementar estatísticas
CREATE OR REPLACE FUNCTION increment_stat(metric_name VARCHAR(50))
RETURNS VOID AS $$
BEGIN
  INSERT INTO api_stats (metric_name, metric_value)
  VALUES (metric_name, 1)
  ON CONFLICT (metric_name)
  DO UPDATE SET 
    metric_value = api_stats.metric_value + 1,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 14. Criar função para obter estatísticas
CREATE OR REPLACE FUNCTION get_api_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'cep_lookups', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'cep_lookups'), 0),
    'cep_cache_hits', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'cep_cache_hits'), 0),
    'nearest_queries', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'nearest_queries'), 0),
    'no_coverage', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'no_coverage'), 0),
    'provider_errors', json_build_object(
      'brasilapi', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'provider_errors_brasilapi'), 0),
      'viacep', COALESCE((SELECT metric_value FROM api_stats WHERE metric_name = 'provider_errors_viacep'), 0)
    ),
    'revendas', json_build_object(
      'total', (SELECT COUNT(*) FROM revendas),
      'ativas', (SELECT COUNT(*) FROM revendas WHERE ativo = true),
      'com_coordenadas', (SELECT COUNT(*) FROM revendas WHERE latitude IS NOT NULL AND longitude IS NOT NULL),
      'atendem_empresarial', (SELECT COUNT(*) FROM revendas WHERE atende_empresarial = true),
      'atendem_residencial', (SELECT COUNT(*) FROM revendas WHERE atende_residencial = true)
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
