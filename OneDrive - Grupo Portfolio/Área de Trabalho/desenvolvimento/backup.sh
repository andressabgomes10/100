#!/bin/bash
# 📦 Script de Backup Automático

set -e

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
SOURCE_FILE="./db/revendas.json"
MAX_BACKUPS=30

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Verificar se arquivo fonte existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Arquivo $SOURCE_FILE não encontrado"
    exit 1
fi

# Fazer backup
echo "📦 Criando backup: revendas_$DATE.json"
cp "$SOURCE_FILE" "$BACKUP_DIR/revendas_$DATE.json"

# Verificar se backup foi criado
if [ -f "$BACKUP_DIR/revendas_$DATE.json" ]; then
    echo "✅ Backup criado com sucesso!"
    
    # Mostrar tamanho do arquivo
    SIZE=$(du -h "$BACKUP_DIR/revendas_$DATE.json" | cut -f1)
    echo "📊 Tamanho: $SIZE"
else
    echo "❌ Falha ao criar backup"
    exit 1
fi

# Limpar backups antigos (manter apenas os últimos MAX_BACKUPS)
echo "🧹 Limpando backups antigos..."
cd $BACKUP_DIR
ls -t revendas_*.json | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm
cd ..

# Mostrar backups disponíveis
echo "📋 Backups disponíveis:"
ls -la $BACKUP_DIR/revendas_*.json | tail -5

echo "✅ Backup concluído!"
