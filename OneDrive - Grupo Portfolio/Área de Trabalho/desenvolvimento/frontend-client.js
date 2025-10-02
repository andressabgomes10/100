// 🌐 Cliente Frontend para Revenda Proximidade API
// Integração com seu projeto Figma/Make

class RevendaApiClient {
  constructor(baseURL = 'http://localhost:3001', apiKey = 'NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  // Headers padrão
  getHeaders() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  // Fazer requisição com tratamento de erro
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: this.getHeaders(),
        ...options
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // 🏥 Health Check (público)
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return await response.json();
  }

  // 📍 Buscar informações de CEP
  async buscarCEP(cep) {
    return await this.request(`/cep/${cep}`);
  }

  // 🏢 Encontrar revenda mais próxima por CEP
  async encontrarRevendaMaisProxima(cep, tipo = null) {
    const body = { cep };
    if (tipo) body.tipo = tipo;
    
    return await this.request('/revenda-mais-proxima', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // 🏢 Encontrar revenda mais próxima por coordenadas (para teste)
  async encontrarRevendaPorCoordenadas(lat, lng, tipo = null) {
    const body = { lat, lng };
    if (tipo) body.tipo = tipo;
    
    return await this.request('/test/revenda-mais-proxima', {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // 📋 Listar revendas
  async listarRevendas(limit = 50, offset = 0) {
    return await this.request(`/revendas?limit=${limit}&offset=${offset}`);
  }

  // 🔍 Buscar revenda por CNPJ
  async buscarRevendaPorCnpj(cnpj) {
    return await this.request(`/revendas/${cnpj}`);
  }

  // ➕ Criar/atualizar revenda
  async salvarRevenda(dadosRevenda) {
    return await this.request('/revendas', {
      method: 'POST',
      body: JSON.stringify(dadosRevenda)
    });
  }

  // 📊 Obter estatísticas
  async obterEstatisticas() {
    return await this.request('/stats');
  }
}

// Instância global do cliente
const apiClient = new RevendaApiClient();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RevendaApiClient, apiClient };
}
