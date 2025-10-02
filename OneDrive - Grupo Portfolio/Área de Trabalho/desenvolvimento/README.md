# Revenda Proximidade API

API para encontrar revenda mais próxima por CEP, desenvolvida com Node.js + TypeScript + Fastify.

## 🚀 Características

- **Consulta CEP**: BrasilAPI com fallback ViaCEP
- **Geocodificação**: Suporte para Google Maps, Mapbox e OpenCage (configurável)
- **Proximidade**: Cálculo de distância usando fórmula de Haversine
- **Cache**: Cache in-memory para consultas de CEP (TTL 30 dias)
- **Segurança**: Autenticação via API Key
- **Rate Limiting**: Proteção contra abuso
- **Logs**: Logs estruturados com Pino
- **Validação**: Validação de dados com Zod
- **ETL**: Scripts para carregar dados de CSV

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de configuração
cp env.example .env

# Configurar variáveis de ambiente
# Editar .env conforme necessário
```

## ⚙️ Configuração

Edite o arquivo `.env`:

```env
PORT=3001
API_KEY=changeme
GEO_PROVIDER=none
GEO_API_KEY=
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=60
RATE_LIMIT_TIME_WINDOW=60000
```

### Variáveis de Ambiente

- `PORT`: Porta do servidor (padrão: 3001)
- `API_KEY`: Chave de API para autenticação
- `GEO_PROVIDER`: Provedor de geocodificação (`none`, `google`, `mapbox`, `opencage`)
- `GEO_API_KEY`: Chave da API de geocodificação
- `NODE_ENV`: Ambiente (`development`, `production`)
- `CORS_ORIGIN`: Origem permitida para CORS
- `RATE_LIMIT_MAX`: Máximo de requisições por janela de tempo
- `RATE_LIMIT_TIME_WINDOW`: Janela de tempo em ms

## 🚀 Uso

### Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Executar linting
npm run lint

# Compilar TypeScript
npm run build
```

### Produção

```bash
# Compilar
npm run build

# Executar
npm start
```

### ETL (Extract, Transform, Load)

```bash
# Inicializar banco de dados
npm run seed

# Carregar dados de CSV
npm run etl:csv path=./data/novos_enderecos.csv
```

## 📚 API Endpoints

### Sistema

- `GET /health` - Verificação de saúde
- `GET /stats` - Estatísticas da aplicação

### CEP

- `GET /cep/:cep` - Busca informações de CEP

### Revendas

- `GET /revendas` - Lista revendas (com paginação)
- `GET /revendas/:cnpj` - Busca revenda por CNPJ
- `POST /revendas` - Cria/atualiza revenda
- `POST /revenda-mais-proxima` - Encontra revenda mais próxima

## 🔐 Autenticação

Todas as rotas (exceto `/health`) requerem header `x-api-key` com a chave configurada em `API_KEY`.

## 📝 Exemplos de Uso

### Buscar informações de CEP

```bash
curl -H "x-api-key: changeme" \
     http://localhost:3001/cep/60115000
```

### Encontrar revenda mais próxima

```bash
curl -X POST \
     -H "x-api-key: changeme" \
     -H "Content-Type: application/json" \
     -d '{"cep":"60115000","tipo":"empresarial"}' \
     http://localhost:3001/revenda-mais-proxima
```

### Criar/atualizar revenda

```bash
curl -X POST \
     -H "x-api-key: changeme" \
     -H "Content-Type: application/json" \
     -d '{
       "cnpj":"12345678000199",
       "nome_fantasia":"Revenda Centro",
       "cep":"60000000",
       "cidade":"Fortaleza",
       "uf":"CE",
       "latitude":-3.73,
       "longitude":-38.52,
       "ativo":true
     }' \
     http://localhost:3001/revendas
```

## 🗂️ Estrutura do Projeto

```
src/
├── controllers/     # Controllers das rotas
├── services/       # Lógica de negócio
├── routes/         # Definição das rotas
├── middlewares/    # Middlewares (auth, error handling)
├── lib/            # Utilitários (http, logger, etc.)
├── types/          # Definições TypeScript
├── etl/            # Scripts de ETL
└── server.ts       # Servidor principal

db/
└── revendas.json   # Banco de dados mock (JSON)
```

## 🔄 Migração Futura

O projeto está preparado para migração de `db/revendas.json` para **PostgreSQL + PostGIS**:

- Uso de coordenadas geográficas
- Índices espaciais para consultas de proximidade
- Queries SQL otimizadas
- Backup e replicação

## 🧪 Testes

```bash
# Executar testes (quando implementados)
npm test
```

## 📊 Monitoramento

- Logs estruturados com Pino
- Métricas em `/stats`
- Health check em `/health`
- Rate limiting configurável

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

MIT License
