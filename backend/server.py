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
from services.geocoding_service import GeocodingService
from services.data_enrichment_service import DataEnrichmentService

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Initialize services
reseller_service = ResellerService(db)

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

# Startup event to populate initial data
@app.on_event("startup")
async def startup_db():
    """Initialize database with sample data if empty"""
    try:
        await reseller_service.populate_initial_data()
        logger.info("✅ Database initialized successfully")
    except Exception as e:
        logger.error(f"❌ Error initializing database: {str(e)}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
