#!/bin/bash

# Script que solicita sudo antes de executar

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="$SCRIPT_DIR/notification_server.py"
DEST_DIR="/usr/local/bin"
DEST_FILE="$DEST_DIR/notification_server.py"

echo "=== Instalando notification_server.py ==="

# Verificar se o arquivo existe
if [ ! -f "$SOURCE_FILE" ]; then
    echo "❌ Erro: notification_server.py não encontrado!"
    exit 1
fi

echo "📁 Origem: $SOURCE_FILE"
echo "📍 Destino: $DEST_FILE"
echo ""

# Solicitar privilégios sudo logo no início
echo "🔐 Solicitando privilégios administrativos..."
sudo echo "✅ Privilégios obtidos!"

echo ""
echo "🔧 Copiando arquivo..."
sudo cp "$SOURCE_FILE" "$DEST_FILE"

echo "🔧 Definindo permissões..."
sudo chmod +x "$DEST_FILE"

echo ""
echo "🎉 Instalação concluída!"
echo "📍 Arquivo disponível em: $DEST_FILE"
