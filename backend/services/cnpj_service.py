import httpx
import asyncio
import logging
import re
from typing import Optional, Dict

logger = logging.getLogger(__name__)

class CNPJService:
    """Service for CNPJ data retrieval using BrasilAPI"""
    
    BASE_URL = "https://brasilapi.com.br/api"
    TIMEOUT = 10.0
    
    @staticmethod
    def normalize_cnpj(cnpj: str) -> str:
        """
        Normaliza CNPJ removendo caracteres especiais
        """
        if not cnpj:
            return ""
        
        # Remove tudo que não é número
        cnpj_clean = re.sub(r'\D', '', str(cnpj))
        
        # Se está em notação científica, converte
        try:
            if 'E' in str(cnpj).upper():
                cnpj_float = float(cnpj)
                cnpj_clean = f"{cnpj_float:014.0f}"
        except:
            pass
        
        # Garante que tem 14 dígitos
        cnpj_clean = cnpj_clean.zfill(14)
        
        return cnpj_clean
    
    @staticmethod
    def validate_cnpj(cnpj: str) -> bool:
        """
        Valida formato básico do CNPJ
        """
        cnpj_clean = CNPJService.normalize_cnpj(cnpj)
        return len(cnpj_clean) == 14 and cnpj_clean.isdigit()
    
    @staticmethod
    async def get_company_data(cnpj: str) -> Optional[Dict]:
        """
        Busca dados da empresa na BrasilAPI
        
        Args:
            cnpj: CNPJ da empresa (com ou sem formatação)
            
        Returns:
            Dict com dados da empresa ou None se não encontrar
        """
        try:
            cnpj_normalized = CNPJService.normalize_cnpj(cnpj)
            
            if not CNPJService.validate_cnpj(cnpj_normalized):
                logger.warning(f"CNPJ inválido: {cnpj}")
                return None
            
            url = f"{CNPJService.BASE_URL}/cnpj/v1/{cnpj_normalized}"
            
            async with httpx.AsyncClient(timeout=CNPJService.TIMEOUT) as client:
                logger.info(f"Buscando dados do CNPJ: {cnpj_normalized}")
                response = await client.get(url)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Extrai endereço formatado
                    endereco_formatado = CNPJService._format_address(data)
                    
                    result = {
                        'cnpj': cnpj_normalized,
                        'razao_social': data.get('company_name', ''),
                        'nome_fantasia': data.get('trade_name', ''),
                        'endereco_completo': endereco_formatado,
                        'logradouro': data.get('street', ''),
                        'numero': data.get('number', ''),
                        'complemento': data.get('complement', ''),
                        'bairro': data.get('district', ''),
                        'cidade': data.get('city', ''),
                        'estado': data.get('state', ''),
                        'cep': data.get('zip', ''),
                        'telefone': data.get('phone', ''),
                        'email': data.get('email', ''),
                        'atividade_principal': data.get('main_activity', {}).get('text', ''),
                        'situacao': data.get('status', ''),
                        'data_situacao': data.get('status_date', ''),
                        'api_source': 'brasilapi'
                    }
                    
                    logger.info(f"✅ Dados encontrados para CNPJ {cnpj_normalized}")
                    return result
                    
                elif response.status_code == 404:
                    logger.warning(f"CNPJ não encontrado: {cnpj_normalized}")
                    return None
                elif response.status_code == 429:
                    logger.warning(f"Rate limit excedido para CNPJ: {cnpj_normalized}")
                    # Aguarda um pouco antes de tentar novamente
                    await asyncio.sleep(1)
                    return None
                else:
                    logger.error(f"Erro na consulta CNPJ {cnpj_normalized}: {response.status_code}")
                    return None
                    
        except httpx.TimeoutException:
            logger.error(f"Timeout na consulta CNPJ: {cnpj}")
            return None
        except Exception as e:
            logger.error(f"Erro na consulta CNPJ {cnpj}: {str(e)}")
            return None
    
    @staticmethod
    def _format_address(data: Dict) -> str:
        """
        Formata endereço completo a partir dos dados da API
        """
        parts = []
        
        if data.get('street'):
            parts.append(data['street'])
        
        if data.get('number'):
            parts.append(data['number'])
        
        if data.get('complement'):
            parts.append(data['complement'])
        
        if data.get('district'):
            parts.append(data['district'])
        
        if data.get('city'):
            parts.append(data['city'])
        
        if data.get('state'):
            parts.append(data['state'])
        
        if data.get('zip'):
            parts.append(f"CEP: {data['zip']}")
        
        return ", ".join([p for p in parts if p])
    
    @staticmethod
    async def batch_get_companies_data(cnpjs: list, batch_size: int = 5, delay: float = 0.2) -> Dict[str, Dict]:
        """
        Busca dados de múltiplas empresas em lote com controle de rate limit
        
        Args:
            cnpjs: Lista de CNPJs
            batch_size: Número de requisições simultâneas
            delay: Delay entre lotes (segundos)
            
        Returns:
            Dict com CNPJ como chave e dados da empresa como valor
        """
        results = {}
        
        logger.info(f"Iniciando busca em lote de {len(cnpjs)} CNPJs")
        
        for i in range(0, len(cnpjs), batch_size):
            batch = cnpjs[i:i + batch_size]
            
            logger.info(f"Processando lote {i//batch_size + 1}/{(len(cnpjs) + batch_size - 1)//batch_size}")
            
            # Processa lote atual
            tasks = [CNPJService.get_company_data(cnpj) for cnpj in batch]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Processa resultados
            for cnpj, result in zip(batch, batch_results):
                cnpj_normalized = CNPJService.normalize_cnpj(cnpj)
                
                if isinstance(result, Exception):
                    logger.error(f"Erro no CNPJ {cnpj_normalized}: {result}")
                    results[cnpj_normalized] = None
                else:
                    results[cnpj_normalized] = result
            
            # Aguarda antes do próximo lote
            if i + batch_size < len(cnpjs):
                await asyncio.sleep(delay)
        
        successful = len([r for r in results.values() if r is not None])
        logger.info(f"✅ Busca concluída: {successful}/{len(cnpjs)} CNPJs processados com sucesso")
        
        return results