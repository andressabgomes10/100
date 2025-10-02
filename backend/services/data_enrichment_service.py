import csv
import asyncio
import logging
from typing import List, Dict, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from models.reseller import Reseller, ResellerCreate, CNPJData, Coordinates
from services.cnpj_service import CNPJService
from services.enhanced_geocoding_service import enhanced_geocoding_service
from pathlib import Path

logger = logging.getLogger(__name__)

class DataEnrichmentService:
    """Service for processing CSV and enriching reseller data"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.resellers
    
    async def import_csv_file(self, file_path: str) -> Dict:
        """
        Importa arquivo CSV com revendas
        
        Args:
            file_path: Caminho para o arquivo CSV
            
        Returns:
            Dict com estatísticas da importação
        """
        try:
            if not Path(file_path).exists():
                raise FileNotFoundError(f"Arquivo não encontrado: {file_path}")
            
            logger.info(f"Iniciando importação do CSV: {file_path}")
            
            resellers = []
            errors = []
            
            with open(file_path, 'r', encoding='utf-8') as file:
                # Detecta delimitador
                sample = file.read(1024)
                file.seek(0)
                
                delimiter = ';' if ';' in sample else ','
                
                reader = csv.DictReader(file, delimiter=delimiter)
                
                for row_num, row in enumerate(reader, 1):
                    try:
                        # Extrai dados básicos
                        razao_social = row.get('razao_social', '').strip()
                        cnpj = row.get('cnpj', '').strip()
                        
                        if not razao_social or not cnpj:
                            errors.append(f"Linha {row_num}: Razão social ou CNPJ em branco")
                            continue
                        
                        # Cria reseller básico
                        reseller = Reseller(
                            name=razao_social,
                            cnpj=CNPJService.normalize_cnpj(cnpj),
                            address="",
                            neighborhood="",
                            city="",
                            state="",
                            cep="",
                            phone="",
                            hours="",
                            data_enriched=False
                        )
                        
                        resellers.append(reseller)
                        
                    except Exception as e:
                        errors.append(f"Linha {row_num}: {str(e)}")
                        continue
            
            # Salva no banco
            if resellers:
                # Remove duplicatas por CNPJ
                await self._remove_duplicates_by_cnpj([r.cnpj for r in resellers if r.cnpj])
                
                # Insere novos registros
                documents = [reseller.dict() for reseller in resellers]
                result = await self.collection.insert_many(documents)
                
                logger.info(f"✅ {len(result.inserted_ids)} revendas importadas")
            
            return {
                'success': True,
                'total_imported': len(resellers),
                'errors': errors,
                'message': f'{len(resellers)} revendas importadas com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro na importação do CSV: {str(e)}")
            return {
                'success': False,
                'total_imported': 0,
                'errors': [str(e)],
                'message': f'Erro na importação: {str(e)}'
            }
    
    async def enrich_all_data(self, batch_size: int = 10) -> Dict:
        """
        Enriquece dados de todas as revendas não processadas
        
        Args:
            batch_size: Tamanho do lote para processamento
            
        Returns:
            Dict com estatísticas do enriquecimento
        """
        try:
            logger.info("Iniciando enriquecimento de dados das revendas")
            
            # Busca revendas não enriquecidas
            cursor = self.collection.find({
                "data_enriched": {"$ne": True},
                "cnpj": {"$exists": True, "$ne": None, "$ne": ""}
            })
            
            resellers = await cursor.to_list(None)
            
            if not resellers:
                return {
                    'success': True,
                    'total_processed': 0,
                    'total_enriched': 0,
                    'message': 'Nenhuma revenda para enriquecer'
                }
            
            logger.info(f"Encontradas {len(resellers)} revendas para enriquecer")
            
            total_enriched = 0
            errors = []
            
            # Processa em lotes
            for i in range(0, len(resellers), batch_size):
                batch = resellers[i:i + batch_size]
                
                logger.info(f"Processando lote {i//batch_size + 1}/{(len(resellers) + batch_size - 1)//batch_size}")
                
                # Enriquece lote atual
                enriched_count = await self._enrich_batch(batch)
                total_enriched += enriched_count
                
                # Aguarda entre lotes para respeitar rate limits
                await asyncio.sleep(1)
            
            return {
                'success': True,
                'total_processed': len(resellers),
                'total_enriched': total_enriched,
                'errors': errors,
                'message': f'{total_enriched} revendas enriquecidas com sucesso'
            }
            
        except Exception as e:
            logger.error(f"Erro no enriquecimento de dados: {str(e)}")
            return {
                'success': False,
                'total_processed': 0,
                'total_enriched': 0,
                'errors': [str(e)],
                'message': f'Erro no enriquecimento: {str(e)}'
            }
    
    async def _enrich_batch(self, batch: List[Dict]) -> int:
        """Enriquece um lote de revendas"""
        enriched_count = 0
        
        for reseller_doc in batch:
            try:
                cnpj = reseller_doc.get('cnpj')
                if not cnpj:
                    continue
                
                logger.info(f"Enriquecendo dados do CNPJ: {cnpj}")
                
                # 1. Busca dados da empresa
                cnpj_data = await CNPJService.get_company_data(cnpj)
                
                if not cnpj_data:
                    logger.warning(f"Dados não encontrados para CNPJ: {cnpj}")
                    # Marca como processado mesmo sem dados
                    await self.collection.update_one(
                        {"_id": reseller_doc["_id"]},
                        {"$set": {"data_enriched": True}}
                    )
                    continue
                
                # 2. Busca coordenadas do endereço
                coordinates = None
                geocoding_source = None
                
                if cnpj_data.get('endereco_completo'):
                    coord_data = await GeocodingService.get_coordinates_from_address(
                        address=cnpj_data['endereco_completo'],
                        city=cnpj_data.get('cidade'),
                        state=cnpj_data.get('estado')
                    )
                    
                    if coord_data:
                        coordinates = {
                            'lat': coord_data['lat'],
                            'lng': coord_data['lng']
                        }
                        geocoding_source = coord_data['api_source']
                
                # 3. Atualiza documento no banco
                update_data = {
                    'name': cnpj_data.get('razao_social', reseller_doc.get('name')),
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
                
                if coordinates:
                    update_data['coordinates'] = coordinates
                    update_data['geocoding_source'] = geocoding_source
                
                await self.collection.update_one(
                    {"_id": reseller_doc["_id"]},
                    {"$set": update_data}
                )
                
                enriched_count += 1
                logger.info(f"✅ Revenda enriquecida: {cnpj_data.get('razao_social', cnpj)}")
                
                # Pausa entre requisições para respeitar rate limits
                await asyncio.sleep(0.3)
                
            except Exception as e:
                logger.error(f"Erro ao enriquecer revenda {reseller_doc.get('cnpj', 'unknown')}: {str(e)}")
                continue
        
        return enriched_count
    
    async def _remove_duplicates_by_cnpj(self, cnpjs: List[str]):
        """Remove duplicatas existentes por CNPJ"""
        if cnpjs:
            result = await self.collection.delete_many({
                "cnpj": {"$in": cnpjs}
            })
            if result.deleted_count > 0:
                logger.info(f"Removidas {result.deleted_count} revendas duplicadas")
    
    async def get_enrichment_stats(self) -> Dict:
        """Retorna estatísticas do enriquecimento de dados"""
        try:
            total_resellers = await self.collection.count_documents({})
            enriched_resellers = await self.collection.count_documents({"data_enriched": True})
            with_coordinates = await self.collection.count_documents({"coordinates": {"$exists": True}})
            with_cnpj_data = await self.collection.count_documents({"cnpj_data": {"$exists": True}})
            
            return {
                'total_resellers': total_resellers,
                'enriched_resellers': enriched_resellers,
                'with_coordinates': with_coordinates,
                'with_cnpj_data': with_cnpj_data,
                'enrichment_percentage': round((enriched_resellers / total_resellers * 100), 2) if total_resellers > 0 else 0
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter estatísticas: {str(e)}")
            return {
                'error': str(e)
            }