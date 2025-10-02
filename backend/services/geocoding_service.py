import httpx
import asyncio
import logging
from typing import Optional, Dict, Tuple
from urllib.parse import quote

logger = logging.getLogger(__name__)

class GeocodingService:
    """Service for address geocoding using OpenStreetMap/Nominatim"""
    
    BASE_URL = "https://nominatim.openstreetmap.org"
    TIMEOUT = 10.0
    USER_AGENT = "NacionalGas/1.0 (contato@nacionalgas.com.br)"
    
    @staticmethod
    async def get_coordinates_from_address(address: str, city: str = None, state: str = None) -> Optional[Dict]:
        """
        Busca coordenadas a partir de um endereço usando OpenStreetMap/Nominatim
        
        Args:
            address: Endereço completo
            city: Cidade (opcional, para melhorar precisão)  
            state: Estado (opcional, para melhorar precisão)
            
        Returns:
            Dict com lat, lng e informações do endereço ou None se não encontrar
        """
        try:
            # Constrói query de busca
            query_parts = [address]
            
            if city:
                query_parts.append(city)
            
            if state:
                query_parts.append(state)
            
            # Adiciona Brasil para melhorar precisão
            if "brasil" not in address.lower() and "brazil" not in address.lower():
                query_parts.append("Brasil")
            
            query = ", ".join(query_parts)
            query_encoded = quote(query)
            
            url = f"{GeocodingService.BASE_URL}/search"
            
            params = {
                'q': query,
                'format': 'json',
                'limit': 1,
                'countrycodes': 'br',  # Limita ao Brasil
                'addressdetails': 1
            }
            
            headers = {
                'User-Agent': GeocodingService.USER_AGENT
            }
            
            async with httpx.AsyncClient(timeout=GeocodingService.TIMEOUT) as client:
                logger.info(f"Buscando coordenadas para: {query}")
                response = await client.get(url, params=params, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    if data and len(data) > 0:
                        result_data = data[0]
                        
                        # Extrai coordenadas
                        lat = float(result_data.get('lat'))
                        lng = float(result_data.get('lon'))
                        
                        # Extrai detalhes do endereço
                        address_details = result_data.get('address', {})
                        
                        result = {
                            'lat': lat,
                            'lng': lng,
                            'display_name': result_data.get('display_name', ''),
                            'address_details': {
                                'road': address_details.get('road', ''),
                                'house_number': address_details.get('house_number', ''),
                                'suburb': address_details.get('suburb', ''),
                                'city': address_details.get('city', address_details.get('town', address_details.get('village', ''))),
                                'state': address_details.get('state', ''),
                                'postcode': address_details.get('postcode', ''),
                                'country': address_details.get('country', '')
                            },
                            'importance': result_data.get('importance', 0),
                            'api_source': 'nominatim'
                        }
                        
                        logger.info(f"✅ Coordenadas encontradas: {lat}, {lng}")
                        return result
                    else:
                        logger.warning(f"Nenhuma coordenada encontrada para: {query}")
                        return None
                        
                elif response.status_code == 429:
                    logger.warning(f"Rate limit excedido para endereço: {query}")
                    await asyncio.sleep(1)
                    return None
                else:
                    logger.error(f"Erro na geocodificação: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout na geocodificação: {address}")
            return None
        except Exception as e:
            logger.error(f"Erro na geocodificação {address}: {str(e)}")
            return None
    
    @staticmethod
    async def get_coordinates_from_cep(cep: str) -> Optional[Dict]:
        """
        Busca coordenadas a partir de um CEP
        
        Args:
            cep: CEP no formato 00000-000 ou 00000000
            
        Returns:
            Dict com coordenadas e informações do endereço
        """
        try:
            # Normaliza CEP
            cep_clean = cep.replace('-', '').replace('.', '').strip()
            
            if len(cep_clean) != 8 or not cep_clean.isdigit():
                logger.warning(f"CEP inválido: {cep}")
                return None
            
            # Formata CEP
            cep_formatted = f"{cep_clean[:5]}-{cep_clean[5:]}"
            
            # Busca pelo CEP
            query = f"{cep_formatted}, Brasil"
            
            return await GeocodingService.get_coordinates_from_address(query)
            
        except Exception as e:
            logger.error(f"Erro na busca por CEP {cep}: {str(e)}")
            return None
    
    @staticmethod
    async def batch_geocode_addresses(addresses: list, batch_size: int = 3, delay: float = 1.0) -> Dict[str, Dict]:
        """
        Geocodifica múltiplos endereços em lote com controle de rate limit
        OpenStreetMap tem rate limit mais restritivo (1 req/seg)
        
        Args:
            addresses: Lista de endereços
            batch_size: Número de requisições simultâneas (recomendado: 3)
            delay: Delay entre lotes (segundos, recomendado: 1.0)
            
        Returns:
            Dict com endereço como chave e coordenadas como valor
        """
        results = {}
        
        logger.info(f"Iniciando geocodificação em lote de {len(addresses)} endereços")
        
        for i in range(0, len(addresses), batch_size):
            batch = addresses[i:i + batch_size]
            
            logger.info(f"Processando lote {i//batch_size + 1}/{(len(addresses) + batch_size - 1)//batch_size}")
            
            # Processa lote atual
            tasks = []
            for addr in batch:
                if isinstance(addr, dict):
                    # Se endereço é um dict com componentes separados
                    full_addr = addr.get('endereco_completo', '')
                    city = addr.get('cidade', '')
                    state = addr.get('estado', '')
                    tasks.append(GeocodingService.get_coordinates_from_address(full_addr, city, state))
                else:
                    # Se endereço é string
                    tasks.append(GeocodingService.get_coordinates_from_address(addr))
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Processa resultados
            for addr, result in zip(batch, batch_results):
                addr_key = addr if isinstance(addr, str) else addr.get('endereco_completo', str(addr))
                
                if isinstance(result, Exception):
                    logger.error(f"Erro na geocodificação {addr_key}: {result}")
                    results[addr_key] = None
                else:
                    results[addr_key] = result
            
            # Aguarda antes do próximo lote (respeitando rate limit)
            if i + batch_size < len(addresses):
                await asyncio.sleep(delay)
        
        successful = len([r for r in results.values() if r is not None])
        logger.info(f"✅ Geocodificação concluída: {successful}/{len(addresses)} endereços processados com sucesso")
        
        return results
    
    @staticmethod
    def calculate_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calcula distância entre duas coordenadas usando fórmula Haversine
        
        Args:
            coord1: (lat, lng) do ponto 1
            coord2: (lat, lng) do ponto 2
            
        Returns:
            Distância em quilômetros
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