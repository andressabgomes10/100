#!/bin/bash
# 📊 Script de Monitoramento da API

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_URL="http://localhost:3001"
API_KEY="NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"

# Função para fazer requisição
make_request() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X $method \
             -H "x-api-key: $API_KEY" \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$API_URL$endpoint"
    else
        curl -s -X $method \
             -H "x-api-key: $API_KEY" \
             "$API_URL$endpoint"
    fi
}

# Verificar saúde da aplicação
check_health() {
    echo -e "${BLUE}🏥 Verificando saúde da aplicação...${NC}"
    
    local response=$(make_request "/health")
    local status=$(echo $response | jq -r '.ok' 2>/dev/null)
    
    if [ "$status" = "true" ]; then
        echo -e "${GREEN}✅ Aplicação está saudável${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}❌ Aplicação não está saudável${NC}"
        echo "$response"
        return 1
    fi
}

# Verificar estatísticas
check_stats() {
    echo -e "${BLUE}📊 Verificando estatísticas...${NC}"
    
    local response=$(make_request "/stats")
    echo "$response" | jq '.'
}

# Testar busca de CEP
test_cep() {
    echo -e "${BLUE}📍 Testando busca de CEP...${NC}"
    
    local response=$(make_request "/cep/60115000")
    local cidade=$(echo $response | jq -r '.cidade' 2>/dev/null)
    
    if [ "$cidade" != "null" ] && [ -n "$cidade" ]; then
        echo -e "${GREEN}✅ Busca de CEP funcionando${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${RED}❌ Busca de CEP falhou${NC}"
        echo "$response"
    fi
}

# Testar revenda mais próxima
test_nearest() {
    echo -e "${BLUE}🏢 Testando revenda mais próxima...${NC}"
    
    local data='{"lat":-3.73,"lng":-38.52,"tipo":"empresarial"}'
    local response=$(make_request "/test/revenda-mais-proxima" "POST" "$data")
    local cnpj=$(echo $response | jq -r '.revenda.cnpj' 2>/dev/null)
    
    if [ "$cnpj" != "null" ] && [ -n "$cnpj" ]; then
        echo -e "${GREEN}✅ Revenda mais próxima funcionando${NC}"
        echo "$response" | jq '.'
    else
        echo -e "${YELLOW}⚠️ Revenda mais próxima: $response${NC}"
    fi
}

# Verificar logs do PM2
check_logs() {
    echo -e "${BLUE}📋 Verificando logs recentes...${NC}"
    
    if command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}Últimas 10 linhas de log:${NC}"
        pm2 logs revenda-api --lines 10 --nostream
    else
        echo -e "${YELLOW}PM2 não encontrado${NC}"
    fi
}

# Verificar uso de recursos
check_resources() {
    echo -e "${BLUE}💻 Verificando uso de recursos...${NC}"
    
    if command -v pm2 &> /dev/null; then
        pm2 status
    fi
    
    echo -e "${YELLOW}Uso de CPU e Memória:${NC}"
    top -bn1 | grep "Cpu\|Mem" | head -2
}

# Verificar conectividade
check_connectivity() {
    echo -e "${BLUE}🌐 Verificando conectividade...${NC}"
    
    # Verificar se porta está aberta
    if netstat -tuln | grep -q ":3001"; then
        echo -e "${GREEN}✅ Porta 3001 está aberta${NC}"
    else
        echo -e "${RED}❌ Porta 3001 não está aberta${NC}"
    fi
    
    # Verificar resposta HTTP
    if curl -s -f "$API_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ API responde HTTP${NC}"
    else
        echo -e "${RED}❌ API não responde HTTP${NC}"
    fi
}

# Menu principal
show_menu() {
    echo -e "${BLUE}📊 Monitoramento da Revenda API${NC}"
    echo "1. Verificar saúde"
    echo "2. Verificar estatísticas"
    echo "3. Testar busca de CEP"
    echo "4. Testar revenda mais próxima"
    echo "5. Verificar logs"
    echo "6. Verificar recursos"
    echo "7. Verificar conectividade"
    echo "8. Executar todos os testes"
    echo "0. Sair"
}

# Executar todos os testes
run_all_tests() {
    echo -e "${BLUE}🚀 Executando todos os testes...${NC}"
    echo "=================================="
    
    check_health
    echo ""
    
    check_stats
    echo ""
    
    test_cep
    echo ""
    
    test_nearest
    echo ""
    
    check_logs
    echo ""
    
    check_resources
    echo ""
    
    check_connectivity
    echo ""
    
    echo -e "${GREEN}✅ Todos os testes concluídos!${NC}"
}

# Menu interativo
if [ $# -eq 0 ]; then
    while true; do
        show_menu
        read -p "Escolha uma opção: " choice
        
        case $choice in
            1) check_health ;;
            2) check_stats ;;
            3) test_cep ;;
            4) test_nearest ;;
            5) check_logs ;;
            6) check_resources ;;
            7) check_connectivity ;;
            8) run_all_tests ;;
            0) echo "Saindo..."; exit 0 ;;
            *) echo "Opção inválida" ;;
        esac
        
        echo ""
        read -p "Pressione Enter para continuar..."
        clear
    done
else
    # Executar comando específico
    case $1 in
        health) check_health ;;
        stats) check_stats ;;
        cep) test_cep ;;
        nearest) test_nearest ;;
        logs) check_logs ;;
        resources) check_resources ;;
        connectivity) check_connectivity ;;
        all) run_all_tests ;;
        *) echo "Uso: $0 [health|stats|cep|nearest|logs|resources|connectivity|all]" ;;
    esac
fi
