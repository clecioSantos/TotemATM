#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Seed de bairros para Venâncio Aires, Santa Cruz do Sul e Lajeado
# ─────────────────────────────────────────────────────────────────
# Uso:
#   ./scripts/seed-neighborhoods.sh
#
# Requer:
#   - Node.js 18+
#   - Acesso ao Firebase (via variáveis de ambiente ou service account)
#
# Variáveis de ambiente necessárias:
#   FIREBASE_PROJECT_ID        (ex: "meu-projeto")
#   FIREBASE_CLIENT_EMAIL      (opcional se usar service account)
#   FIREBASE_PRIVATE_KEY       (opcional se usar service account)
#   OU
#   FIREBASE_SERVICE_ACCOUNT_PATH  (path para o JSON de service account)
# ─────────────────────────────────────────────────────────────────

set -e

echo "═══════════════════════════════════════════════"
echo "  🌱 Seed de Bairros"
echo "═══════════════════════════════════════════════"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro."
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 18+ é necessário. Versão atual: $(node -v)"
  exit 1
fi

# Verificar variáveis de ambiente
if [ -z "$FIREBASE_PROJECT_ID" ] && [ -z "$FIREBASE_SERVICE_ACCOUNT_PATH" ]; then
  echo "⚠️  Nenhuma credencial Firebase encontrada."
  echo ""
  echo "   Defina uma das opções:"
  echo "   1. export FIREBASE_PROJECT_ID=\"seu-projeto\""
  echo "      export FIREBASE_CLIENT_EMAIL=\"...\""
  echo "      export FIREBASE_PRIVATE_KEY=\"...\""
  echo ""
  echo "   2. export FIREBASE_SERVICE_ACCOUNT_PATH=\"/caminho/service-account.json\""
  echo ""
  exit 1
fi

# Navegar até a raiz do projeto
cd "$(dirname "$0")/.."

echo "📦 Compilando e executando seed..."
echo ""

# Executa com ts-node ou npx tsx
if command -v npx &> /dev/null; then
  npx tsx scripts/migrations/seed-neighborhoods.ts
else
  echo "❌ npx não encontrado. Instale Node.js corretamente."
  exit 1
fi

echo ""
echo "✅ Seed finalizado!"
