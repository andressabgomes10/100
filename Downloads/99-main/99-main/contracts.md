# API Contracts - Sistema de Localização de Revendas

## Overview
Sistema para localizar revendas Nacional Gás por CEP. Frontend implementado com dados mockados, backend será integrado para busca real.

## Current Mock Data (frontend/src/data/mockData.js)
- Array de 10 revendas em São Paulo
- Campos: id, name, address, neighborhood, city, state, cep, phone, hours, distance

## Backend Implementation Required

### 1. Database Schema (MongoDB)
```javascript
// Collection: resellers
{
  _id: ObjectId,
  name: String,           // Nome da revenda
  address: String,        // Endereço completo
  neighborhood: String,   // Bairro
  city: String,          // Cidade
  state: String,         // Estado (UF)
  cep: String,           // CEP no formato "00000-000"
  phone: String,         // Telefone no formato "(00) 0000-0000"
  hours: String,         // Horário de funcionamento
  coordinates: {         // Para cálculo de distância
    lat: Number,
    lng: Number
  },
  active: Boolean,       // Revenda ativa
  created_at: Date,
  updated_at: Date
}
```

### 2. API Endpoints

#### POST /api/resellers/search
**Request:**
```json
{
  "cep": "01234-567"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "address": "string", 
      "neighborhood": "string",
      "city": "string",
      "state": "string",
      "cep": "string",
      "phone": "string",
      "hours": "string",
      "distance": number // km calculada
    }
  ],
  "total": number
}
```

**Response No Results (200):**
```json
{
  "success": true,
  "data": [],
  "total": 0
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "CEP inválido"
}
```

#### GET /api/resellers (Admin - opcional)
Listar todas as revendas para administração

#### POST /api/resellers (Admin - opcional)  
Criar nova revenda

### 3. Business Logic
1. **Validação CEP:** Verificar formato brasileiro (00000-000)
2. **Geocoding:** Converter CEP para coordenadas (API externa ou banco local)
3. **Cálculo Distância:** Fórmula Haversine para distância entre coordenadas
4. **Ordenação:** Resultados ordenados por distância (mais próximo primeiro)
5. **Limite:** Máximo 10 resultados por busca

### 4. Frontend Integration Changes
**Remove:**
- `mockData.js` import
- Mock setTimeout simulation 
- Mock filtering logic

**Update:**
- `handleSearch()` function to call API `/api/resellers/search`
- Error handling for API failures
- Loading state management

### 5. External APIs Needed
- **CEP to Coordinates:** ViaCEP + Google Geocoding ou similar
- Alternativa: Banco local de CEPs brasileiros

### 6. Error Handling
- CEP formato inválido
- CEP não encontrado  
- Falha na API externa
- Timeout de requisição
- Erro no banco de dados

## Implementation Priority
1. ✅ Frontend with mock data (COMPLETED)
2. 🔄 Backend API with real database
3. 🔄 Frontend integration (remove mocks)
4. 🔄 Error handling
5. 🔄 Testing and optimization