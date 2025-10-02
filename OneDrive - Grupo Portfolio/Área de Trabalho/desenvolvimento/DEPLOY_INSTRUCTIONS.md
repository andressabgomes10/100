# 🚀 Deploy da API no Railway - Instruções Finais

## ✅ Status Atual:
- ✅ Código enviado para GitHub
- ✅ Configurações do Railway criadas
- ✅ Token atualizado: `1dfb06b6-583c-4aed-a94c-9ff48e22eeeb`
- ✅ Deploy automático configurado

## 📋 Próximos Passos:

### 1. Configurar GitHub Secrets
Acesse: https://github.com/andressabgomes/apirevenda/settings/secrets/actions

**Adicione o secret:**
- **Nome:** `RAILWAY_TOKEN`
- **Valor:** `1dfb06b6-583c-4aed-a94c-9ff48e22eeeb`

### 2. Configurar Variáveis no Railway Dashboard
Acesse: https://railway.app/dashboard

**No projeto `apirevenda-way`, adicione as variáveis:**

**Variáveis Básicas:**
```
NODE_ENV=production
PORT=3001
API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

**Variáveis do Banco de Dados (Supabase):**
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**OU Variáveis do Banco PostgreSQL do Railway:**
```
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=host
PGPORT=port
PGDATABASE=db
PGUSER=user
PGPASSWORD=pass
```

### 3. Configurar Banco de Dados

**Opção A: Supabase (Recomendado)**
1. Acesse: https://supabase.com
2. Crie um novo projeto
3. Anote as credenciais (URL, Anon Key, Service Role Key)
4. Execute o schema SQL no SQL Editor do Supabase
5. Adicione as variáveis SUPABASE_* no Railway

**Opção B: PostgreSQL do Railway**
1. No Railway Dashboard, clique em "New Service"
2. Selecione "Database" → "PostgreSQL"
3. Execute o schema SQL no banco criado
4. As variáveis DATABASE_URL serão criadas automaticamente

### 4. Ativar Deploy Automático
O deploy automático será ativado quando você:
1. Configurar o GitHub Secret
2. Fazer push para a branch `main` (ou renomear `master` para `main`)

### 5. Monitorar Deploy
- **GitHub Actions:** https://github.com/andressabgomes/apirevenda/actions
- **Railway Dashboard:** https://railway.app/dashboard

## 🔗 Links Importantes:
- **Repositório:** https://github.com/andressabgomes/apirevenda.git
- **Railway Project:** `apirevenda-way` (ID: d7cda4f3-aa85-4a59-b724-dee021eab566)
- **Token:** `1dfb06b6-583c-4aed-a94c-9ff48e22eeeb`

## 🎯 Endpoints da API (após deploy):
```
GET  /health                    # Health check
GET  /cep/:cep                  # Buscar CEP
POST /revenda-mais-proxima      # Revenda mais próxima
GET  /revendas                  # Listar revendas
POST /revendas                  # Criar/atualizar revenda
GET  /stats                     # Estatísticas
```

## 🔒 Headers Obrigatórios:
```
x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
Content-Type: application/json
```

**Sua API estará pronta para uso após completar os passos acima!** 🚀
