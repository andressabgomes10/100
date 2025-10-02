# 🚀 Script de Deploy Automático - Railway + Supabase (Windows PowerShell)

Write-Host "🚀 Iniciando deploy automático da Revenda Proximidade API..." -ForegroundColor Green

# Função para log colorido
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    exit 1
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Info-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Verificar se estamos no diretório correto
if (-not (Test-Path "package.json")) {
    Write-Error-Log "Execute este script no diretório raiz do projeto"
}

# 1. Verificar dependências
Write-Log "📦 Verificando dependências..."
try {
    $nodeVersion = node --version
    Write-Log "Node.js: $nodeVersion"
} catch {
    Write-Error-Log "Node.js não está instalado"
}

try {
    $npmVersion = npm --version
    Write-Log "npm: $npmVersion"
} catch {
    Write-Error-Log "npm não está instalado"
}

# 2. Instalar dependências
Write-Log "📦 Instalando dependências..."
try {
    npm ci
    Write-Log "✅ Dependências instaladas com sucesso"
} catch {
    Write-Error-Log "Falha ao instalar dependências"
}

# 3. Build do projeto
Write-Log "🔨 Fazendo build do projeto..."
try {
    npm run build
    Write-Log "✅ Build concluído com sucesso"
} catch {
    Write-Error-Log "Falha no build"
}

# 4. Verificar se Railway CLI está instalado
Write-Log "🚂 Verificando Railway CLI..."
try {
    $railwayVersion = railway --version
    Write-Log "Railway CLI: $railwayVersion"
} catch {
    Write-Warning-Log "Railway CLI não está instalado. Instalando..."
    
    try {
        npm install -g @railway/cli
        Write-Log "✅ Railway CLI instalado com sucesso"
    } catch {
        Write-Warning-Log "Falha ao instalar Railway CLI via npm"
        Write-Info-Log "Instale manualmente:"
        Write-Info-Log "1. Acesse: https://railway.app"
        Write-Info-Log "2. Faça login com sua conta"
        Write-Info-Log "3. Execute: railway login"
        Write-Info-Log "4. Execute este script novamente"
        exit 1
    }
}

# 5. Verificar login no Railway
Write-Log "🔐 Verificando login no Railway..."
try {
    railway whoami | Out-Null
    Write-Log "✅ Logado no Railway"
} catch {
    Write-Warning-Log "Não está logado no Railway"
    Write-Info-Log "Faça login:"
    Write-Info-Log "1. Acesse: https://railway.app"
    Write-Info-Log "2. Faça login com sua conta"
    Write-Info-Log "3. Execute: railway login"
    Write-Info-Log "4. Execute este script novamente"
    exit 1
}

# 6. Inicializar projeto Railway
Write-Log "🚂 Inicializando projeto Railway..."
if (-not (Test-Path ".railway/project.json")) {
    try {
        railway init
        Write-Log "✅ Projeto Railway inicializado"
    } catch {
        Write-Error-Log "Falha ao inicializar projeto Railway"
    }
}

# 7. Configurar variáveis de ambiente
Write-Log "⚙️ Configurando variáveis de ambiente..."

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

Write-Log "✅ Variáveis de ambiente configuradas"

# Supabase (será configurado manualmente)
Write-Warning-Log "⚠️ Configure as variáveis do Supabase manualmente:"
Write-Info-Log "railway variables set SUPABASE_URL=https://seu-projeto.supabase.co"
Write-Info-Log "railway variables set SUPABASE_ANON_KEY=sua_chave_anonima"
Write-Info-Log "railway variables set SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role"

# 8. Deploy
Write-Log "🚀 Fazendo deploy..."
try {
    railway up
    Write-Log "✅ Deploy iniciado"
} catch {
    Write-Error-Log "Falha no deploy"
}

# 9. Aguardar deploy
Write-Log "⏳ Aguardando deploy finalizar..."
Start-Sleep -Seconds 30

# 10. Obter URL do projeto
Write-Log "🌐 Obtendo URL do projeto..."
try {
    $PROJECT_URL = railway domain
    if (-not $PROJECT_URL) {
        $PROJECT_URL = "https://seu-projeto-production.up.railway.app"
    }
} catch {
    $PROJECT_URL = "https://seu-projeto-production.up.railway.app"
}

# 11. Teste de saúde
Write-Log "🏥 Testando saúde da API..."
try {
    $response = Invoke-RestMethod -Uri "$PROJECT_URL/health" -Method GET -TimeoutSec 10
    Write-Log "✅ API está funcionando!"
} catch {
    Write-Warning-Log "⚠️ API pode não estar respondendo ainda. Aguarde alguns minutos."
}

# 12. Mostrar informações finais
Write-Host ""
Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "🌐 URL da API: $PROJECT_URL" -ForegroundColor Cyan
Write-Host "🔐 API Key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Configure o Supabase:" -ForegroundColor White
Write-Host "   - Acesse: https://supabase.com" -ForegroundColor White
Write-Host "   - Crie um projeto" -ForegroundColor White
Write-Host "   - Execute o arquivo supabase-schema.sql" -ForegroundColor White
Write-Host "   - Configure as variáveis SUPABASE_URL e SUPABASE_ANON_KEY" -ForegroundColor White
Write-Host ""
Write-Host "2. Teste a API:" -ForegroundColor White
Write-Host "   Invoke-RestMethod -Uri '$PROJECT_URL/cep/60115000' -Headers @{'x-api-key'='NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo'}" -ForegroundColor White
Write-Host ""
Write-Host "3. Configure seu site para usar:" -ForegroundColor White
Write-Host "   $PROJECT_URL" -ForegroundColor White
Write-Host ""
Write-Host "📊 Monitoramento:" -ForegroundColor Yellow
Write-Host "   - Railway Dashboard: https://railway.app/dashboard" -ForegroundColor White
Write-Host "   - Logs: railway logs" -ForegroundColor White
Write-Host "   - Status: railway status" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Integração Make/Integromat:" -ForegroundColor Yellow
Write-Host "   - Use o arquivo: make-integration-production.json" -ForegroundColor White
Write-Host "   - URL: $PROJECT_URL" -ForegroundColor White
Write-Host "   - API Key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" -ForegroundColor White
Write-Host ""

Write-Log "Deploy automático concluído com sucesso!"
