# 🗄️ Configuração de Banco de Dados para Railway

## Opção 1: Supabase (Recomendado)

### Passos para configurar Supabase:

1. **Acesse:** https://supabase.com
2. **Crie um novo projeto**
3. **Anote as credenciais:**
   - Project URL
   - Anon Key
   - Service Role Key

### Variáveis de ambiente no Railway:
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

### Executar schema SQL:
1. Acesse o SQL Editor no Supabase
2. Execute o arquivo `supabase-schema.sql`
3. Verifique se as tabelas foram criadas

---

## Opção 2: PostgreSQL do Railway

### Passos para configurar PostgreSQL no Railway:

1. **No Railway Dashboard:**
   - Clique em "New Service"
   - Selecione "Database" → "PostgreSQL"

2. **Variáveis de ambiente automáticas:**
   ```
   DATABASE_URL=postgresql://user:pass@host:port/db
   PGHOST=host
   PGPORT=port
   PGDATABASE=db
   PGUSER=user
   PGPASSWORD=pass
   ```

### Executar schema SQL:
1. Conecte ao banco via Railway CLI ou pgAdmin
2. Execute o arquivo `supabase-schema.sql`

---

## 🔧 Configuração Atual do Código:

O código já está preparado para ambas as opções:

- **Supabase:** Usa `SUPABASE_URL` e `SUPABASE_ANON_KEY`
- **PostgreSQL:** Pode usar `DATABASE_URL` diretamente

## 📋 Próximos Passos:

1. **Escolha uma opção** (recomendo Supabase)
2. **Configure as variáveis de ambiente** no Railway
3. **Execute o schema SQL** no banco escolhido
4. **Teste a API** após o deploy

## 🚀 Teste da API:

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
