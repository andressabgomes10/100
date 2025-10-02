from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime

# Import models and services
from models.reseller import (
    SearchRequest, SearchResponse, ResellerResponse, 
    CNPJRequest, CNPJResponse, GeocodeRequest, GeocodeResponse,
    ImportCSVRequest, ImportCSVResponse
)
from services.reseller_service import ResellerService
from services.cep_service import CEPService
from services.cnpj_service import CNPJService
from services.enhanced_geocoding_service import enhanced_geocoding_service
from services.optimized_data_service import OptimizedDataService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
reseller_service = ResellerService(db)
optimized_data_service = OptimizedDataService(db)

# Create the main app without a prefix
app = FastAPI(title="Nacional Gás - Reseller Locator API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Define Models for existing endpoints
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Existing routes
@api_router.get("/")
async def root():
    return {"message": "Nacional Gás Reseller Locator API - Running!"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# New reseller routes
@api_router.post("/resellers/search", response_model=SearchResponse)
async def search_resellers(request: SearchRequest):
    """
    Busca revendas próximas a um CEP
    """
    try:
        # Valida CEP
        if not CEPService.validate_cep(request.cep):
            return SearchResponse(
                success=False,
                data=[],
                total=0,
                message="CEP inválido. Use o formato 00000-000 ou 00000000."
            )
        
        # Busca revendas
        resellers = await reseller_service.search_resellers_by_cep(
            cep=request.cep,
            max_distance=50.0,  # 50km de raio
            limit=10
        )
        
        if not resellers:
            return SearchResponse(
                success=True,
                data=[],
                total=0,
                message="Nenhuma revenda encontrada próxima ao CEP informado."
            )
        
        return SearchResponse(
            success=True,
            data=resellers,
            total=len(resellers)
        )
        
    except Exception as e:
        logger.error(f"Erro na busca por revendas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor. Tente novamente."
        )

@api_router.get("/resellers", response_model=List[ResellerResponse])
async def get_all_resellers():
    """
    Lista todas as revendas (para administração)
    """
    try:
        resellers = await reseller_service.get_all_resellers()
        
        reseller_responses = []
        for reseller in resellers:
            reseller_response = ResellerResponse(
                id=reseller.id,
                name=reseller.name,
                address=reseller.address,
                neighborhood=reseller.neighborhood,
                city=reseller.city,
                state=reseller.state,
                cep=reseller.cep,
                phone=reseller.phone,
                hours=reseller.hours
            )
            reseller_responses.append(reseller_response)
        
        return reseller_responses
        
    except Exception as e:
        logger.error(f"Erro ao listar revendas: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor."
        )

# Novas APIs para CNPJ e Geocoding
@api_router.post("/cnpj/lookup", response_model=CNPJResponse)
async def lookup_cnpj(request: CNPJRequest):
    """
    Busca dados de uma empresa por CNPJ usando BrasilAPI
    """
    try:
        cnpj_data = await CNPJService.get_company_data(request.cnpj)
        
        if cnpj_data:
            return CNPJResponse(
                success=True,
                data=cnpj_data,
                message="Dados da empresa encontrados com sucesso"
            )
        else:
            return CNPJResponse(
                success=False,
                data=None,
                message="CNPJ não encontrado ou inválido"
            )
            
    except Exception as e:
        logger.error(f"Erro na consulta CNPJ: {str(e)}")
        return CNPJResponse(
            success=False,
            data=None,
            message=f"Erro interno: {str(e)}"
        )

@api_router.post("/geocode", response_model=GeocodeResponse)
async def geocode_address(request: GeocodeRequest):
    """
    Busca coordenadas de um endereço usando OpenStreetMap
    """
    try:
        coord_data = await enhanced_geocoding_service.get_coordinates_from_address(
            address=request.address,
            city=request.city,
            state=request.state
        )
        
        if coord_data:
            coordinates = {
                'lat': coord_data['lat'],
                'lng': coord_data['lng']
            }
            return GeocodeResponse(
                success=True,
                data=coordinates,
                message="Coordenadas encontradas com sucesso"
            )
        else:
            return GeocodeResponse(
                success=False,
                data=None,
                message="Endereço não encontrado"
            )
            
    except Exception as e:
        logger.error(f"Erro na geocodificação: {str(e)}")
        return GeocodeResponse(
            success=False,
            data=None,
            message=f"Erro interno: {str(e)}"
        )

# APIs para processamento de dados
# APIs otimizadas para processamento de dados
@api_router.post("/data/import-optimized", response_model=ImportCSVResponse)
async def import_optimized_data():
    """
    Importa dados do CSV normalizado otimizado
    """
    try:
        result = await optimized_data_service.import_normalized_csv()
        
        return ImportCSVResponse(
            success=result['success'],
            message=result['message'],
            total_imported=result['total_imported'],
            total_enriched=0,
            errors=[]
        )
        
    except Exception as e:
        logger.error(f"Erro na importação otimizada: {str(e)}")
        return ImportCSVResponse(
            success=False,
            message=f"Erro na importação otimizada: {str(e)}",
            total_imported=0,
            total_enriched=0,
            errors=[str(e)]
        )

@api_router.post("/data/smart-enrich", response_model=ImportCSVResponse)
async def smart_enrich_data():
    """
    Enriquecimento inteligente de dados priorizando revendas mais importantes
    """
    try:
        result = await optimized_data_service.smart_enrich_all_data(batch_size=15)
        
        return ImportCSVResponse(
            success=result['success'],
            message=result['message'],
            total_imported=result['total_processed'],
            total_enriched=result['total_enriched'],
            errors=[]
        )
        
    except Exception as e:
        logger.error(f"Erro no enriquecimento inteligente: {str(e)}")
        return ImportCSVResponse(
            success=False,
            message=f"Erro no enriquecimento inteligente: {str(e)}",
            total_imported=0,
            total_enriched=0,
            errors=[str(e)]
        )

@api_router.get("/data/optimized-stats")
async def get_optimized_stats():
    """
    Retorna estatísticas otimizadas e detalhadas dos dados
    """
    try:
        stats = await optimized_data_service.get_optimization_stats()
        return {
            "success": True,
            "data": stats
        }
        
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas otimizadas: {str(e)}")
        return {
            "success": False,
            "message": f"Erro: {str(e)}"
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event
@app.on_event("startup")
async def startup_db():
    """Initialize database"""
    try:
        logger.info("✅ Database connected successfully")
        # Note: Use /api/data/import-csv to import real reseller data
        # Use /api/data/enrich-all to enrich with CNPJ and geocoding data
    except Exception as e:
        logger.error(f"❌ Error connecting to database: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
