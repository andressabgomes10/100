from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Coordinates(BaseModel):
    lat: float
    lng: float

class CNPJData(BaseModel):
    cnpj: str
    razao_social: Optional[str] = None
    nome_fantasia: Optional[str] = None
    atividade_principal: Optional[str] = None
    situacao: Optional[str] = None
    telefone: Optional[str] = None
    email: Optional[str] = None

class Reseller(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    cnpj: Optional[str] = None
    cnpj_data: Optional[CNPJData] = None
    address: str
    neighborhood: str
    city: str
    state: str
    cep: str
    phone: str
    whatsapp: Optional[str] = None
    hours: str
    coordinates: Optional[Coordinates] = None
    geocoding_source: Optional[str] = None  # 'nominatim', 'google_maps', 'manual', etc
    active: bool = True
    data_enriched: bool = False  # Flag para indicar se os dados foram enriquecidos
    needs_geocoding: Optional[bool] = False  # Flag para otimizar processamento
    service_radius_km: Optional[float] = 10.0  # Raio de atendimento
    priority: Optional[int] = 0  # Prioridade da revenda
    serves_business: Optional[bool] = True  # Atende empresarial
    serves_residential: Optional[bool] = True  # Atende residencial
    preferred_channel: Optional[str] = 'phone'  # Canal preferencial de contato
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResellerCreate(BaseModel):
    name: str
    cnpj: Optional[str] = None
    address: Optional[str] = None
    neighborhood: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    cep: Optional[str] = None
    phone: Optional[str] = None
    hours: Optional[str] = None
    coordinates: Optional[Coordinates] = None

class ResellerResponse(BaseModel):
    id: str
    name: str
    cnpj: Optional[str] = None
    address: str
    neighborhood: str
    city: str
    state: str
    cep: str
    phone: str
    hours: str
    distance: Optional[float] = None
    coordinates: Optional[Coordinates] = None
    data_enriched: bool = False

class SearchRequest(BaseModel):
    cep: str

class SearchResponse(BaseModel):
    success: bool
    data: List[ResellerResponse]
    total: int
    message: Optional[str] = None

class CNPJRequest(BaseModel):
    cnpj: str

class CNPJResponse(BaseModel):
    success: bool
    data: Optional[CNPJData] = None
    message: Optional[str] = None

class GeocodeRequest(BaseModel):
    address: str
    city: Optional[str] = None
    state: Optional[str] = None

class GeocodeResponse(BaseModel):
    success: bool
    data: Optional[Coordinates] = None
    message: Optional[str] = None

class ImportCSVRequest(BaseModel):
    file_path: Optional[str] = None
    process_all: bool = True

class ImportCSVResponse(BaseModel):
    success: bool
    message: str
    total_imported: int
    total_enriched: int
    errors: List[str] = []