# 🚀 API de Revendas - Proximidade por CEP

API para encontrar revenda mais próxima por CEP, desenvolvida com TypeScript, Fastify e arquitetura escalável.

## ✨ Funcionalidades

- 🔍 **Busca de CEP** - Integração com BrasilAPI e ViaCEP
- 📍 **Geocodificação** - Conversão de endereços em coordenadas
- 🏪 **Revenda mais próxima** - Algoritmo de proximidade com regras de negócio
- 📊 **Estatísticas** - Métricas de uso e performance
- 🔒 **Segurança** - API Key, Rate Limiting e CORS
- 📝 **Validação** - Validação robusta de dados brasileiros (CNPJ, CEP, telefone)

## 🛠️ Tecnologias

- **Backend:** TypeScript + Fastify
- **Validação:** Zod
- **Logging:** Pino
- **Banco:** Supabase (PostgreSQL) ou FileDB
- **Deploy:** Railway
- **Cache:** Memória com TTL

## 🚀 Deploy Rápido

### 1. Configurar Railway

1. Acesse: https://railway.app/dashboard
2. Conecte o repositório: `andressabgomes/apirevenda`
3. Configure as variáveis de ambiente:

```bash
NODE_ENV=production
PORT=3001
API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

### 2. Configurar Banco de Dados

**Opção A: Supabase (Recomendado)**
```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

**Opção B: PostgreSQL Railway**
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
```

### 3. Executar Schema SQL

Execute o arquivo `supabase-schema.sql` no seu banco de dados.

## 📚 Endpoints

### Sistema
- `GET /` - Informações da API
- `GET /health` - Health check
- `GET /stats` - Estatísticas

### CEP
- `GET /cep/:cep` - Buscar informações de CEP

### Revendas
- `GET /revendas` - Listar revendas (com paginação)
- `GET /revendas/:cnpj` - Buscar revenda por CNPJ
- `POST /revendas` - Criar/atualizar revenda
- `POST /revenda-mais-proxima` - Encontrar revenda mais próxima

## 🔑 Autenticação

Todos os endpoints (exceto `/health`) requerem header:
```
x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

## 📖 Exemplos de Uso

### Buscar CEP
```bash
curl -H "x-api-key: SUA_API_KEY" \
     https://sua-api.up.railway.app/cep/60115000
```

### Revenda mais próxima
```bash
curl -X POST \
     -H "x-api-key: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"cep":"60115000","tipo":"empresarial"}' \
     https://sua-api.up.railway.app/revenda-mais-proxima
```

## 🏗️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 📁 Estrutura do Projeto

```
src/
├── config/          # Configurações
├── controllers/     # Controllers da API
├── lib/            # Utilitários (cache, validação, métricas)
├── middlewares/    # Middlewares (auth, error handling)
├── routes/         # Definição de rotas
├── services/       # Lógica de negócio
├── types/          # Definições TypeScript
└── server.ts       # Servidor principal
```

## 🔧 Configuração

Variáveis de ambiente disponíveis em `env.example`.

## 📊 Monitoramento

- **Métricas:** Coletadas automaticamente
- **Logs:** Estruturados com Pino
- **Health Check:** `/health` endpoint
- **Cache:** Hit rate monitorado

## 🚀 Deploy

O projeto está configurado para deploy automático no Railway via GitHub Actions.

## 📄 Licença

MIT