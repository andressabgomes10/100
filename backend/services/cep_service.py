import httpx
import re
from typing import Optional, Dict
from services.enhanced_geocoding_service import enhanced_geocoding_service

class CEPService:
    @staticmethod
    def validate_cep(cep: str) -> bool:
        """Valida formato do CEP brasileiro"""
        if not cep:
            return False
        
        # Remove tudo que não é número
        clean_cep = re.sub(r'\D', '', cep)
        
        # CEP deve ter exatamente 8 dígitos
        return len(clean_cep) == 8 and clean_cep.isdigit()
    
    @staticmethod
    def format_cep(cep: str) -> str:
        """Formata CEP para o padrão 00000-000"""
        clean_cep = re.sub(r'\D', '', cep)
        if len(clean_cep) == 8:
            return f"{clean_cep[:5]}-{clean_cep[5:]}"
        return cep
    
    @staticmethod
    async def get_coordinates_from_cep(cep: str) -> Optional[Dict[str, float]]:
        """
        Obtém coordenadas a partir do CEP usando Google Maps
        """
        try:
            # Limpa e valida CEP
            clean_cep = re.sub(r'\D', '', cep)
            if not CEPService.validate_cep(clean_cep):
                return None
            
            # Usa o enhanced geocoding service (Google Maps + fallback)
            coord_data = await enhanced_geocoding_service.get_coordinates_from_cep(cep)
            
            if coord_data:
                return {
                    'lat': coord_data['lat'],
                    'lng': coord_data['lng']
                }
            
            return None
            
        except Exception as e:
            return None
                if viacep_data.get('localidade'):
                    address_parts.append(viacep_data['localidade'])
                if viacep_data.get('uf'):
                    address_parts.append(viacep_data['uf'])
                
                if not address_parts:
                    return None
                
                address = ", ".join(address_parts) + ", Brasil"
                
                # Geocoding via Nominatim (OpenStreetMap)
                nominatim_response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params={
                        'q': address,
                        'format': 'json',
                        'limit': 1,
                        'countrycodes': 'br'
                    },
                    headers={'User-Agent': 'Nacional-Gas-Locator/1.0'},
                    timeout=5.0
                )
                
                if nominatim_response.status_code != 200:
                    return None
                
                nominatim_data = nominatim_response.json()
                
                if not nominatim_data:
                    return None
                
                location = nominatim_data[0]
                
                return {
                    'lat': float(location['lat']),
                    'lng': float(location['lon'])
                }
                
        except Exception as e:
            print(f"Erro ao buscar coordenadas para CEP {cep}: {str(e)}")
            return None
    
    @staticmethod
    def get_fallback_coordinates(cep: str) -> Optional[Dict[str, float]]:
        """
        Coordenadas aproximadas baseadas nos primeiros dígitos do CEP (fallback)
        """
        try:
            clean_cep = re.sub(r'\D', '', cep)
            if len(clean_cep) < 5:
                return None
            
            # Mapeamento aproximado dos primeiros dígitos de CEP para regiões
            cep_region = clean_cep[:2]
            
            # Coordenadas aproximadas por região (centro das principais cidades)
            regions = {
                '01': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Centro
                '02': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Zona Norte
                '03': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Zona Leste
                '04': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Zona Sul
                '05': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Zona Oeste
                '08': {'lat': -23.5505, 'lng': -46.6333},  # São Paulo - Região Metropolitana
                '20': {'lat': -22.9068, 'lng': -43.1729},  # Rio de Janeiro - Centro
                '21': {'lat': -22.9068, 'lng': -43.1729},  # Rio de Janeiro - Zona Norte
                '22': {'lat': -22.9068, 'lng': -43.1729},  # Rio de Janeiro - Zona Sul
                '30': {'lat': -19.9191, 'lng': -43.9378},  # Belo Horizonte
                '40': {'lat': -12.9714, 'lng': -38.5014},  # Salvador
                '50': {'lat': -8.0476, 'lng': -34.8770},   # Recife
                '60': {'lat': -3.7172, 'lng': -38.5434},   # Fortaleza
                '70': {'lat': -15.7942, 'lng': -47.8825},  # Brasília
                '80': {'lat': -25.4244, 'lng': -49.2654},  # Curitiba
                '90': {'lat': -30.0346, 'lng': -51.2177},  # Porto Alegre
            }
            
            return regions.get(cep_region)
            
        except Exception:
            return None