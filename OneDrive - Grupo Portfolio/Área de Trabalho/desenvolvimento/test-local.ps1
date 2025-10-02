# 🧪 Script de Teste Local - Revenda Proximidade API
# Execute este script para testar todas as funcionalidades

$API_URL = "http://localhost:3001"
$API_KEY = "NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"

Write-Host "🚀 Testando Revenda Proximidade API" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Função para fazer requisições
function Test-API {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    $Headers["x-api-key"] = $API_KEY
    
    try {
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $Headers -Body $Body -ContentType "application/json"
        } else {
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $Headers
        }
        return $response
    }
    catch {
        Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# 1. Health Check
Write-Host "`n1️⃣ Health Check (público):" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method GET
    Write-Host "✅ Aplicação saudável!" -ForegroundColor Green
    $health | Format-Table -AutoSize
} catch {
    Write-Host "❌ Health check falhou" -ForegroundColor Red
}

# 2. Buscar CEP
Write-Host "`n2️⃣ Buscar CEP (60115000):" -ForegroundColor Yellow
$cep = Test-API -Endpoint "/cep/60115000"
if ($cep) {
    Write-Host "✅ CEP encontrado!" -ForegroundColor Green
    $cep | Format-Table -AutoSize
}

# 3. Listar Revendas
Write-Host "`n3️⃣ Listar Revendas:" -ForegroundColor Yellow
$revendas = Test-API -Endpoint "/revendas?limit=3"
if ($revendas) {
    Write-Host "✅ Revendas listadas!" -ForegroundColor Green
    Write-Host "Total: $($revendas.total), Ativas: $($revendas.data.Count)"
    $revendas.data | Select-Object cnpj, nome_fantasia, cidade, ativo | Format-Table -AutoSize
}

# 4. Buscar Revenda por CNPJ
Write-Host "`n4️⃣ Buscar Revenda por CNPJ:" -ForegroundColor Yellow
$revenda = Test-API -Endpoint "/revendas/12345678000199"
if ($revenda) {
    Write-Host "✅ Revenda encontrada!" -ForegroundColor Green
    $revenda | Select-Object cnpj, nome_fantasia, cidade, telefone, ativo | Format-Table -AutoSize
}

# 5. Criar Nova Revenda
Write-Host "`n5️⃣ Criar Nova Revenda:" -ForegroundColor Yellow
$novaRevenda = @{
    cnpj = "11111111000111"
    nome_fantasia = "Revenda Teste Local"
    cep = "60115000"
    cidade = "Fortaleza"
    uf = "CE"
    latitude = -3.73
    longitude = -38.52
    ativo = $true
    atende_empresarial = $true
    atende_residencial = $true
} | ConvertTo-Json

$criada = Test-API -Endpoint "/revendas" -Method "POST" -Body $novaRevenda
if ($criada) {
    Write-Host "✅ Revenda criada!" -ForegroundColor Green
    $criada | Select-Object cnpj, nome_fantasia, cidade, ativo | Format-Table -AutoSize
}

# 6. Revenda Mais Próxima (por coordenadas)
Write-Host "`n6️⃣ Revenda Mais Próxima (coordenadas):" -ForegroundColor Yellow
$coordenadas = @{
    lat = -3.73
    lng = -38.52
    tipo = "empresarial"
} | ConvertTo-Json

$proxima = Test-API -Endpoint "/test/revenda-mais-proxima" -Method "POST" -Body $coordenadas
if ($proxima) {
    Write-Host "✅ Revenda mais próxima encontrada!" -ForegroundColor Green
    Write-Host "CNPJ: $($proxima.revenda.cnpj)"
    Write-Host "Nome: $($proxima.revenda.nome_fantasia)"
    Write-Host "Distância: $($proxima.revenda.distancia_km) km"
    Write-Host "Critério: $($proxima.criterio)"
}

# 7. Estatísticas
Write-Host "`n7️⃣ Estatísticas:" -ForegroundColor Yellow
$stats = Test-API -Endpoint "/stats"
if ($stats) {
    Write-Host "✅ Estatísticas obtidas!" -ForegroundColor Green
    Write-Host "Consultas CEP: $($stats.cep_lookups)"
    Write-Host "Cache Hits: $($stats.cep_cache_hits)"
    Write-Host "Consultas Proximidade: $($stats.nearest_queries)"
    Write-Host "Sem Cobertura: $($stats.no_coverage)"
    Write-Host "Total Revendas: $($stats.revendas.total)"
    Write-Host "Revendas Ativas: $($stats.revendas.ativas)"
}

# 8. Teste de Erro - API Key Ausente
Write-Host "`n8️⃣ Teste de Erro (API Key ausente):" -ForegroundColor Yellow
try {
    $erro = Invoke-RestMethod -Uri "$API_URL/cep/60115000" -Method GET
    Write-Host "❌ Deveria ter falhado!" -ForegroundColor Red
} catch {
    Write-Host "✅ Erro esperado: API Key obrigatória" -ForegroundColor Green
}

# 9. Teste de Erro - CEP Inválido
Write-Host "`n9️⃣ Teste de Erro (CEP inválido):" -ForegroundColor Yellow
try {
    $erro = Test-API -Endpoint "/cep/123"
    Write-Host "❌ Deveria ter falhado!" -ForegroundColor Red
} catch {
    Write-Host "✅ Erro esperado: CEP inválido" -ForegroundColor Green
}

Write-Host "`n🎉 Todos os testes concluídos!" -ForegroundColor Green
Write-Host "🌐 API disponível em: $API_URL" -ForegroundColor Cyan
Write-Host "📊 Health check: $API_URL/health" -ForegroundColor Cyan
Write-Host "📋 Stats: $API_URL/stats" -ForegroundColor Cyan
