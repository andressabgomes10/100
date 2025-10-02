#!/usr/bin/env bash
set -e

echo "🚀 Iniciando deploy..."

# Verificar se é Node.js
if [ -f package.json ]; then
  echo "📦 Instalando dependências..."
  npm ci
  
  echo "🔨 Fazendo build..."
  npm run build || echo "⚠️ Build falhou, continuando..."
  
  echo "▶️ Iniciando aplicação..."
  exec npm run start
fi

# Verificar se é Python
if [ -f requirements.txt ]; then
  echo "🐍 Instalando dependências Python..."
  pip install -r requirements.txt
  
  echo "▶️ Iniciando aplicação Python..."
  exec gunicorn app:app --bind 0.0.0.0:${PORT:-3000}
fi

echo "❌ Nenhum projeto válido encontrado!"
exit 1
