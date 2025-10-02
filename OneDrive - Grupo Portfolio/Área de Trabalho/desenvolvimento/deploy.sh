#!/bin/bash
# 🚀 Script de Deploy para Produção

set -e

echo "🚀 Iniciando deploy para produção..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 não está instalado. Execute: npm install -g pm2"
fi

# Backup do banco de dados
log "📦 Fazendo backup do banco de dados..."
if [ -f "db/revendas.json" ]; then
    mkdir -p backups
    cp db/revendas.json "backups/revendas_$(date +%Y%m%d_%H%M%S).json"
    log "✅ Backup criado em backups/"
else
    warn "Arquivo db/revendas.json não encontrado"
fi

# Pull do código
log "📥 Atualizando código do repositório..."
git pull origin main || error "Falha ao fazer pull do código"

# Instalar dependências
log "📦 Instalando dependências..."
npm ci --production || error "Falha ao instalar dependências"

# Build do projeto
log "🔨 Fazendo build do projeto..."
npm run build || error "Falha no build"

# Executar testes (se existirem)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    log "🧪 Executando testes..."
    npm test || warn "Testes falharam, mas continuando o deploy"
fi

# Parar aplicação atual
log "🛑 Parando aplicação atual..."
pm2 stop revenda-api 2>/dev/null || warn "Aplicação não estava rodando"

# Iniciar aplicação
log "🔄 Iniciando aplicação..."
pm2 start ecosystem.config.js --env production || error "Falha ao iniciar aplicação"

# Aguardar aplicação inicializar
log "⏳ Aguardando aplicação inicializar..."
sleep 10

# Verificar saúde da aplicação
log "🏥 Verificando saúde da aplicação..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    log "✅ Aplicação está saudável!"
else
    error "❌ Aplicação não está respondendo corretamente"
fi

# Mostrar status
log "📊 Status da aplicação:"
pm2 status revenda-api

# Mostrar logs recentes
log "📋 Logs recentes:"
pm2 logs revenda-api --lines 10

log "🎉 Deploy concluído com sucesso!"
log "🌐 API disponível em: http://localhost:3001"
log "📊 Monitoramento: pm2 monit"
log "📋 Logs: pm2 logs revenda-api"
