import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { 
  Database, 
  MapPin, 
  Building2, 
  Activity, 
  Search,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const AdminPanel = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [enrichmentRunning, setEnrichmentRunning] = useState(false);
  
  // Estados para testes de API
  const [cnpjTest, setCnpjTest] = useState('09443646000118');
  const [cnpjResult, setCnpjResult] = useState(null);
  const [geocodeTest, setGeocodeTest] = useState('Avenidade Paulista, 1000, São Paulo, SP');
  const [geocodeResult, setGeocodeResult] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/data/optimized-stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao buscar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleImportOptimized = async () => {
    try {
      setLoading(true);
      toast.info('🚀 Iniciando importação otimizada...');
      
      const response = await axios.post(`${API}/data/import-optimized`);
      
      if (response.data.success) {
        toast.success(`✅ ${response.data.total_imported} revendas importadas com dados otimizados!`);
        fetchStats();
      } else {
        toast.error('Erro na importação: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro na importação otimizada:', error);
      toast.error('Erro na importação otimizada');
    } finally {
      setLoading(false);
    }
  };

  const handleSmartEnrich = async () => {
    try {
      setEnrichmentRunning(true);
      toast.info('🧠 Iniciando enriquecimento inteligente... Processamento otimizado!');
      
      const response = await axios.post(`${API}/data/smart-enrich`);
      
      if (response.data.success) {
        toast.success(`✅ ${response.data.total_enriched} revendas enriquecidas inteligentemente!`);
        fetchStats();
      } else {
        toast.error('Erro no enriquecimento: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro no enriquecimento inteligente:', error);
      toast.error('Erro no enriquecimento inteligente');
    } finally {
      setEnrichmentRunning(false);
    }
  };

  const handleTestCNPJ = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/cnpj/lookup`, {
        cnpj: cnpjTest
      });
      setCnpjResult(response.data);
      
      if (response.data.success) {
        toast.success('CNPJ encontrado com sucesso!');
      } else {
        toast.warning('CNPJ não encontrado');
      }
    } catch (error) {
      console.error('Erro no teste CNPJ:', error);
      toast.error('Erro no teste CNPJ');
    } finally {
      setLoading(false);
    }
  };

  const handleTestGeocode = async () => {
    try {
      setLoading(true);
      const response = await axios.post(`${API}/geocode`, {
        address: geocodeTest
      });
      setGeocodeResult(response.data);
      
      if (response.data.success) {
        toast.success('Coordenadas encontradas com sucesso!');
      } else {
        toast.warning('Endereço não encontrado');
      }
    } catch (error) {
      console.error('Erro no teste geocoding:', error);
      toast.error('Erro no teste geocoding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Atualiza estatísticas a cada 30 segundos quando enriquecimento está rodando
    const interval = enrichmentRunning ? setInterval(fetchStats, 30000) : null;
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [enrichmentRunning]);

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
              <span className="text-xl font-bold text-gray-900">Nacional Gás - Admin</span>
            </div>
            <Button 
              onClick={fetchStats}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas Otimizadas */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revendas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total_resellers?.toLocaleString()}</p>
                    <p className="text-xs text-green-600">{stats.active_resellers} ativas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Com Dados CNPJ</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.with_cnpj_data?.toLocaleString()}</p>
                    <p className="text-xs text-blue-600">{stats.with_phone} com telefone</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MapPin className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Com Coordenadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.with_coordinates?.toLocaleString()}</p>
                    <p className="text-xs text-purple-600">{stats.google_maps_coords} Google Maps</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">% Enriquecido</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.enrichment_percentage}%</p>
                    <p className="text-xs text-orange-600">{stats.high_priority} alta prioridade</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="cnpj">Teste CNPJ</TabsTrigger>
            <TabsTrigger value="geocode">Teste Geocoding</TabsTrigger>
          </TabsList>

          {/* Tab de Dados */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Gerenciamento de Dados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">📊 Importar Dados Otimizados</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Importa dados do CSV normalizado com estrutura otimizada, incluindo prioridades e segmentação.
                      </p>
                      <Button 
                        onClick={handleImportOptimized}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Database className="h-4 w-4 mr-2" />
                        )}
                        Importar CSV Otimizado
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">🧠 Enriquecimento Inteligente</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Algoritmo otimizado que prioriza revendas importantes e processa em lotes eficientes com Google Maps.
                      </p>
                      <Button 
                        onClick={handleSmartEnrich}
                        disabled={loading || enrichmentRunning}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                        variant={enrichmentRunning ? "secondary" : "default"}
                      >
                        {enrichmentRunning ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <MapPin className="h-4 w-4 mr-2" />
                        )}
                        {enrichmentRunning ? 'Processando Inteligente...' : 'Enriquecimento Inteligente'}
                      </Button>
                    </div>
                  </div>
                </div>

                {enrichmentRunning && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <RefreshCw className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
                      <div>
                        <p className="text-blue-900 font-medium">🧠 Enriquecimento Inteligente em Progresso</p>
                        <p className="text-blue-700 text-sm">
                          Processamento otimizado com Google Maps • Priorização inteligente • Estatísticas atualizadas automaticamente
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Teste CNPJ */}
          <TabsContent value="cnpj">
            <Card>
              <CardHeader>
                <CardTitle>Teste API CNPJ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={cnpjTest}
                    onChange={(e) => setCnpjTest(e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <Button onClick={handleTestCNPJ} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  Buscar Dados
                </Button>

                {cnpjResult && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        {cnpjResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <Badge variant={cnpjResult.success ? "default" : "destructive"}>
                          {cnpjResult.success ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </div>
                      <Textarea
                        value={JSON.stringify(cnpjResult, null, 2)}
                        readOnly
                        className="h-40 font-mono text-xs"
                      />
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab de Teste Geocoding */}
          <TabsContent value="geocode">
            <Card>
              <CardHeader>
                <CardTitle>Teste API Geocoding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={geocodeTest}
                    onChange={(e) => setGeocodeTest(e.target.value)}
                    placeholder="Rua, número, cidade, estado"
                  />
                </div>
                <Button onClick={handleTestGeocode} disabled={loading}>
                  <MapPin className="h-4 w-4 mr-2" />
                  Buscar Coordenadas
                </Button>

                {geocodeResult && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <div className="flex items-center mb-3">
                        {geocodeResult.success ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        )}
                        <Badge variant={geocodeResult.success ? "default" : "destructive"}>
                          {geocodeResult.success ? 'Sucesso' : 'Erro'}
                        </Badge>
                      </div>
                      <Textarea
                        value={JSON.stringify(geocodeResult, null, 2)}
                        readOnly
                        className="h-40 font-mono text-xs"
                      />
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};