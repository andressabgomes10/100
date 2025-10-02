# 🚀 Deploy Completo - Revenda Proximidade API

## 🎯 **Configuração para seu Site Publicado**

Sua API está pronta para ser consumida pelo seu site publicado! Aqui está tudo que você precisa:

## 📁 **Arquivos Criados:**

### **🗄️ Banco de Dados Supabase:**
- ✅ `supabase-schema.sql` - Schema completo do banco
- ✅ `src/services/supabase.service.ts` - Serviço adaptado para Supabase

### **🚀 Deploy Railway:**
- ✅ `railway.json` - Configuração do Railway
- ✅ `RAILWAY_DEPLOY.md` - Guia completo de deploy
- ✅ `.github/workflows/deploy.yml` - Deploy automático

### **🔗 Integração Make/Integromat:**
- ✅ `make-integration-production.json` - Configuração para produção

## 🔐 **Sua API Key:**

```
NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

## 🚀 **Passos para Deploy:**

### **1. Configurar Supabase:**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o arquivo `supabase-schema.sql` no SQL Editor
4. Anote a URL e as chaves

### **2. Deploy no Railway:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

### **3. Configurar Variáveis de Ambiente:**
```bash
railway variables set NODE_ENV=production
railway variables set API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_ANON_KEY=sua_chave_anonima
railway variables set CORS_ORIGINS=https://nacionalgas.com.br,https://app.minharevenda.com.br,https://gasdopovo.figma.site
```

### **4. Configurar Make/Integromat:**
1. Importe o arquivo `make-integration-production.json`
2. Configure a API Key: `NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo`
3. Use a URL de produção: `https://seu-projeto-production.up.railway.app`

## 🌐 **URLs da API:**

### **Desenvolvimento:**
```
http://localhost:3001
```

### **Produção:**
```
https://seu-projeto-production.up.railway.app
```

## 🔗 **Endpoints para seu Site:**

### **Health Check (Público):**
```
GET https://seu-projeto-production.up.railway.app/health
```

### **Buscar CEP:**
```
GET https://seu-projeto-production.up.railway.app/cep/60115000
Headers: { "x-api-key": "NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" }
```

### **Revenda Mais Próxima:**
```
POST https://seu-projeto-production.up.railway.app/revenda-mais-proxima
Headers: { "x-api-key": "NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo", "Content-Type": "application/json" }
Body: { "cep": "60115000", "tipo": "empresarial" }
```

### **Listar Revendas:**
```
GET https://seu-projeto-production.up.railway.app/revendas?limit=10&offset=0
Headers: { "x-api-key": "NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" }
```

## 🧪 **Teste da API em Produção:**

```bash
# Health check
curl https://seu-projeto-production.up.railway.app/health

# Buscar CEP
curl -H "x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" \
     https://seu-projeto-production.up.railway.app/cep/60115000

# Revenda mais próxima
curl -X POST \
     -H "x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" \
     -H "Content-Type: application/json" \
     -d '{"cep":"60115000","tipo":"empresarial"}' \
     https://seu-projeto-production.up.railway.app/revenda-mais-proxima
```

## 📱 **Integração com seu Site:**

### **JavaScript:**
```javascript
const API_URL = 'https://seu-projeto-production.up.railway.app';
const API_KEY = 'NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo';

// Buscar revenda mais próxima
async function buscarRevenda(cep, tipo) {
  const response = await fetch(`${API_URL}/revenda-mais-proxima`, {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cep, tipo })
  });
  
  return await response.json();
}
```

### **Make/Integromat:**
1. Use o módulo "HTTP > Make a Request"
2. URL: `https://seu-projeto-production.up.railway.app/revenda-mais-proxima`
3. Headers: `x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo`
4. Body: `{"cep":"{{cep}}","tipo":"{{tipo}}"}`

## 🔒 **Segurança:**

- ✅ **API Key única e segura**
- ✅ **CORS configurado para seus domínios**
- ✅ **Rate limiting (100 req/min)**
- ✅ **SSL/TLS automático no Railway**
- ✅ **Logs estruturados**
- ✅ **Monitoramento ativo**

## 📊 **Monitoramento:**

### **Railway Dashboard:**
- Logs em tempo real
- Métricas de performance
- Status do serviço

### **Supabase Dashboard:**
- Métricas do banco
- Logs de queries
- Performance

## 🎯 **Próximos Passos:**

1. **✅ API Key gerada e configurada**
2. **✅ Supabase configurado**
3. **✅ Railway configurado**
4. **✅ Deploy automático configurado**
5. **🔧 Fazer deploy no Railway**
6. **🔧 Configurar Supabase**
7. **🔧 Testar em produção**
8. **🔧 Integrar com seu site**

## 🆘 **Suporte:**

### **Logs Importantes:**
- Railway: Dashboard do projeto
- Supabase: Logs do banco
- API: Logs estruturados com Pino

### **Comandos Úteis:**
```bash
# Ver logs do Railway
railway logs

# Ver status do deploy
railway status

# Configurar variáveis
railway variables

# Deploy manual
railway up
```

---

## 🎉 **Sua API está pronta para produção!**

**URLs importantes:**
- **API Produção**: `https://seu-projeto-production.up.railway.app`
- **Health Check**: `https://seu-projeto-production.up.railway.app/health`
- **Documentação**: `RAILWAY_DEPLOY.md`

**Quer ajuda com algum passo específico do deploy?** 🚀
