# 🚀 Guia de Início Rápido - Revenda Proximidade API

## 📦 Instalação e Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Ambiente
```bash
# Copiar arquivo de exemplo
cp env.example .env

# Editar configurações (opcional)
# PORT=3001
# API_KEY=changeme
# GEO_PROVIDER=none
```

### 3. Inicializar Banco de Dados
```bash
npm run seed
```

## 🏃‍♂️ Executar a Aplicação

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📊 Carregar Dados de Exemplo

```bash
# Carregar dados de exemplo
npm run etl:csv path=./data/exemplo_revendas.csv
```

## 🧪 Testar a API

### 1. Verificar Saúde
```bash
curl http://localhost:3001/health
```

### 2. Buscar CEP
```bash
curl -H "x-api-key: changeme" \
     http://localhost:3001/cep/60115000
```

### 3. Encontrar Revenda Mais Próxima
```bash
curl -X POST \
     -H "x-api-key: changeme" \
     -H "Content-Type: application/json" \
     -d '{"cep":"60115000","tipo":"empresarial"}' \
     http://localhost:3001/revenda-mais-proxima
```

### 4. Ver Estatísticas
```bash
curl -H "x-api-key: changeme" \
     http://localhost:3001/stats
```

### 5. Listar Revendas
```bash
curl -H "x-api-key: changeme" \
     http://localhost:3001/revendas
```

## 🔧 Configurações Avançadas

### Geocodificação
Para habilitar geocodificação, configure no `.env`:
```env
GEO_PROVIDER=google  # ou mapbox, opencage
GEO_API_KEY=sua_chave_aqui
```

### Rate Limiting
```env
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=60000
```

### CORS
```env
CORS_ORIGIN=http://localhost:3000
```

## 📝 Estrutura de Dados

### Revenda
```json
{
  "cnpj": "12345678000199",
  "nome_fantasia": "Revenda Centro",
  "cep": "60000000",
  "cidade": "Fortaleza",
  "uf": "CE",
  "latitude": -3.7172,
  "longitude": -38.5434,
  "ativo": true,
  "service_radius_km": 10,
  "prioridade": 5,
  "atende_empresarial": true,
  "atende_residencial": true
}
```

### Resposta CEP
```json
{
  "cep": "60115000",
  "rua": "Rua Dr. José Lourenço",
  "bairro": "Aldeota",
  "cidade": "Fortaleza",
  "uf": "CE",
  "provider": "brasilapi"
}
```

### Resposta Revenda Mais Próxima
```json
{
  "revenda": {
    "cnpj": "12345678000199",
    "nome_fantasia": "Revenda Centro",
    "distancia_km": 3.42
  },
  "origem": {
    "cep": "60115000",
    "cidade": "Fortaleza",
    "uf": "CE",
    "lat": -3.73,
    "lng": -38.52
  },
  "criterio": "nearest_with_rules",
  "observacoes": ["raio_ok", "prioridade_aplicada"]
}
```

## 🐛 Troubleshooting

### Erro de API Key
- Verifique se o header `x-api-key` está sendo enviado
- Confirme se a chave no `.env` está correta

### Erro de CEP
- CEP deve ter exatamente 8 dígitos
- Use apenas números (sem hífen)

### Erro de Coordenadas
- Se `GEO_PROVIDER=none`, revendas devem ter `latitude` e `longitude` preenchidas
- Para geocodificação automática, configure um provedor válido

### Rate Limit
- Ajuste `RATE_LIMIT_MAX` e `RATE_LIMIT_TIME_WINDOW` no `.env`

## 📈 Monitoramento

- **Logs**: Estruturados com Pino
- **Health**: `GET /health`
- **Stats**: `GET /stats`
- **Métricas**: Cache hits, consultas, erros por provedor

## 🔄 Próximos Passos

1. **PostgreSQL + PostGIS**: Migrar de JSON para banco relacional
2. **Testes**: Implementar testes unitários e de integração
3. **Docker**: Containerizar a aplicação
4. **CI/CD**: Pipeline de deploy automatizado
5. **Métricas**: Integração com Prometheus/Grafana
