import { CepInfo, GeocodeResult, GeocodeProvider } from '../types';
import { logger } from '../lib/logger';

/**
 * Serviço de geocodificação opcional
 * Interface para diferentes provedores de geocodificação
 */
export class GeocodeService {
  private provider: GeocodeProvider;

  constructor() {
    this.provider = (process.env.GEO_PROVIDER as GeocodeProvider) || 'none';
    logger.info({ provider: this.provider }, 'GeocodeService initialized');
  }

  /**
   * Geocodifica um endereço baseado nas informações do CEP
   * Retorna coordenadas lat/lng ou null se não configurado
   */
  async geocodeAddress(cepInfo: CepInfo): Promise<GeocodeResult> {
    if (this.provider === 'none') {
      logger.debug({ cep: cepInfo.cep }, 'Geocoding disabled (provider: none)');
      return null;
    }

    const address = this.buildAddressString(cepInfo);
    logger.debug({ cep: cepInfo.cep, address, provider: this.provider }, 'Starting geocoding');

    try {
      switch (this.provider) {
        case 'google':
          return await this.geocodeWithGoogle(address);
        case 'mapbox':
          return await this.geocodeWithMapbox(address);
        case 'opencage':
          return await this.geocodeWithOpenCage(address);
        default:
          logger.warn({ provider: this.provider }, 'Unknown geocoding provider');
          return null;
      }
    } catch (error) {
      logger.error({ cep: cepInfo.cep, address, provider: this.provider, error }, 'Geocoding failed');
      return null;
    }
  }

  /**
   * Constrói string de endereço para geocodificação
   */
  private buildAddressString(cepInfo: CepInfo): string {
    const parts = [];
    
    if (cepInfo.rua) {
      parts.push(cepInfo.rua);
    }
    
    if (cepInfo.bairro) {
      parts.push(cepInfo.bairro);
    }
    
    parts.push(cepInfo.cidade);
    parts.push(cepInfo.uf);
    parts.push(cepInfo.cep);
    
    return parts.join(', ');
  }

  /**
   * Geocodificação com Google Maps API
   * TODO: Implementar quando GEO_PROVIDER=google
   */
  private async geocodeWithGoogle(address: string): Promise<GeocodeResult> {
    logger.warn('Google geocoding not implemented yet');
    // TODO: Implementar integração com Google Maps Geocoding API
    // const apiKey = process.env.GEO_API_KEY;
    // if (!apiKey) {
    //   throw new Error('GEO_API_KEY not configured for Google provider');
    // }
    // 
    // const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    // const response = await httpGet(url);
    // const data = await response.json();
    // 
    // if (data.status === 'OK' && data.results.length > 0) {
    //   const location = data.results[0].geometry.location;
    //   return { lat: location.lat, lng: location.lng };
    // }
    
    return null;
  }

  /**
   * Geocodificação com Mapbox API
   * TODO: Implementar quando GEO_PROVIDER=mapbox
   */
  private async geocodeWithMapbox(address: string): Promise<GeocodeResult> {
    logger.warn('Mapbox geocoding not implemented yet');
    // TODO: Implementar integração com Mapbox Geocoding API
    // const apiKey = process.env.GEO_API_KEY;
    // if (!apiKey) {
    //   throw new Error('GEO_API_KEY not configured for Mapbox provider');
    // }
    // 
    // const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${apiKey}`;
    // const response = await httpGet(url);
    // const data = await response.json();
    // 
    // if (data.features && data.features.length > 0) {
    //   const [lng, lat] = data.features[0].center;
    //   return { lat, lng };
    // }
    
    return null;
  }

  /**
   * Geocodificação com OpenCage API
   * TODO: Implementar quando GEO_PROVIDER=opencage
   */
  private async geocodeWithOpenCage(address: string): Promise<GeocodeResult> {
    logger.warn('OpenCage geocoding not implemented yet');
    // TODO: Implementar integração com OpenCage Geocoding API
    // const apiKey = process.env.GEO_API_KEY;
    // if (!apiKey) {
    //   throw new Error('GEO_API_KEY not configured for OpenCage provider');
    // }
    // 
    // const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;
    // const response = await httpGet(url);
    // const data = await response.json();
    // 
    // if (data.results && data.results.length > 0) {
    //   const { lat, lng } = data.results[0].geometry;
    //   return { lat, lng };
    // }
    
    return null;
  }

  /**
   * Verifica se o serviço está configurado para geocodificação
   */
  isEnabled(): boolean {
    return this.provider !== 'none';
  }

  /**
   * Retorna o provedor atual
   */
  getProvider(): GeocodeProvider {
    return this.provider;
  }
}

// Instância singleton do serviço
export const geocodeService = new GeocodeService();
