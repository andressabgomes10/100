# 🚀 Deploy no Railway - Guia Simplificado

## ✅ Checklist de Deploy

### 1. Configurar GitHub Secret
- Acesse: https://github.com/andressabgomes/apirevenda/settings/secrets/actions
- Adicione: `RAILWAY_TOKEN` = `1dfb06b6-583c-4aed-a94c-9ff48e22eeeb`

### 2. Configurar Variáveis no Railway
- Acesse: https://railway.app/dashboard
- Projeto: `apirevenda-way`
- Adicione as variáveis:

```bash
# Básicas
NODE_ENV=production
PORT=3001
API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo

# Banco (escolha uma opção)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# OU PostgreSQL Railway
DATABASE_URL=postgresql://user:pass@host:port/db
```

### 3. Configurar Banco de Dados

**Supabase:**
1. Acesse: https://supabase.com
2. Crie projeto
3. Execute `supabase-schema.sql` no SQL Editor

**PostgreSQL Railway:**
1. Railway Dashboard → New Service → Database → PostgreSQL
2. Execute `supabase-schema.sql` no banco criado

### 4. Monitorar Deploy
- GitHub Actions: https://github.com/andressabgomes/apirevenda/actions
- Railway Dashboard: https://railway.app/dashboard

## 🧪 Teste da API

```bash
# Health check
curl https://sua-api.up.railway.app/health

# Buscar CEP
curl -H "x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" \
     https://sua-api.up.railway.app/cep/60115000

# Revenda mais próxima
curl -X POST \
     -H "x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" \
     -H "Content-Type: application/json" \
     -d '{"cep":"60115000","tipo":"empresarial"}' \
     https://sua-api.up.railway.app/revenda-mais-proxima
```

## 🔗 Links Importantes

- **Repositório:** https://github.com/andressabgomes/apirevenda.git
- **Railway Project:** `apirevenda-way`
- **Token:** `1dfb06b6-583c-4aed-a94c-9ff48e22eeeb`

## ✅ Status Final

Após completar os passos acima, sua API estará pronta para uso em produção! 🎉
