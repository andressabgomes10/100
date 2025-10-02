# 🚀 Deploy Simples - Revenda Proximidade API

Write-Host "🚀 Iniciando deploy da Revenda Proximidade API..." -ForegroundColor Green

# 1. Verificar se Railway CLI está instalado
Write-Host "🔍 Verificando Railway CLI..." -ForegroundColor Yellow
try {
    railway --version | Out-Null
    Write-Host "✅ Railway CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI não encontrado" -ForegroundColor Red
    Write-Host "📥 Instalando Railway CLI..." -ForegroundColor Yellow
    
    # Tentar instalar via npm
    try {
        npm install -g @railway/cli
        Write-Host "✅ Railway CLI instalado com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "❌ Falha ao instalar Railway CLI" -ForegroundColor Red
        Write-Host "📋 Instale manualmente:" -ForegroundColor Yellow
        Write-Host "1. Acesse: https://railway.app" -ForegroundColor White
        Write-Host "2. Faça login com sua conta" -ForegroundColor White
        Write-Host "3. Execute: railway login" -ForegroundColor White
        Write-Host "4. Execute este script novamente" -ForegroundColor White
        exit 1
    }
}

# 2. Verificar login no Railway
Write-Host "🔐 Verificando login no Railway..." -ForegroundColor Yellow
try {
    railway whoami | Out-Null
    Write-Host "✅ Logado no Railway" -ForegroundColor Green
} catch {
    Write-Host "❌ Não está logado no Railway" -ForegroundColor Red
    Write-Host "📋 Faça login:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://railway.app" -ForegroundColor White
    Write-Host "2. Faça login com sua conta" -ForegroundColor White
    Write-Host "3. Execute: railway login" -ForegroundColor White
    Write-Host "4. Execute este script novamente" -ForegroundColor White
    exit 1
}

# 3. Inicializar projeto Railway
Write-Host "🚂 Inicializando projeto Railway..." -ForegroundColor Yellow
if (-not (Test-Path ".railway/project.json")) {
    try {
        railway init
        Write-Host "✅ Projeto Railway inicializado" -ForegroundColor Green
    } catch {
        Write-Host "❌ Falha ao inicializar projeto Railway" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Projeto Railway já inicializado" -ForegroundColor Green
}

# 4. Configurar variáveis de ambiente
Write-Host "⚙️ Configurando variáveis de ambiente..." -ForegroundColor Yellow

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

Write-Host "✅ Variáveis de ambiente configuradas" -ForegroundColor Green

# 5. Deploy
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Yellow
try {
    railway up
    Write-Host "✅ Deploy iniciado" -ForegroundColor Green
} catch {
    Write-Host "❌ Falha no deploy" -ForegroundColor Red
    exit 1
}

# 6. Aguardar deploy
Write-Host "⏳ Aguardando deploy finalizar..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# 7. Obter URL do projeto
Write-Host "🌐 Obtendo URL do projeto..." -ForegroundColor Yellow
try {
    $PROJECT_URL = railway domain
    if (-not $PROJECT_URL) {
        $PROJECT_URL = "https://seu-projeto-production.up.railway.app"
    }
} catch {
    $PROJECT_URL = "https://seu-projeto-production.up.railway.app"
}

# 8. Teste de saúde
Write-Host "🏥 Testando saúde da API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$PROJECT_URL/health" -Method GET -TimeoutSec 10
    Write-Host "✅ API está funcionando!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API pode não estar respondendo ainda. Aguarde alguns minutos." -ForegroundColor Yellow
}

# 9. Mostrar informações finais
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

Write-Host "✅ Deploy automático concluído com sucesso!" -ForegroundColor Green
