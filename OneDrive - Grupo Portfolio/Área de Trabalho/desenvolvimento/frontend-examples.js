// 🚀 Exemplo de Integração Frontend - React/Vue/Angular
// Use este código como base para integrar com seu projeto Figma

// ========================================
// REACT EXAMPLE
// ========================================

import React, { useState, useEffect } from 'react';

const RevendaSearch = () => {
  const [cep, setCep] = useState('');
  const [tipo, setTipo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');

  const API_BASE = 'http://localhost:3001';
  const API_KEY = 'NG_API_SK_1759414399452_aqmotc1wab70nels6brz2fo';

  const buscarRevenda = async () => {
    if (!cep || cep.length !== 8) {
      setErro('CEP deve ter 8 dígitos');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      // Buscar informações do CEP
      const cepResponse = await fetch(`${API_BASE}/cep/${cep}`, {
        headers: { 'x-api-key': API_KEY }
      });
      const cepData = await cepResponse.json();

      // Buscar revenda mais próxima
      const revendaResponse = await fetch(`${API_BASE}/revenda-mais-proxima`, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cep, tipo: tipo || undefined })
      });

      if (revendaResponse.ok) {
        const revendaData = await revendaResponse.json();
        setResultado({ revenda: revendaData, cep: cepData });
      } else {
        // Fallback para coordenadas de teste
        const fallbackResponse = await fetch(`${API_BASE}/test/revenda-mais-proxima`, {
          method: 'POST',
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lat: -3.73, lng: -38.52, tipo: tipo || undefined })
        });
        const fallbackData = await fallbackResponse.json();
        setResultado({ revenda: fallbackData, cep: cepData });
      }
    } catch (error) {
      setErro(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="revenda-search">
      <h2>🏢 Encontrar Revenda Mais Próxima</h2>
      
      <div className="form-group">
        <label>CEP:</label>
        <input
          type="text"
          value={cep}
          onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
          placeholder="Digite seu CEP"
          maxLength="8"
        />
      </div>

      <div className="form-group">
        <label>Tipo:</label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="">Todos</option>
          <option value="empresarial">Empresarial</option>
          <option value="residencial">Residencial</option>
        </select>
      </div>

      <button onClick={buscarRevenda} disabled={loading}>
        {loading ? '🔍 Buscando...' : '🔍 Buscar'}
      </button>

      {erro && <div className="error">{erro}</div>}

      {resultado && (
        <div className="resultado">
          <h3>📍 Revenda Encontrada</h3>
          <div className="revenda-info">
            <p><strong>Nome:</strong> {resultado.revenda.revenda.nome_fantasia}</p>
            <p><strong>CNPJ:</strong> {resultado.revenda.revenda.cnpj}</p>
            <p><strong>Endereço:</strong> {resultado.revenda.revenda.endereco}</p>
            <p><strong>Telefone:</strong> {resultado.revenda.revenda.telefone}</p>
            <p><strong>Distância:</strong> {resultado.revenda.revenda.distancia_km.toFixed(2)} km</p>
          </div>
          
          <h3>📍 Informações do CEP</h3>
          <div className="cep-info">
            <p><strong>Cidade:</strong> {resultado.cep.cidade}</p>
            <p><strong>UF:</strong> {resultado.cep.uf}</p>
            <p><strong>Bairro:</strong> {resultado.cep.bairro}</p>
            <p><strong>Rua:</strong> {resultado.cep.rua}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevendaSearch;

// ========================================
// VUE EXAMPLE
// ========================================

/*
<template>
  <div class="revenda-search">
    <h2>🏢 Encontrar Revenda Mais Próxima</h2>
    
    <div class="form-group">
      <label>CEP:</label>
      <input 
        v-model="cep" 
        @input="formatCep"
        placeholder="Digite seu CEP"
        maxlength="8"
      />
    </div>

    <div class="form-group">
      <label>Tipo:</label>
      <select v-model="tipo">
        <option value="">Todos</option>
        <option value="empresarial">Empresarial</option>
        <option value="residencial">Residencial</option>
      </select>
    </div>

    <button @click="buscarRevenda" :disabled="loading">
      {{ loading ? '🔍 Buscando...' : '🔍 Buscar' }}
    </button>

    <div v-if="erro" class="error">{{ erro }}</div>

    <div v-if="resultado" class="resultado">
      <h3>📍 Revenda Encontrada</h3>
      <div class="revenda-info">
        <p><strong>Nome:</strong> {{ resultado.revenda.revenda.nome_fantasia }}</p>
        <p><strong>CNPJ:</strong> {{ resultado.revenda.revenda.cnpj }}</p>
        <p><strong>Distância:</strong> {{ resultado.revenda.revenda.distancia_km.toFixed(2) }} km</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cep: '',
      tipo: '',
      loading: false,
      resultado: null,
      erro: '',
      API_BASE: 'http://localhost:3001',
      API_KEY: 'changeme'
    }
  },
  methods: {
    formatCep(event) {
      this.cep = event.target.value.replace(/\D/g, '').slice(0, 8);
    },
    async buscarRevenda() {
      if (!this.cep || this.cep.length !== 8) {
        this.erro = 'CEP deve ter 8 dígitos';
        return;
      }

      this.loading = true;
      this.erro = '';

      try {
        const cepResponse = await fetch(`${this.API_BASE}/cep/${this.cep}`, {
          headers: { 'x-api-key': this.API_KEY }
        });
        const cepData = await cepResponse.json();

        const revendaResponse = await fetch(`${this.API_BASE}/revenda-mais-proxima`, {
          method: 'POST',
          headers: {
            'x-api-key': this.API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ cep: this.cep, tipo: this.tipo || undefined })
        });

        if (revendaResponse.ok) {
          const revendaData = await revendaResponse.json();
          this.resultado = { revenda: revendaData, cep: cepData };
        } else {
          // Fallback
          const fallbackResponse = await fetch(`${this.API_BASE}/test/revenda-mais-proxima`, {
            method: 'POST',
            headers: {
              'x-api-key': this.API_KEY,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ lat: -3.73, lng: -38.52, tipo: this.tipo || undefined })
          });
          const fallbackData = await fallbackResponse.json();
          this.resultado = { revenda: fallbackData, cep: cepData };
        }
      } catch (error) {
        this.erro = `Erro: ${error.message}`;
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
*/

// ========================================
// ANGULAR EXAMPLE
// ========================================

/*
import { Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-revenda-search',
  template: `
    <div class="revenda-search">
      <h2>🏢 Encontrar Revenda Mais Próxima</h2>
      
      <div class="form-group">
        <label>CEP:</label>
        <input 
          [(ngModel)]="cep" 
          (input)="formatCep($event)"
          placeholder="Digite seu CEP"
          maxlength="8"
        />
      </div>

      <div class="form-group">
        <label>Tipo:</label>
        <select [(ngModel)]="tipo">
          <option value="">Todos</option>
          <option value="empresarial">Empresarial</option>
          <option value="residencial">Residencial</option>
        </select>
      </div>

      <button (click)="buscarRevenda()" [disabled]="loading">
        {{ loading ? '🔍 Buscando...' : '🔍 Buscar' }}
      </button>

      <div *ngIf="erro" class="error">{{ erro }}</div>

      <div *ngIf="resultado" class="resultado">
        <h3>📍 Revenda Encontrada</h3>
        <div class="revenda-info">
          <p><strong>Nome:</strong> {{ resultado.revenda.revenda.nome_fantasia }}</p>
          <p><strong>CNPJ:</strong> {{ resultado.revenda.revenda.cnpj }}</p>
          <p><strong>Distância:</strong> {{ resultado.revenda.revenda.distancia_km | number:'1.2-2' }} km</p>
        </div>
      </div>
    </div>
  `
})
export class RevendaSearchComponent {
  cep = '';
  tipo = '';
  loading = false;
  resultado: any = null;
  erro = '';

  private readonly API_BASE = 'http://localhost:3001';
  private readonly API_KEY = 'changeme';

  constructor(private http: HttpClient) {}

  formatCep(event: any) {
    this.cep = event.target.value.replace(/\D/g, '').slice(0, 8);
  }

  async buscarRevenda() {
    if (!this.cep || this.cep.length !== 8) {
      this.erro = 'CEP deve ter 8 dígitos';
      return;
    }

    this.loading = true;
    this.erro = '';

    const headers = new HttpHeaders({
      'x-api-key': this.API_KEY,
      'Content-Type': 'application/json'
    });

    try {
      const cepData = await this.http.get(`${this.API_BASE}/cep/${this.cep}`, { headers }).toPromise();
      
      try {
        const revendaData = await this.http.post(`${this.API_BASE}/revenda-mais-proxima`, 
          { cep: this.cep, tipo: this.tipo || undefined }, { headers }).toPromise();
        this.resultado = { revenda: revendaData, cep: cepData };
      } catch {
        // Fallback
        const fallbackData = await this.http.post(`${this.API_BASE}/test/revenda-mais-proxima`,
          { lat: -3.73, lng: -38.52, tipo: this.tipo || undefined }, { headers }).toPromise();
        this.resultado = { revenda: fallbackData, cep: cepData };
      }
    } catch (error: any) {
      this.erro = `Erro: ${error.message}`;
    } finally {
      this.loading = false;
    }
  }
}
*/

// ========================================
// VANILLA JAVASCRIPT EXAMPLE
// ========================================

/*
class RevendaSearch {
  constructor() {
    this.API_BASE = 'http://localhost:3001';
    this.API_KEY = 'changeme';
    this.init();
  }

  init() {
    const form = document.getElementById('revenda-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.buscarRevenda();
      });
    }
  }

  async buscarRevenda() {
    const cep = document.getElementById('cep').value;
    const tipo = document.getElementById('tipo').value;
    
    if (!cep || cep.length !== 8) {
      this.showError('CEP deve ter 8 dígitos');
      return;
    }

    this.showLoading();

    try {
      const cepData = await this.fetchCEP(cep);
      const revendaData = await this.fetchRevenda(cep, tipo);
      this.showResult(revendaData, cepData);
    } catch (error) {
      this.showError(`Erro: ${error.message}`);
    }
  }

  async fetchCEP(cep) {
    const response = await fetch(`${this.API_BASE}/cep/${cep}`, {
      headers: { 'x-api-key': this.API_KEY }
    });
    return await response.json();
  }

  async fetchRevenda(cep, tipo) {
    try {
      const response = await fetch(`${this.API_BASE}/revenda-mais-proxima`, {
        method: 'POST',
        headers: {
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cep, tipo: tipo || undefined })
      });
      return await response.json();
    } catch {
      // Fallback
      const response = await fetch(`${this.API_BASE}/test/revenda-mais-proxima`, {
        method: 'POST',
        headers: {
          'x-api-key': this.API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ lat: -3.73, lng: -38.52, tipo: tipo || undefined })
      });
      return await response.json();
    }
  }

  showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('resultado').style.display = 'none';
    document.getElementById('erro').style.display = 'none';
  }

  showResult(revendaData, cepData) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
      <h3>📍 Revenda Encontrada</h3>
      <p><strong>Nome:</strong> ${revendaData.revenda.nome_fantasia}</p>
      <p><strong>CNPJ:</strong> ${revendaData.revenda.cnpj}</p>
      <p><strong>Distância:</strong> ${revendaData.revenda.distancia_km.toFixed(2)} km</p>
    `;
    resultadoDiv.style.display = 'block';
    document.getElementById('loading').style.display = 'none';
  }

  showError(message) {
    document.getElementById('erro').textContent = message;
    document.getElementById('erro').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
  }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new RevendaSearch();
});
*/
