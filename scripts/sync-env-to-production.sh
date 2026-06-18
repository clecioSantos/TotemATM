#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Sincroniza as configurações do Firebase do .env para o .env.production
# ─────────────────────────────────────────────────────────────────
# Uso:
#   ./scripts/sync-env-to-production.sh
#
# Isso copia todas as variáveis que começam com:
#   FIREBASE_
#   NEXT_PUBLIC_FIREBASE_
#   MERCADOPAGO_
#   NEXT_PUBLIC_MERCADOPAGO_
#   PAGBANK_
#   ABACATEPAY_
#   PAYMENT_
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
ENV_PROD_FILE="$PROJECT_DIR/.env.production"

echo "═══════════════════════════════════════════════"
echo "  🔄 Sync .env → .env.production"
echo "═══════════════════════════════════════════════"
echo ""

# Verificar se .env existe
if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env não encontrado em $ENV_FILE"
  exit 1
fi

# Prefixos a serem copiados
PREFIXES=("FIREBASE_" "NEXT_PUBLIC_FIREBASE_" "MERCADOPAGO_" "NEXT_PUBLIC_MERCADOPAGO_" "PAGBANK_" "ABACATEPAY_" "PAYMENT_" "NEXT_PUBLIC_BASE_URL")

echo "📖 Lendo variáveis de: .env"
echo ""

# Extrair variáveis que começam com os prefixos
> "$ENV_PROD_FILE.tmp"

for prefix in "${PREFIXES[@]}"; do
  grep -i "^${prefix}" "$ENV_FILE" >> "$ENV_PROD_FILE.tmp" 2>/dev/null || true
done

# Remover linhas vazias e duplicatas
sort -u "$ENV_PROD_FILE.tmp" | sed '/^$/d' > "$ENV_PROD_FILE"

rm -f "$ENV_PROD_FILE.tmp"

# Contar quantas variáveis foram copiadas
COUNT=$(wc -l < "$ENV_PROD_FILE")

echo "✅ $COUNT variáveis copiadas para .env.production"
echo ""
echo "📄 Arquivo gerado: $ENV_PROD_FILE"
echo ""

# Mostrar preview
echo "Variáveis copiadas:"
echo "────────────────────"
cat "$ENV_PROD_FILE" | while read line; do
  key="${line%%=*}"
  echo "   $key"
done

echo ""
echo "═══ Concluído ═══"
