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
    hours: str
    coordinates: Optional[Coordinates] = None
    geocoding_source: Optional[str] = None  # 'nominatim', 'manual', etc
    active: bool = True
    data_enriched: bool = False  # Flag para indicar se os dados foram enriquecidos
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ResellerCreate(BaseModel):
    name: str
    address: str
    neighborhood: str
    city: str
    state: str
    cep: str
    phone: str
    hours: str
    coordinates: Coordinates

class ResellerResponse(BaseModel):
    id: str
    name: str
    address: str
    neighborhood: str
    city: str
    state: str
    cep: str
    phone: str
    hours: str
    distance: Optional[float] = None

class SearchRequest(BaseModel):
    cep: str

class SearchResponse(BaseModel):
    success: bool
    data: List[ResellerResponse]
    total: int
    message: Optional[str] = None