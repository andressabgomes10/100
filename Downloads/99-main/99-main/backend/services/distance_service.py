import math
from typing import Tuple

class DistanceService:
    @staticmethod
    def haversine_distance(coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calcula a distância entre duas coordenadas usando a fórmula de Haversine.
        Retorna a distância em quilômetros.
        
        Args:
            coord1: Tupla (latitude, longitude) do primeiro ponto
            coord2: Tupla (latitude, longitude) do segundo ponto
            
        Returns:
            Distância em quilômetros
        """
        try:
            # Raio da Terra em quilômetros
            R = 6371.0
            
            lat1, lon1 = coord1
            lat2, lon2 = coord2
            
            # Converter graus para radianos
            lat1_rad = math.radians(lat1)
            lon1_rad = math.radians(lon1)
            lat2_rad = math.radians(lat2)
            lon2_rad = math.radians(lon2)
            
            # Diferenças
            dlat = lat2_rad - lat1_rad
            dlon = lon2_rad - lon1_rad
            
            # Fórmula de Haversine
            a = (math.sin(dlat / 2) ** 2 + 
                 math.cos(lat1_rad) * math.cos(lat2_rad) * 
                 math.sin(dlon / 2) ** 2)
            
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            
            # Distância em quilômetros
            distance = R * c
            
            return round(distance, 1)
            
        except Exception as e:
            print(f"Erro no cálculo de distância: {str(e)}")
            return float('inf')  # Retorna infinito em caso de erro
    
    @staticmethod
    def calculate_distance_from_cep(cep_coords: Tuple[float, float], 
                                   reseller_coords: Tuple[float, float]) -> float:
        """
        Calcula distância entre CEP e revenda
        """
        return DistanceService.haversine_distance(cep_coords, reseller_coords)