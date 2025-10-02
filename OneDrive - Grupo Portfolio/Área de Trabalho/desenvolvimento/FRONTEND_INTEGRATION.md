# 🌐 Integração Frontend - Revenda Proximidade API

## 🎯 **Conectando seu Frontend com a API**

Sua API está rodando em `http://localhost:3001` e pronta para integração! Aqui estão todas as opções para conectar seu frontend:

## 📁 **Arquivos Criados para Integração:**

### 1. **Frontend Completo**
- `index.html` - Interface web completa e responsiva
- `frontend-client.js` - Cliente JavaScript para a API
- `frontend-examples.js` - Exemplos para React/Vue/Angular

### 2. **Integração Make/Integromat**
- `make-integration.json` - Configuração completa para Make

## 🚀 **Como Usar:**

### **Opção 1: Interface Web Pronta**
```bash
# Abrir no navegador
http://localhost:3001/index.html
```

### **Opção 2: Integração com seu Projeto Figma**
Use o código do `frontend-examples.js` no seu projeto:

#### **React:**
```javascript
import { RevendaApiClient } from './frontend-client.js';

const api = new RevendaApiClient('http://localhost:3001', 'changeme');

// Buscar revenda mais próxima
const revenda = await api.encontrarRevendaMaisProxima('60115000', 'empresarial');
```

#### **Vue:**
```javascript
// Usar o exemplo completo do frontend-examples.js
```

#### **Angular:**
```javascript
// Usar o exemplo completo do frontend-examples.js
```

### **Opção 3: Make/Integromat**
1. Importe o arquivo `make-integration.json` no Make
2. Configure as variáveis de ambiente
3. Use os cenários pré-configurados

## 🔗 **Endpoints Disponíveis:**

### **🏥 Health Check (Público)**
```javascript
GET http://localhost:3001/health
```

### **📍 Buscar CEP**
```javascript
GET http://localhost:3001/cep/60115000
Headers: { "x-api-key": "changeme" }
```

### **🏢 Revenda Mais Próxima**
```javascript
POST http://localhost:3001/revenda-mais-proxima
Headers: { "x-api-key": "changeme", "Content-Type": "application/json" }
Body: { "cep": "60115000", "tipo": "empresarial" }
```

### **🎯 Revenda por Coordenadas (Teste)**
```javascript
POST http://localhost:3001/test/revenda-mais-proxima
Headers: { "x-api-key": "changeme", "Content-Type": "application/json" }
Body: { "lat": -3.73, "lng": -38.52, "tipo": "empresarial" }
```

### **📋 Listar Revendas**
```javascript
GET http://localhost:3001/revendas?limit=10&offset=0
Headers: { "x-api-key": "changeme" }
```

### **📊 Estatísticas**
```javascript
GET http://localhost:3001/stats
Headers: { "x-api-key": "changeme" }
```

## 🎨 **Exemplo de Uso Completo:**

```javascript
// Cliente da API
const api = new RevendaApiClient('http://localhost:3001', 'changeme');

// Função para buscar revenda
async function buscarRevenda(cep, tipo) {
  try {
    // 1. Buscar informações do CEP
    const cepInfo = await api.buscarCEP(cep);
    console.log('CEP encontrado:', cepInfo);

    // 2. Buscar revenda mais próxima
    const revenda = await api.encontrarRevendaMaisProxima(cep, tipo);
    console.log('Revenda encontrada:', revenda);

    // 3. Exibir resultado
    return {
      cep: cepInfo,
      revenda: revenda.revenda,
      distancia: revenda.revenda.distancia_km
    };
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

// Uso
buscarRevenda('60115000', 'empresarial')
  .then(resultado => {
    console.log('Resultado:', resultado);
  })
  .catch(erro => {
    console.error('Erro:', erro);
  });
```

## 🔧 **Configuração para Produção:**

### **Variáveis de Ambiente:**
```javascript
// Desenvolvimento
const API_URL = 'http://localhost:3001';
const API_KEY = 'changeme';

// Produção
const API_URL = 'https://api.nacionalgas.com.br';
const API_KEY = 'sua_chave_producao';
```

### **CORS:**
A API já está configurada para aceitar requisições de:
- `https://nacionalgas.com.br`
- `https://app.minharevenda.com.br`
- `http://localhost:3000` (desenvolvimento)

## 🧪 **Testando a Integração:**

### **1. Teste Manual:**
```bash
# Abrir interface web
http://localhost:3001/index.html

# Testar com CEP: 60115000
# Tipo: Empresarial
```

### **2. Teste via JavaScript:**
```javascript
// No console do navegador
const api = new RevendaApiClient();
api.buscarCEP('60115000').then(console.log);
```

### **3. Teste via cURL:**
```bash
curl -H "x-api-key: changeme" http://localhost:3001/cep/60115000
```

## 📱 **Responsividade:**

A interface web já está responsiva e funciona em:
- ✅ Desktop
- ✅ Tablet
- ✅ Mobile

## 🎯 **Próximos Passos:**

1. **✅ API funcionando localmente**
2. **✅ Frontend de exemplo criado**
3. **🔧 Integrar com seu projeto Figma**
4. **🚀 Deploy em produção**
5. **📊 Configurar monitoramento**

## 🆘 **Troubleshooting:**

### **Erro de CORS:**
- Verifique se o domínio está na lista de CORS permitidos
- Use `http://localhost:3000` para desenvolvimento

### **Erro de API Key:**
- Verifique se está enviando o header `x-api-key`
- Use `changeme` para desenvolvimento

### **Erro de CEP:**
- CEP deve ter exatamente 8 dígitos
- Use CEPs válidos como `60115000`

---

## 🎉 **Sua API está pronta para integração!**

**URLs importantes:**
- **API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3001/index.html`
- **Health**: `http://localhost:3001/health`
- **Docs**: `http://localhost:3001/docs` (quando configurado)

**Quer ajuda com alguma integração específica?** 🚀
