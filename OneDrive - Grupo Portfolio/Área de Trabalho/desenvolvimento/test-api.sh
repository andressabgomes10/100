#!/bin/bash
# 🧪 Coleção de Testes cURL - Revenda Proximidade API
# Pronto para colar e executar

# Variáveis locais
API="http://localhost:3001"
KEY="changeme"

echo "🚀 Testando Revenda Proximidade API"
echo "=================================="

# 1) Health (público)
echo -e "\n1️⃣ Health Check (público):"
curl -s "$API/health" | python -m json.tool

# 2) CEP (com API Key)
echo -e "\n2️⃣ Buscar CEP (com API Key):"
curl -s -H "x-api-key: $KEY" "$API/cep/60115000" | python -m json.tool

# 3) Revenda mais próxima (empresarial)
echo -e "\n3️⃣ Revenda mais próxima (empresarial):"
curl -s -X POST "$API/revenda-mais-proxima" \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{"cep":"60115000","tipo":"empresarial"}' | python -m json.tool

# 4) Lista paginada
echo -e "\n4️⃣ Lista revendas (paginada):"
curl -s -H "x-api-key: $KEY" "$API/revendas?limit=5&offset=0" | python -m json.tool

# 5) Upsert de revenda
echo -e "\n5️⃣ Upsert de revenda:"
curl -s -X POST "$API/revendas" \
  -H "x-api-key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
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
  }' | python -m json.tool

# 6) Stats
echo -e "\n6️⃣ Estatísticas:"
curl -s -H "x-api-key: $KEY" "$API/stats" | python -m json.tool

# 7) Teste de erro - CEP inválido
echo -e "\n7️⃣ Teste de erro - CEP inválido:"
curl -s -H "x-api-key: $KEY" "$API/cep/123" | python -m json.tool

# 8) Teste de erro - API Key ausente
echo -e "\n8️⃣ Teste de erro - API Key ausente:"
curl -s "$API/cep/60115000" | python -m json.tool

echo -e "\n✅ Testes concluídos!"
echo "💡 Dica: No Windows, troque 'python -m json.tool' por '| python -m json.tool' ou remova o pipe"
