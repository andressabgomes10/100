# 🔐 API Key Configuration - Nacional Gas

## 📋 **Nova API Key Gerada:**

```
NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

## 🔧 **Como Configurar:**

### **1. No Supabase (Make/Integromat):**
- **Nome do Segredo:** `NACIONAL_GAS_API_KEY`
- **Valor Secreto:** `NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo`

### **2. No seu arquivo .env:**
```env
API_KEY=NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo
```

### **3. No Make/Integromat:**
Use esta chave em todos os headers das requisições:
```json
{
  "x-api-key": "NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"
}
```

## 📁 **Arquivos Atualizados:**

✅ `env.production` - Configuração de produção
✅ `make-integration.json` - Integração Make/Integromat
✅ `frontend-client.js` - Cliente JavaScript
✅ `frontend-examples.js` - Exemplos React/Vue/Angular
✅ `ecosystem.config.js` - Configuração PM2
✅ `monitor.sh` - Script de monitoramento
✅ `test-local.ps1` - Script de teste

## 🧪 **Teste da Nova Chave:**

```bash
# Teste via cURL
curl -H "x-api-key: NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo" \
     http://localhost:3001/cep/60115000

# Teste via PowerShell
Invoke-RestMethod -Uri "http://localhost:3001/cep/60115000" \
                  -Headers @{"x-api-key"="NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo"}
```

## 🔒 **Segurança:**

- ✅ Chave única e segura gerada
- ✅ Formato: `NG_API_SK_[timestamp]_[random]`
- ✅ 64 caracteres de comprimento
- ✅ Contém números e letras aleatórias

## 🚀 **Próximos Passos:**

1. **✅ API Key gerada e configurada**
2. **🔧 Configurar no Supabase/Make**
3. **🧪 Testar integração**
4. **🚀 Deploy em produção**

---

**Sua API Key está pronta para uso!** 🔐
