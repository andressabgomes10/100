import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Search, Phone, Clock, Navigation } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const ResellerLocator = () => {
  const [cep, setCep] = useState('');
  const [resellers, setResellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Função para aplicar máscara do CEP
  const applyCepMask = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 8) {
      return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return numbers.substring(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  const handleCepChange = (e) => {
    const maskedValue = applyCepMask(e.target.value);
    setCep(maskedValue);
    setError(''); // Limpa erro ao digitar
  };

  const handleSearch = async () => {
    if (cep.length !== 9) {
      setError('Digite um CEP válido');
      return;
    }
    
    setLoading(true);
    setSearched(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/resellers/search`, {
        cep: cep
      });

      if (response.data.success) {
        setResellers(response.data.data);
        
        if (response.data.total === 0) {
          toast.info('Nenhuma revenda encontrada próxima ao CEP informado.');
        } else {
          toast.success(`${response.data.total} revenda(s) encontrada(s) próxima(s) a você!`);
        }
      } else {
        setError(response.data.message || 'Erro na busca');
        toast.error(response.data.message || 'Erro na busca');
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      setError('Erro ao buscar revendas. Tente novamente.');
      toast.error('Erro ao buscar revendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">NG</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Nacional Gás</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-red-600 mb-4">
            Encontre sua Revenda
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Digite seu CEP e localize a revenda autorizada Nacional Gás mais próxima de você
          </p>
        </div>

        {/* Search Card */}
        <Card className="max-w-lg mx-auto mb-8 shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Buscar por localização
                </h3>
                <p className="text-sm text-gray-600">
                  Informe seu CEP para encontrarmos a revenda mais próxima
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="cep" className="text-sm font-medium text-gray-700">
                  CEP *
                </Label>
                <Input
                  id="cep"
                  type="text"
                  placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                  onKeyPress={handleKeyPress}
                  className="mt-1 text-lg py-3"
                  maxLength={9}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Digite apenas números, a máscara será aplicada automaticamente
                </p>
              </div>

              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}

              <Button
                onClick={handleSearch}
                disabled={cep.length !== 9 || loading}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-3 text-lg transition-all duration-200"
              >
                <Search className="h-5 w-5 mr-2" />
                {loading ? 'Buscando...' : 'Buscar Revenda'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {searched && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {resellers.length > 0 ? 'Revendas Próximas' : 'Nenhuma revenda encontrada'}
            </h2>
            
            {resellers.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2">
                {resellers.map((reseller) => (
                  <Card key={reseller.id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {reseller.name}
                          </h3>
                          <p className="text-red-600 font-medium text-sm">
                            {reseller.distance} km de distância
                          </p>
                        </div>
                        <Navigation className="h-5 w-5 text-blue-600" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                          <div>
                            <p className="text-gray-700">{reseller.address}</p>
                            <p className="text-gray-600 text-sm">
                              {reseller.neighborhood} - {reseller.city}, {reseller.state}
                            </p>
                            <p className="text-gray-600 text-sm">CEP: {reseller.cep}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-700">{reseller.phone}</p>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <p className="text-gray-700">{reseller.hours}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex space-x-3">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => window.open(`tel:${reseller.phone.replace(/\D/g, '')}`)}
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Ligar
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(reseller.address + ', ' + reseller.city)}`)}
                          >
                            <Navigation className="h-4 w-4 mr-1" />
                            Rotas
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                  <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Não encontramos revendas próximas ao CEP informado.
                  </p>
                  <p className="text-sm text-gray-500">
                    Tente novamente com um CEP diferente ou entre em contato conosco.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">NG</span>
              </div>
              <span className="text-xl font-bold">Nacional Gás</span>
            </div>
            <p className="text-gray-400">
              © 2025 Nacional Gás. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};