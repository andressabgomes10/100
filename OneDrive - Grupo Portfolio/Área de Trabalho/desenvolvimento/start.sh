#!/bin/bash

# Script de inicialização para Railway
echo "🚀 Iniciando API de Revendas..."

# Instalar dependências
echo "📦 Instalando dependências..."
npm ci

# Build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Iniciar aplicação
echo "▶️ Iniciando aplicação..."
npm start
