from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class Coordinates(BaseModel):
    lat: float
    lng: float

class Reseller(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    address: str
    neighborhood: str
    city: str
    state: str
    cep: str
    phone: str
    hours: str
    coordinates: Coordinates
    active: bool = True
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