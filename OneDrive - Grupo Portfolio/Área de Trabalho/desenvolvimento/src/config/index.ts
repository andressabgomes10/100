import { z } from 'zod';

// Schema de validação para configurações
const configSchema = z.object({
  // Servidor
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  HOST: z.string().default('0.0.0.0'),
  
  // API
  API_KEY: z.string().min(10, 'API Key deve ter pelo menos 10 caracteres'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default('60'),
  RATE_LIMIT_TIME_WINDOW: z.string().transform(Number).default('60000'),
  
  // Timeouts
  HTTP_TIMEOUT: z.string().transform(Number).default('8000'),
  REQUEST_TIMEOUT: z.string().transform(Number).default('30000'),
  
  // Geocoding
  GEO_PROVIDER: z.enum(['none', 'google', 'mapbox', 'opencage']).default('none'),
  GEO_API_KEY: z.string().optional(),
  
  // Banco de dados
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // PostgreSQL (alternativa ao Supabase)
  DATABASE_URL: z.string().optional(),
  PGHOST: z.string().optional(),
  PGPORT: z.string().transform(Number).optional(),
  PGDATABASE: z.string().optional(),
  PGUSER: z.string().optional(),
  PGPASSWORD: z.string().optional(),
});

// Validar e exportar configurações
export const config = configSchema.parse(process.env);

// Configurações derivadas
export const corsOrigins = config.CORS_ORIGINS.split(',').map(origin => origin.trim());

// Validações adicionais
if (config.GEO_PROVIDER !== 'none' && !config.GEO_API_KEY) {
  throw new Error(`GEO_API_KEY é obrigatório quando GEO_PROVIDER é ${config.GEO_PROVIDER}`);
}

if (!config.SUPABASE_URL && !config.DATABASE_URL) {
  console.warn('⚠️ Nenhum banco de dados configurado. Usando FileDB como fallback.');
}

export type Config = z.infer<typeof configSchema>;
