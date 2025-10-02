import csv
import asyncio
import logging
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.reseller import Reseller, ResellerCreate, CNPJData, Coordinates
from services.cnpj_service import CNPJService
from services.enhanced_geocoding_service import enhanced_geocoding_service
from pathlib import Path
import pandas as pd

logger = logging.getLogger(__name__)

class OptimizedDataService:
    """Optimized service for processing normalized reseller data efficiently"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resellers
    
    async def import_normalized_csv(self, file_path: str = "/app/backend/data/revendas_normalizado.csv") -> Dict:
        """
        Importa arquivo CSV normalizado com estrutura otimizada
        """
        try:
            if not Path(file_path).exists():
                raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
            
            logger.info(f"🚀 Iniciando importação otimizada do CSV normalizado: {file_path}")
            
            # Lê CSV com pandas para melhor performance
            df = pd.read_csv(file_path)
            
            # Remove registros duplicados por CNPJ
            df = df.drop_duplicates(subset=['cnpj'], keep='first')
            
            # Converte para lista de dicts
            records = df.to_dict('records')
            
            logger.info(f"📊 Processando {len(records)} revendas normalizadas")
            
            # Remove duplicatas existentes por CNPJ
            cnpjs_to_remove = [str(record['cnpj']) for record in records if record['cnpj']]
            if cnpjs_to_remove:
                result = await self.collection.delete_many({
                    "cnpj": {"$in": cnpjs_to_remove}
                })
                logger.info(f"🗑️ Removidas {result.deleted_count} revendas duplicadas")
            
            # Prepara documentos otimizados
            optimized_resellers = []
            
            for record in records:
                try:
                    # Função auxiliar para limpar dados
                    def clean_value(value):
                        if pd.isna(value) or str(value).lower() in ['nan', 'null', 'none', '']:
                            return ''
                        return str(value).strip()
                    
                    def clean_float(value, default=None):
                        try:
                            if pd.isna(value) or str(value).lower() in ['nan', 'null', 'none', '']:
                                return default
                            return float(value)
                        except (ValueError, TypeError):
                            return default
                    
                    def clean_bool(value, default=True):
                        if pd.isna(value):
                            return default
                        return bool(value)
                    
                    # Normaliza CNPJ
                    cnpj = CNPJService.normalize_cnpj(str(record.get('cnpj', '')))
                    if not cnpj or len(cnpj) != 14:
                        continue
                    
                    # Limpa todos os dados
                    address = clean_value(record.get('endereco'))
                    city = clean_value(record.get('cidade'))
                    state = clean_value(record.get('uf'))
                    
                    # Cria revenda otimizada
                    reseller_data = {
                        'name': clean_value(record.get('razao_social')),
                        'cnpj': cnpj,
                        'address': address,
                        'neighborhood': clean_value(record.get('bairro')),
                        'city': city,
                        'state': state,
                        'cep': clean_value(record.get('cep')),
                        'phone': clean_value(record.get('telefone')),
                        'whatsapp': clean_value(record.get('whatsapp')),
                        'hours': 'Segunda a Sábado: 8h às 18h',  # Default
                        'active': clean_bool(record.get('ativo'), True),
                        'data_enriched': False,  # Inicialmente não enriquecido
                        'service_radius_km': clean_float(record.get('service_radius_km'), 10.0),
                        'priority': int(clean_float(record.get('prioridade'), 0)),
                        'serves_business': clean_bool(record.get('atende_empresarial'), True),
                        'serves_residential': clean_bool(record.get('atende_residencial'), True),
                        'preferred_channel': clean_value(record.get('canal_preferencial')) or 'phone'
                    }
                    
                    # Adiciona coordenadas se existirem e forem válidas
                    lat = clean_float(record.get('latitude'))
                    lng = clean_float(record.get('longitude'))
                    
                    if lat is not None and lng is not None and not (pd.isna(lat) or pd.isna(lng)):
                        reseller_data['coordinates'] = {'lat': lat, 'lng': lng}
                        reseller_data['geocoding_source'] = 'normalized_data'
                        reseller_data['data_enriched'] = True
                    else:
                        reseller_data['coordinates'] = None
                    
                    # Se tem endereço válido mas não tem coordenadas, marca para geocoding
                    if address and city and not reseller_data['coordinates']:
                        reseller_data['needs_geocoding'] = True
                    
                    reseller = Reseller(**reseller_data)
                    optimized_resellers.append(reseller.dict())
                    
                except Exception as e:
                    logger.error(f"Erro ao processar registro CNPJ {record.get('cnpj', 'unknown')}: {str(e)}")
                    continue
            
            # Inserção em lote para melhor performance
            if optimized_resellers:
                batch_size = 1000
                total_inserted = 0
                
                for i in range(0, len(optimized_resellers), batch_size):
                    batch = optimized_resellers[i:i + batch_size]
                    result = await self.collection.insert_many(batch)
                    total_inserted += len(result.inserted_ids)
                    logger.info(f"📥 Lote {i//batch_size + 1}: {len(result.inserted_ids)} revendas inseridas")
                
                logger.info(f"✅ {total_inserted} revendas importadas com sucesso!")
            
            return {
                'success': True,
                'total_imported': len(optimized_resellers),
                'message': f'{len(optimized_resellers)} revendas otimizadas importadas com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro na importação otimizada: {str(e)}")
            return {
                'success': False,
                'total_imported': 0,
                'message': f'Erro na importação: {str(e)}'
            }
    
    async def smart_enrich_all_data(self, batch_size: int = 20) -> Dict:
        """
        Enriquecimento inteligente - prioriza revendas que já têm dados parciais
        """
        try:
            logger.info("🧠 Iniciando enriquecimento inteligente de dados")
            
            # Busca revendas que precisam de enriquecimento, priorizando as que já têm dados
            pipeline = [
                {
                    "$match": {
                        "$and": [
                            {"data_enriched": {"$ne": True}},
                            {"cnpj": {"$exists": True, "$ne": None, "$ne": ""}},
                            {"active": {"$ne": False}}
                        ]
                    }
                },
                {
                    "$addFields": {
                        "priority_score": {
                            "$add": [
                                {"$cond": [{"$ne": ["$address", ""]}, 10, 0]},
                                {"$cond": [{"$ne": ["$city", ""]}, 5, 0]},
                                {"$cond": [{"$ne": ["$phone", ""]}, 3, 0]},
                                {"$cond": [{"$exists": "$coordinates"}, -20, 0]},  # Menos prioridade se já tem coords
                                {"$multiply": ["$priority", 2]}  # Duplica prioridade do negócio
                            ]
                        }
                    }
                },
                {"$sort": {"priority_score": -1}},
                {"$limit": 1000}  # Processa até 1000 por vez
            ]
            
            cursor = self.collection.aggregate(pipeline)
            resellers = await cursor.to_list(None)
            
            if not resellers:
                return {
                    'success': True,
                    'total_processed': 0,
                    'total_enriched': 0,
                    'message': 'Nenhuma revenda para enriquecer'
                }
            
            logger.info(f"🎯 Encontradas {len(resellers)} revendas priorizadas para enriquecimento")
            
            total_enriched = 0
            
            # Processa em lotes menores para melhor controle
            for i in range(0, len(resellers), batch_size):
                batch = resellers[i:i + batch_size]
                
                logger.info(f"⚡ Processando lote {i//batch_size + 1}/{(len(resellers) + batch_size - 1)//batch_size}")
                
                # Enriquece lote atual
                enriched_count = await self._smart_enrich_batch(batch)
                total_enriched += enriched_count
                
                # Aguarda menos tempo entre lotes para maior eficiência
                await asyncio.sleep(0.5)
            
            return {
                'success': True,
                'total_processed': len(resellers),
                'total_enriched': total_enriched,
                'message': f'{total_enriched} revendas enriquecidas com dados otimizados'
            }
            
        except Exception as e:
            logger.error(f"Erro no enriquecimento inteligente: {str(e)}")
            return {
                'success': False,
                'total_processed': 0,
                'total_enriched': 0,
                'message': f'Erro no enriquecimento: {str(e)}'
            }
    
    async def _smart_enrich_batch(self, batch: List[Dict]) -> int:
        """Enriquece um lote de revendas de forma inteligente"""
        enriched_count = 0
        
        # Agrupa CNPJs para requisições em lote
        cnpjs_to_process = []
        resellers_by_cnpj = {}
        
        for reseller_doc in batch:
            cnpj = reseller_doc.get('cnpj')
            if cnpj:
                cnpjs_to_process.append(cnpj)
                resellers_by_cnpj[cnpj] = reseller_doc
        
        if not cnpjs_to_process:
            return 0
        
        # Processa CNPJs em lote (mais eficiente)
        logger.info(f"📞 Buscando dados de {len(cnpjs_to_process)} CNPJs em lote")
        cnpj_results = await CNPJService.batch_get_companies_data(cnpjs_to_process, batch_size=3, delay=0.3)
        
        # Processa geocoding para endereços válidos
        addresses_to_geocode = []
        geocode_mapping = {}
        
        for cnpj, cnpj_data in cnpj_results.items():
            if cnpj_data and cnpj_data.get('endereco_completo'):
                addresses_to_geocode.append({
                    'endereco_completo': cnpj_data['endereco_completo'],
                    'cidade': cnpj_data.get('cidade', ''),
                    'estado': cnpj_data.get('estado', '')
                })
                geocode_mapping[cnpj_data['endereco_completo']] = cnpj
        
        # Geocoding em lote (mais eficiente)
        geocode_results = {}
        if addresses_to_geocode:
            logger.info(f"🗺️ Buscando coordenadas de {len(addresses_to_geocode)} endereços")
            geocode_results = await enhanced_geocoding_service.batch_geocode_addresses(addresses_to_geocode, batch_size=5, delay=0.2)
        
        # Atualiza documentos no banco
        for cnpj, cnpj_data in cnpj_results.items():
            if not cnpj_data:
                continue
                
            try:
                reseller_doc = resellers_by_cnpj.get(cnpj)
                if not reseller_doc:
                    continue
                
                # Monta dados de atualização
                update_data = {
                    'name': cnpj_data.get('razao_social', reseller_doc.get('name', '')),
                    'address': cnpj_data.get('logradouro', '') + (f", {cnpj_data.get('numero', '')}" if cnpj_data.get('numero') else ''),
                    'neighborhood': cnpj_data.get('bairro', ''),
                    'city': cnpj_data.get('cidade', ''),
                    'state': cnpj_data.get('estado', ''),
                    'cep': cnpj_data.get('cep', ''),
                    'phone': cnpj_data.get('telefone', ''),
                    'cnpj_data': {
                        'cnpj': cnpj_data['cnpj'],
                        'razao_social': cnpj_data.get('razao_social'),
                        'nome_fantasia': cnpj_data.get('nome_fantasia'),
                        'atividade_principal': cnpj_data.get('atividade_principal'),
                        'situacao': cnpj_data.get('situacao'),
                        'telefone': cnpj_data.get('telefone'),
                        'email': cnpj_data.get('email')
                    },
                    'data_enriched': True
                }
                
                # Adiciona coordenadas se encontradas
                endereco_completo = cnpj_data.get('endereco_completo', '')
                if endereco_completo in geocode_results and geocode_results[endereco_completo]:
                    coord_data = geocode_results[endereco_completo]
                    update_data['coordinates'] = {
                        'lat': coord_data['lat'],
                        'lng': coord_data['lng']
                    }
                    update_data['geocoding_source'] = coord_data['api_source']
                
                # Atualiza documento
                await self.collection.update_one(
                    {"_id": reseller_doc["_id"]},
                    {"$set": update_data}
                )
                
                enriched_count += 1
                
            except Exception as e:
                logger.error(f"Erro ao enriquecer revenda {cnpj}: {str(e)}")
                continue
        
        logger.info(f"✅ Lote processado: {enriched_count} revendas enriquecidas")
        return enriched_count
    
    async def get_optimization_stats(self) -> Dict:
        """Retorna estatísticas otimizadas do sistema"""
        try:
            pipeline = [
                {
                    "$group": {
                        "_id": None,
                        "total_resellers": {"$sum": 1},
                        "active_resellers": {"$sum": {"$cond": ["$active", 1, 0]}},
                        "enriched_resellers": {"$sum": {"$cond": ["$data_enriched", 1, 0]}},
                        "with_coordinates": {"$sum": {"$cond": [{"$ne": ["$coordinates", None]}, 1, 0]}},
                        "with_cnpj_data": {"$sum": {"$cond": [{"$ne": ["$cnpj_data", None]}, 1, 0]}},
                        "with_phone": {"$sum": {"$cond": [{"$ne": ["$phone", ""]}, 1, 0]}},
                        "with_whatsapp": {"$sum": {"$cond": [{"$ne": ["$whatsapp", ""]}, 1, 0]}},
                        "google_maps_coords": {"$sum": {"$cond": [{"$eq": ["$geocoding_source", "google_maps"]}, 1, 0]}},
                        "high_priority": {"$sum": {"$cond": [{"$gt": ["$priority", 5]}, 1, 0]}}
                    }
                }
            ]
            
            result = await self.collection.aggregate(pipeline).to_list(1)
            if not result:
                return {'error': 'Nenhum dado encontrado'}
            
            stats = result[0]
            stats.pop('_id', None)
            
            # Calcula porcentagens
            total = stats['total_resellers']
            if total > 0:
                stats['enrichment_percentage'] = round((stats['enriched_resellers'] / total * 100), 2)
                stats['coordinates_percentage'] = round((stats['with_coordinates'] / total * 100), 2)
                stats['google_maps_percentage'] = round((stats['google_maps_coords'] / total * 100), 2)
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas otimizadas: {str(e)}")
            return {'error': str(e)}