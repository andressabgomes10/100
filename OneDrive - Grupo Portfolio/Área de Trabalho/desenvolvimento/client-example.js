/**
 * 🧰 Cliente Robusto para Revenda Proximidade API
 * Com timeout, retry exponencial e tratamento de erros
 */

const API_BASE = 'http://localhost:3001';
const API_KEY = 'changeme';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Headers;
}

interface ApiError {
  message: string;
  code: string;
  details?: any;
  status?: number;
}

/**
 * Executa requisição com timeout
 */
async function withTimeout(
  fetchPromise: Promise<Response>, 
  ms: number = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  
  try {
    const response = await fetchPromise;
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Executa requisição com retry exponencial
 */
async function call(
  path: string, 
  opts: RequestOptions = {}, 
  retries: number = 2
): Promise<ApiResponse> {
  const url = `${API_BASE}${path}`;
  const headers = { 
    'x-api-key': API_KEY, 
    'Content-Type': 'application/json',
    ...(opts.headers || {}) 
  };
  
  const requestOptions: RequestInit = {
    method: opts.method || 'GET',
    headers,
    body: opts.body
  };
  
  try {
    const response = await withTimeout(
      fetch(url, requestOptions), 
      opts.timeout || 8000
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP ${response.status}`,
        errorData.code || 'HTTP_ERROR',
        errorData.details,
        response.status
      );
    }
    
    const data = await response.json();
    
    return {
      data,
      status: response.status,
      headers: response.headers
    };
    
  } catch (error) {
    // Se é erro de API (4xx), não fazer retry
    if (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500) {
      throw error;
    }
    
    // Se é a última tentativa, lança o erro
    if (retries <= 0) {
      throw error;
    }
    
    // Backoff exponencial: 300ms, 1200ms, 4800ms...
    const delay = 300 * Math.pow(2, (opts.retries || 2) - retries);
    console.warn(`Request failed, retrying in ${delay}ms... (${retries} retries left)`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return call(path, opts, retries - 1);
  }
}

/**
 * Classe principal do cliente
 */
export class RevendaApiClient {
  private baseUrl: string;
  private apiKey: string;
  
  constructor(baseUrl: string = API_BASE, apiKey: string = API_KEY) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  /**
   * Health check (público)
   */
  async health(): Promise<ApiResponse> {
    return call('/health', { method: 'GET' });
  }
  
  /**
   * Buscar informações de CEP
   */
  async buscarCEP(cep: string): Promise<ApiResponse> {
    return call(`/cep/${cep}`, { method: 'GET' });
  }
  
  /**
   * Encontrar revenda mais próxima
   */
  async encontrarRevendaMaisProxima(
    cep: string, 
    tipo?: 'empresarial' | 'residencial'
  ): Promise<ApiResponse> {
    const body = JSON.stringify({ cep, ...(tipo && { tipo }) });
    return call('/revenda-mais-proxima', {
      method: 'POST',
      body
    });
  }
  
  /**
   * Listar revendas com paginação
   */
  async listarRevendas(limit?: number, offset?: number): Promise<ApiResponse> {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (offset) params.append('offset', offset.toString());
    
    const query = params.toString();
    return call(`/revendas${query ? `?${query}` : ''}`, { method: 'GET' });
  }
  
  /**
   * Buscar revenda por CNPJ
   */
  async buscarRevendaPorCnpj(cnpj: string): Promise<ApiResponse> {
    return call(`/revendas/${cnpj}`, { method: 'GET' });
  }
  
  /**
   * Criar ou atualizar revenda (idempotente)
   */
  async upsertRevenda(revendaData: any): Promise<ApiResponse> {
    const body = JSON.stringify(revendaData);
    return call('/revendas', {
      method: 'POST',
      body
    });
  }
  
  /**
   * Obter estatísticas
   */
  async obterEstatisticas(): Promise<ApiResponse> {
    return call('/stats', { method: 'GET' });
  }
}

// Instância padrão do cliente
export const apiClient = new RevendaApiClient();

// Exemplo de uso
export async function exemploUso() {
  try {
    console.log('🚀 Testando API...');
    
    // Health check
    const health = await apiClient.health();
    console.log('✅ Health:', health.data);
    
    // Buscar CEP
    const cepInfo = await apiClient.buscarCEP('60115000');
    console.log('✅ CEP encontrado:', cepInfo.data);
    
    // Encontrar revenda mais próxima
    const revenda = await apiClient.encontrarRevendaMaisProxima('60115000', 'empresarial');
    console.log('✅ Revenda mais próxima:', revenda.data);
    
    // Listar revendas
    const revendas = await apiClient.listarRevendas(5, 0);
    console.log('✅ Revendas:', revendas.data);
    
    // Estatísticas
    const stats = await apiClient.obterEstatisticas();
    console.log('✅ Estatísticas:', stats.data);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar exemplo se chamado diretamente
if (typeof window === 'undefined' && require.main === module) {
  exemploUso();
}
