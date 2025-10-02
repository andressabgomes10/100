#!/bin/bash
# 🚀 Script de Deploy Automático - Railway + Supabase

echo "🚀 Iniciando deploy automático da Revenda Proximidade API..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Execute este script no diretório raiz do projeto"
fi

# 1. Verificar dependências
log "📦 Verificando dependências..."
if ! command -v node &> /dev/null; then
    error "Node.js não está instalado"
fi

if ! command -v npm &> /dev/null; then
    error "npm não está instalado"
fi

# 2. Instalar dependências
log "📦 Instalando dependências..."
npm ci || error "Falha ao instalar dependências"

# 3. Build do projeto
log "🔨 Fazendo build do projeto..."
npm run build || error "Falha no build"

# 4. Verificar se Railway CLI está instalado
if ! command -v railway &> /dev/null; then
    warn "Railway CLI não está instalado. Instalando..."
    
    # Tentar instalar via npm
    npm install -g @railway/cli || {
        warn "Falha ao instalar Railway CLI via npm. Tentando método alternativo..."
        
        # Método alternativo para Windows
        if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            info "Baixando Railway CLI para Windows..."
            curl -L https://github.com/railwayapp/cli/releases/latest/download/railway-windows-x86_64.zip -o railway.zip
            unzip railway.zip
            mv railway.exe /usr/local/bin/ || mv railway.exe .
            chmod +x railway.exe
        else
            # Método para Linux/Mac
            curl -fsSL https://railway.app/install.sh | sh
        fi
    }
fi

# 5. Verificar login no Railway
log "🔐 Verificando login no Railway..."
if ! railway whoami &> /dev/null; then
    warn "Não está logado no Railway. Faça login:"
    echo "1. Acesse: https://railway.app"
    echo "2. Faça login com sua conta"
    echo "3. Execute: railway login"
    echo "4. Execute este script novamente"
    exit 1
fi

# 6. Inicializar projeto Railway
log "🚂 Inicializando projeto Railway..."
if [ ! -f ".railway/project.json" ]; then
    railway init || error "Falha ao inicializar projeto Railway"
fi

# 7. Configurar variáveis de ambiente
log "⚙️ Configurando variáveis de ambiente..."

# API Key
railway variables set API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo

# Configurações básicas
railway variables set NODE_ENV=production
railway variables set PORT=3001

# CORS
railway variables set CORS_ORIGINS=https://nacionalgas.com.br,https://app.minharevenda.com.br,https://gasdopovo.figma.site

# Rate Limiting
railway variables set RATE_LIMIT_MAX=100
railway variables set RATE_LIMIT_TIME_WINDOW=60000

# Timeouts
railway variables set HTTP_TIMEOUT=10000
railway variables set REQUEST_TIMEOUT=30000

# Geocoding (opcional)
railway variables set GEO_PROVIDER=none
railway variables set GEO_API_KEY=""

# Supabase (será configurado manualmente)
warn "⚠️ Configure as variáveis do Supabase manualmente:"
echo "railway variables set SUPABASE_URL=https://seu-projeto.supabase.co"
echo "railway variables set SUPABASE_ANON_KEY=sua_chave_anonima"
echo "railway variables set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role"

# 8. Deploy
log "🚀 Fazendo deploy..."
railway up || error "Falha no deploy"

# 9. Aguardar deploy
log "⏳ Aguardando deploy finalizar..."
sleep 30

# 10. Obter URL do projeto
log "🌐 Obtendo URL do projeto..."
PROJECT_URL=$(railway domain 2>/dev/null || echo "https://seu-projeto-production.up.railway.app")

# 11. Teste de saúde
log "🏥 Testando saúde da API..."
if curl -f "$PROJECT_URL/health" > /dev/null 2>&1; then
    log "✅ API está funcionando!"
else
    warn "⚠️ API pode não estar respondendo ainda. Aguarde alguns minutos."
fi

# 12. Mostrar informações finais
echo ""
echo "🎉 Deploy concluído!"
echo "=================================="
echo "🌐 URL da API: $PROJECT_URL"
echo "🔐 API Key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o Supabase:"
echo "   - Acesse: https://supabase.com"
echo "   - Crie um projeto"
echo "   - Execute o arquivo supabase-schema.sql"
echo "   - Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY"
echo ""
echo "2. Teste a API:"
echo "   curl -H \"x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo\" \\"
echo "        $PROJECT_URL/cep/60115000"
echo ""
echo "3. Configure seu site para usar:"
echo "   $PROJECT_URL"
echo ""
echo "📊 Monitoramento:"
echo "   - Railway Dashboard: https://railway.app/dashboard"
echo "   - Logs: railway logs"
echo "   - Status: railway status"
echo ""
echo "🔗 Integração Make/Integromat:"
echo "   - Use o arquivo: make-integration-production.json"
echo "   - URL: $PROJECT_URL"
echo "   - API Key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"
echo ""

log "✅ Deploy automático concluído com sucesso!"
