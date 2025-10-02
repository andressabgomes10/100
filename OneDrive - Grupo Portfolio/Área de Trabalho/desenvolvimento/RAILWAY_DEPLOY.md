# 🚀 Railway Configuration - Revenda Proximidade API

## 📋 **Variáveis de Ambiente para Railway:**

### **Configurações Básicas:**
```
NODE_ENV=production
PORT=3001
API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

### **Supabase Configuration:**
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_do_supabase
```

### **CORS Configuration:**
```
CORS_ORIGINS=https://nacionalgas.com.br,https://app.minharevenda.com.br,https://gasdopovo.figma.site
```

### **Rate Limiting:**
```
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

### **Geocoding (Opcional):**
```
GEO_PROVIDER=google
GEO_API_KEY=sua_chave_google_maps
```

### **Timeouts:**
```
HTTP_TIMEOUT=10000
REQUEST_TIMEOUT=30000
```

## 🔧 **Passos para Deploy no Railway:**

### **1. Preparar Projeto:**
```bash
# Instalar dependências
npm install

# Build do projeto
npm run build
```

### **2. Conectar com Railway:**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login no Railway
railway login

# Inicializar projeto
railway init

# Deploy
railway up
```

### **3. Configurar Variáveis de Ambiente:**
```bash
# Via CLI
railway variables set NODE_ENV=production
railway variables set API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_ANON_KEY=sua_chave_anonima
railway variables set CORS_ORIGINS=https://nacionalgas.com.br,https://app.minharevenda.com.br
```

### **4. Configurar Domínio:**
```bash
# Gerar domínio personalizado
railway domain

# Ou usar domínio Railway
# https://seu-projeto-production.up.railway.app
```

## 🗄️ **Configuração do Supabase:**

### **1. Criar Projeto Supabase:**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Anote a URL e as chaves

### **2. Executar Schema SQL:**
1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `supabase-schema.sql`
3. Verifique se as tabelas foram criadas

### **3. Configurar RLS (Row Level Security):**
- As políticas já estão incluídas no schema
- Use `service_role` para operações da API

## 🔗 **Integração com seu Site:**

### **URL da API em Produção:**
```
https://seu-projeto-production.up.railway.app
```

### **Endpoints Disponíveis:**
```
GET  /health                    # Health check (público)
GET  /cep/:cep                  # Buscar CEP
POST /revenda-mais-proxima      # Revenda mais próxima
GET  /revendas                  # Listar revendas
POST /revendas                  # Criar/atualizar revenda
GET  /stats                     # Estatísticas
```

### **Headers Obrigatórios:**
```
x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
Content-Type: application/json
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

## 📊 **Monitoramento:**

### **Railway Dashboard:**
- Logs em tempo real
- Métricas de performance
- Status do serviço

### **Supabase Dashboard:**
- Métricas do banco
- Logs de queries
- Performance

## 🔒 **Segurança:**

### **API Key:**
- ✅ Chave única e segura
- ✅ Rotacionável por ambiente
- ✅ Logs de uso

### **CORS:**
- ✅ Domínios específicos
- ✅ Métodos permitidos
- ✅ Headers seguros

### **Rate Limiting:**
- ✅ 100 req/min por IP
- ✅ Proteção contra spam
- ✅ Logs de bloqueio

## 🚀 **Deploy Automático:**

### **GitHub Actions:**
```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 🎯 **Checklist de Deploy:**

- [ ] ✅ Projeto configurado no Railway
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Supabase configurado e schema executado
- [ ] ✅ API Key configurada
- [ ] ✅ CORS configurado para seu domínio
- [ ] ✅ Deploy realizado com sucesso
- [ ] ✅ Testes de produção executados
- [ ] ✅ Monitoramento ativo

**Sua API estará disponível para seu site consumir!** 🚀
