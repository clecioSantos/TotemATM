#!/bin/bash

# Define o diretório base (ajuste se necessário para a raiz do seu projeto)
BASE_PATH="apps/src/styles"

echo "🚀 Iniciando a criação da estrutura de estilos globais..."

# Criação das pastas
mkdir -p "$BASE_PATH/abstracts"
mkdir -p "$BASE_PATH/base"
mkdir -p "$BASE_PATH/components"
mkdir -p "$BASE_PATH/themes"

# Criação dos arquivos de Abstracts (Tokens)
touch "$BASE_PATH/abstracts/_variables.css"
touch "$BASE_PATH/abstracts/_mixins.css"

# Criação dos arquivos Base (Layout e Reset)
touch "$BASE_PATH/base/_reset.css"
touch "$BASE_PATH/base/_layout.css"

# Criação dos arquivos de Componentes UI Reutilizáveis
touch "$BASE_PATH/components/buttons.css"
touch "$BASE_PATH/components/badges.css"
touch "$BASE_PATH/components/inputs.css"
touch "$BASE_PATH/components/feedback.css"
touch "$BASE_PATH/components/modals.css"

# Criação dos arquivos de Temas
touch "$BASE_PATH/themes/admin.css"
touch "$BASE_PATH/themes/totem.css"

echo "✅ Estrutura criada com sucesso em $BASE_PATH!"
echo "Próximo passo: Comece movendo as variáveis de cor para abstracts/_variables.css"
