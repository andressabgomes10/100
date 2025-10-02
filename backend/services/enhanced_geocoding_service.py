import httpx
import asyncio
import logging
import googlemaps
import os
from typing import Optional, Dict, Tuple
from urllib.parse import quote

logger = logging.getLogger(__name__)

class EnhancedGeocodingService:
    """Enhanced Geocoding Service using Google Maps API with OpenStreetMap fallback"""
    
    def __init__(self):
        self.google_api_key = os.environ.get('GOOGLE_MAPS_API_KEY')
        self.gmaps = googlemaps.Client(key=self.google_api_key) if self.google_api_key else None
        
        # OpenStreetMap configs (fallback)
        self.osm_base_url = "https://nominatim.openstreetmap.org"
        self.osm_timeout = 10.0
        self.user_agent = "NacionalGas/1.0 (contato@nacionalgas.com.br)"
        
        logger.info(f"🗺️ Geocoding Service initialized - Google Maps: {'✅' if self.gmaps else '❌'}")
    
    async def get_coordinates_from_address(self, address: str, city: str = None, state: str = None) -> Optional[Dict]:
        """
        Busca coordenadas usando Google Maps (preferencial) ou OpenStreetMap (fallback)
        """
        # Tenta primeiro Google Maps
        if self.gmaps:
            result = await self._geocode_with_google_maps(address, city, state)
            if result:
                return result
            logger.warning(f"Google Maps falhou para: {address}")
        
        # Fallback para OpenStreetMap
        logger.info(f"Usando OpenStreetMap fallback para: {address}")
        return await self._geocode_with_osm(address, city, state)
    
    async def _geocode_with_google_maps(self, address: str, city: str = None, state: str = None) -> Optional[Dict]:
        """Geocoding usando Google Maps API"""
        try:
            # Constrói endereço completo
            full_address_parts = [address]
            if city:
                full_address_parts.append(city)
            if state:
                full_address_parts.append(state)
            
            # Adiciona Brasil para melhor precisão
            if "brasil" not in address.lower() and "brazil" not in address.lower():
                full_address_parts.append("Brasil")
            
            full_address = ", ".join(full_address_parts)
            
            logger.info(f"🌍 Google Maps geocoding: {full_address}")
            
            # Executa geocoding usando googlemaps de forma síncrona (não tem versão async)
            geocode_result = await asyncio.get_event_loop().run_in_executor(
                None, self.gmaps.geocode, full_address
            )
            
            if geocode_result and len(geocode_result) > 0:
                result_data = geocode_result[0]
                geometry = result_data.get('geometry', {})
                location = geometry.get('location', {})
                
                if 'lat' in location and 'lng' in location:
                    # Extrai componentes do endereço
                    address_components = self._parse_google_address_components(result_data.get('address_components', []))
                    
                    result = {
                        'lat': float(location['lat']),
                        'lng': float(location['lng']),
                        'formatted_address': result_data.get('formatted_address', ''),
                        'address_details': address_components,
                        'place_id': result_data.get('place_id', ''),
                        'api_source': 'google_maps'
                    }
                    
                    logger.info(f"✅ Google Maps: {result['lat']}, {result['lng']}")
                    return result
                    
        except Exception as e:
            logger.error(f"❌ Erro Google Maps para {address}: {str(e)}")
        
        return None
    
    async def _geocode_with_osm(self, address: str, city: str = None, state: str = None) -> Optional[Dict]:
        """Geocoding usando OpenStreetMap/Nominatim (fallback)"""
        try:
            # Constrói query de busca
            query_parts = [address]
            if city:
                query_parts.append(city)
            if state:
                query_parts.append(state)
            if "brasil" not in address.lower():
                query_parts.append("Brasil")
            
            query = ", ".join(query_parts)
            
            url = f"{self.osm_base_url}/search"
            params = {
                'q': query,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'br',
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': self.user_agent
            }
            
            async with httpx.AsyncClient(timeout=self.osm_timeout) as client:
                logger.info(f"🗺️ OpenStreetMap geocoding: {query}")
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data and len(data) > 0:
                        result_data = data[0]
                        
                        lat = float(result_data.get('lat'))
                        lng = float(result_data.get('lon'))
                        
                        address_details = result_data.get('address', {})
                        
                        result = {
                            'lat': lat,
                            'lng': lng,
                            'formatted_address': result_data.get('display_name', ''),
                            'address_details': {
                                'road': address_details.get('road', ''),
                                'house_number': address_details.get('house_number', ''),
                                'suburb': address_details.get('suburb', ''),
                                'city': address_details.get('city', address_details.get('town', '')),
                                'state': address_details.get('state', ''),
                                'postcode': address_details.get('postcode', ''),
                                'country': address_details.get('country', '')
                            },
                            'api_source': 'openstreetmap'
                        }
                        
                        logger.info(f"✅ OpenStreetMap: {lat}, {lng}")
                        return result
                        
        except Exception as e:
            logger.error(f"❌ Erro OpenStreetMap para {address}: {str(e)}")
        
        return None
    
    def _parse_google_address_components(self, components: list) -> Dict:
        """Parse dos componentes de endereço do Google Maps"""
        parsed = {
            'street_number': '',
            'route': '',
            'neighborhood': '',
            'city': '',
            'state': '',
            'postal_code': '',
            'country': ''
        }
        
        for component in components:
            types = component.get('types', [])
            long_name = component.get('long_name', '')
            
            if 'street_number' in types:
                parsed['street_number'] = long_name
            elif 'route' in types:
                parsed['route'] = long_name
            elif 'sublocality' in types or 'neighborhood' in types:
                parsed['neighborhood'] = long_name
            elif 'locality' in types or 'administrative_area_level_2' in types:
                parsed['city'] = long_name
            elif 'administrative_area_level_1' in types:
                parsed['state'] = component.get('short_name', long_name)
            elif 'postal_code' in types:
                parsed['postal_code'] = long_name
            elif 'country' in types:
                parsed['country'] = long_name
        
        return parsed
    
    async def get_coordinates_from_cep(self, cep: str) -> Optional[Dict]:
        """
        Busca coordenadas a partir de um CEP usando Google Maps ou OpenStreetMap
        """
        try:
            # Normaliza CEP
            cep_clean = cep.replace('-', '').replace('.', '').strip()
            
            if len(cep_clean) != 8 or not cep_clean.isdigit():
                logger.warning(f"CEP inválido: {cep}")
                return None
            
            # Formata CEP
            cep_formatted = f"{cep_clean[:5]}-{cep_clean[5:]}"
            
            # Busca usando CEP como endereço
            return await self.get_coordinates_from_address(f"{cep_formatted}, Brasil")
            
        except Exception as e:
            logger.error(f"Erro na busca por CEP {cep}: {str(e)}")
            return None
    
    async def batch_geocode_addresses(self, addresses: list, batch_size: int = 5, delay: float = 0.1) -> Dict[str, Dict]:
        """
        Geocodifica múltiplos endereços em lote
        Google Maps permite mais requests por segundo que OpenStreetMap
        """
        results = {}
        
        logger.info(f"🚀 Iniciando geocodificação de {len(addresses)} endereços")
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            logger.info(f"Processando lote {i//batch_size + 1}/{(len(addresses) + batch_size - 1)//batch_size}")
            
            # Processa lote atual
            tasks = []
            for addr in batch:
                if isinstance(addr, dict):
                    full_addr = addr.get('endereco_completo', '')
                    city = addr.get('cidade', '')
                    state = addr.get('estado', '')
                    tasks.append(self.get_coordinates_from_address(full_addr, city, state))
                else:
                    tasks.append(self.get_coordinates_from_address(addr))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Processa resultados
            for addr, result in zip(batch, batch_results):
                addr_key = addr if isinstance(addr, str) else addr.get('endereco_completo', str(addr))
                
                if isinstance(result, Exception):
                    logger.error(f"Erro na geocodificação {addr_key}: {result}")
                    results[addr_key] = None
                else:
                    results[addr_key] = result
            
            # Pausa entre lotes (menor para Google Maps)
            if i + batch_size < len(addresses):
                await asyncio.sleep(delay)
        
        successful = len([r for r in results.values() if r is not None])
        google_maps_count = len([r for r in results.values() if r and r.get('api_source') == 'google_maps'])
        osm_count = len([r for r in results.values() if r and r.get('api_source') == 'openstreetmap'])
        
        logger.info(f"✅ Geocodificação concluída: {successful}/{len(addresses)} sucessos")
        logger.info(f"📊 Google Maps: {google_maps_count}, OpenStreetMap: {osm_count}")
        
        return results
    
    @staticmethod
    def calculate_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calcula distância entre duas coordenadas usando fórmula Haversine
        """
        import math
        
        lat1, lng1 = coord1
        lat2, lng2 = coord2
        
        # Converte para radianos
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Fórmula Haversine
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Raio da Terra em km
        r = 6371
        
        return c * r

# Instância global para ser usada pelos serviços
enhanced_geocoding_service = EnhancedGeocodingService()