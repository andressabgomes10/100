from typing import List, Optional, Dict
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.reseller import Reseller, ResellerResponse, ResellerCreate
from services.cep_service import CEPService
from services.distance_service import DistanceService
import logging

logger = logging.getLogger(__name__)

class ResellerService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resellers
    
    async def create_reseller(self, reseller_data: ResellerCreate) -> Reseller:
        """Cria uma nova revenda"""
        reseller = Reseller(**reseller_data.dict())
        
        await self.collection.insert_one(reseller.dict())
        return reseller
    
    async def get_all_resellers(self) -> List[Reseller]:
        """Obtém todas as revendas ativas que possuem coordenadas"""
        cursor = self.collection.find({
            "active": True,
            "coordinates": {"$exists": True, "$ne": None}
        })
        resellers = []
        
        async for doc in cursor:
            resellers.append(Reseller(**doc))
        
        return resellers
    
    async def search_resellers_by_cep(self, cep: str, max_distance: float = 50.0, limit: int = 10) -> List[ResellerResponse]:
        """
        Busca revendas próximas a um CEP
        
        Args:
            cep: CEP para busca
            max_distance: Distância máxima em km (padrão: 50km)
            limit: Número máximo de resultados (padrão: 10)
        """
        try:
            # Valida CEP
            if not CEPService.validate_cep(cep):
                logger.warning(f"CEP inválido: {cep}")
                return []
            
            # Obtém coordenadas do CEP
            cep_coordinates = await CEPService.get_coordinates_from_cep(cep)
            
            # Se não conseguir coordenadas pela API, usa fallback
            if not cep_coordinates:
                cep_coordinates = CEPService.get_fallback_coordinates(cep)
            
            if not cep_coordinates:
                logger.warning(f"Não foi possível obter coordenadas para o CEP: {cep}")
                return []
            
            cep_coords = (cep_coordinates['lat'], cep_coordinates['lng'])
            
            # Busca todas as revendas ativas
            resellers = await self.get_all_resellers()
            
            if not resellers:
                logger.info("Nenhuma revenda encontrada no banco de dados")
                return []
            
            # Calcula distâncias e filtra
            resellers_with_distance = []
            
            for reseller in resellers:
                try:
                    # Verifica se a revenda tem coordenadas
                    if not reseller.coordinates or not hasattr(reseller.coordinates, 'lat') or not hasattr(reseller.coordinates, 'lng'):
                        logger.warning(f"Revenda {reseller.name} não tem coordenadas válidas. Pulando...")
                        continue
                    
                    reseller_coords = (reseller.coordinates.lat, reseller.coordinates.lng)
                    distance = DistanceService.calculate_distance_from_cep(cep_coords, reseller_coords)
                    
                    # Filtra por distância máxima
                    if distance <= max_distance:
                        reseller_response = ResellerResponse(
                            id=reseller.id,
                            name=reseller.name,
                            address=reseller.address,
                            neighborhood=reseller.neighborhood,
                            city=reseller.city,
                            state=reseller.state,
                            cep=reseller.cep,
                            phone=reseller.phone,
                            hours=reseller.hours,
                            distance=distance
                        )
                        resellers_with_distance.append(reseller_response)
                        
                except Exception as e:
                    logger.error(f"Erro ao calcular distância para revenda {reseller.name}: {str(e)}")
                    continue
            
            # Ordena por distância (mais próximo primeiro) e limita resultados
            resellers_with_distance.sort(key=lambda x: x.distance)
            
            return resellers_with_distance[:limit]
            
        except Exception as e:
            logger.error(f"Erro na busca por revendas: {str(e)}")
            return []
    
    async def populate_initial_data(self):
        """Popula banco com dados iniciais se estiver vazio"""
        try:
            count = await self.collection.count_documents({})
            if count > 0:
                logger.info(f"Banco já possui {count} revendas. Pulando população inicial.")
                return
            
            logger.info("Populando banco com dados iniciais...")
            
            initial_resellers = [
                {
                    "name": "Revenda Centro",
                    "address": "Rua das Flores, 123",
                    "neighborhood": "Centro",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01234-567",
                    "phone": "(11) 3333-4444",
                    "hours": "Segunda a Sábado: 8h às 18h",
                    "coordinates": {"lat": -23.5505, "lng": -46.6333}
                },
                {
                    "name": "Gás Express Vila Madalena",
                    "address": "Av. Paulista, 456",
                    "neighborhood": "Vila Madalena",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01235-890",
                    "phone": "(11) 2222-5555",
                    "hours": "Segunda a Sexta: 7h às 19h, Sábado: 8h às 16h",
                    "coordinates": {"lat": -23.5574, "lng": -46.6688}
                },
                {
                    "name": "Nacional Gás Ipiranga",
                    "address": "Rua do Comércio, 789",
                    "neighborhood": "Ipiranga",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01236-123",
                    "phone": "(11) 4444-6666",
                    "hours": "Segunda a Sábado: 8h às 17h",
                    "coordinates": {"lat": -23.5928, "lng": -46.6070}
                },
                {
                    "name": "Gás & Cia Moema",
                    "address": "Av. Ibirapuera, 234",
                    "neighborhood": "Moema",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01237-456",
                    "phone": "(11) 5555-7777",
                    "hours": "Segunda a Sexta: 8h às 18h, Sábado: 8h às 14h",
                    "coordinates": {"lat": -23.5986, "lng": -46.6731}
                },
                {
                    "name": "Distribuidora Jardins",
                    "address": "Rua Augusta, 567",
                    "neighborhood": "Jardins",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01238-789",
                    "phone": "(11) 6666-8888",
                    "hours": "Segunda a Sábado: 7h às 18h",
                    "coordinates": {"lat": -23.5613, "lng": -46.6565}
                },
                {
                    "name": "Super Gás Liberdade",
                    "address": "Rua da Liberdade, 890",
                    "neighborhood": "Liberdade",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01239-012",
                    "phone": "(11) 7777-9999",
                    "hours": "Segunda a Domingo: 8h às 17h",
                    "coordinates": {"lat": -23.5588, "lng": -46.6344}
                },
                {
                    "name": "Gás Point Pinheiros",
                    "address": "Av. Faria Lima, 345",
                    "neighborhood": "Pinheiros",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01240-345",
                    "phone": "(11) 8888-0000",
                    "hours": "Segunda a Sexta: 8h às 18h, Sábado: 8h às 15h",
                    "coordinates": {"lat": -23.5781, "lng": -46.6875}
                },
                {
                    "name": "Nacional Gás Santana",
                    "address": "Rua Voluntários da Pátria, 678",
                    "neighborhood": "Santana",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01241-678",
                    "phone": "(11) 9999-1111",
                    "hours": "Segunda a Sábado: 8h às 18h",
                    "coordinates": {"lat": -23.5074, "lng": -46.6250}
                },
                {
                    "name": "Gás Delivery Brooklin",
                    "address": "Av. Santo Amaro, 901",
                    "neighborhood": "Brooklin",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01242-901",
                    "phone": "(11) 1111-2222",
                    "hours": "Segunda a Sexta: 7h às 19h, Sábado: 8h às 16h",
                    "coordinates": {"lat": -23.6105, "lng": -46.7026}
                },
                {
                    "name": "Revenda Vila Olímpia",
                    "address": "Rua Funchal, 234",
                    "neighborhood": "Vila Olímpia",
                    "city": "São Paulo",
                    "state": "SP",
                    "cep": "01243-234",
                    "phone": "(11) 2222-3333",
                    "hours": "Segunda a Sábado: 8h às 17h",
                    "coordinates": {"lat": -23.5955, "lng": -46.6860}
                }
            ]
            
            for reseller_data in initial_resellers:
                reseller_create = ResellerCreate(**reseller_data)
                await self.create_reseller(reseller_create)
            
            logger.info(f"✅ {len(initial_resellers)} revendas criadas com sucesso!")
            
        except Exception as e:
            logger.error(f"Erro ao popular dados iniciais: {str(e)}")
            raise