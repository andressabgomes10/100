export type Revenda = {
  cnpj: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  cep?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  uf?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  canal_preferencial?: "whatsapp" | "telefone" | null;
  latitude?: number | null;
  longitude?: number | null;
  ativo: boolean;
  service_radius_km?: number | null;
  prioridade?: number;
  atende_empresarial?: boolean;
  atende_residencial?: boolean;
};

export type CepInfo = {
  cep: string;           // 8 dígitos
  rua?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
  ibge?: string | null;
  provider: "brasilapi" | "viacep";
  lat?: number | null;   // opcional: se geocodificado
  lng?: number | null;
};

export type RevendaComDistancia = Revenda & {
  distancia_km: number;
};

export type RevendaMaisProximaResponse = {
  revenda: RevendaComDistancia;
  origem: {
    cep: string;
    cidade: string;
    uf: string;
    lat?: number | null;
    lng?: number | null;
  };
  criterio: "nearest_with_rules";
  observacoes: string[];
};

export type StatsResponse = {
  cep_lookups: number;
  cep_cache_hits: number;
  nearest_queries: number;
  no_coverage: number;
  provider_errors: {
    brasilapi: number;
    viacep: number;
  };
};

export type HealthResponse = {
  ok: boolean;
  version: string;
  timestamp: string;
  uptime_s: number;
  env: string;
  node_version: string;
};

export type PaginationQuery = {
  limit?: number;
  offset?: number;
};

export type RevendaFilters = {
  tipo?: "empresarial" | "residencial";
  ativo?: boolean;
};

export type BrasilApiCepResponse = {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  street: string;
  service: string;
};

export type ViaCepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
};

export type GeocodeProvider = "none" | "google" | "mapbox" | "opencage";

export type GeocodeResult = {
  lat: number;
  lng: number;
} | null;
