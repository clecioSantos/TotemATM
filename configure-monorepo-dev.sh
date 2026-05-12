#!/bin/bash
# Configura a orquestração do monorepo para rodar Admin e API juntos

echo "🔧 Configurando scripts de inicialização..."

# 1. Garante que o backend/api tenha o script 'dev'
cd backend/api
npm pkg set scripts.dev="ts-node-dev --respawn --transpile-only src/index.ts"

# 2. Volta para a raiz e configura o package.json principal
cd ../..
npm pkg set scripts.dev="turbo run dev"

# 3. Cria ou atualiza o arquivo turbo.json na raiz para suportar comandos persistentes (servidores)
cat <<EOF > turbo.json
{
  "\$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
EOF

echo "✅ Configuração concluída! Agora, rode 'npm run dev' na RAIZ do projeto."