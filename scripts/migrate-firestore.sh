#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# Migra dados do Firestore entre projetos (env → env.production)
# ─────────────────────────────────────────────────────────────────
# Uso:
#   ./scripts/migrate-firestore.sh
#
# Fluxo:
#   1. Exporta dados usando credenciais do .env (projeto origem)
#   2. Importa dados usando credenciais do .env.production (projeto destino)
# ─────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_FILE="$PROJECT_DIR/backup-migration-$(date +%Y%m%d-%H%M%S).json"

echo "═══════════════════════════════════════════"
echo "  🔥 Migração Firestore"
echo "═══════════════════════════════════════════"
echo ""

# ─── Passo 1: Exportar do .env (origem) ──────────────────────
if [ ! -f "$PROJECT_DIR/.env" ]; then
  echo "❌ .env não encontrado (projeto origem)"
  exit 1
fi

echo "📤 Passo 1/2 — Exportando do projeto ORIGEM (.env)..."
echo ""

set -a
source "$PROJECT_DIR/.env"
set +a

npx tsx "$SCRIPT_DIR/firestore-export.ts" "$BACKUP_FILE"

echo ""

# ─── Passo 2: Importar para .env.production (destino) ────────
if [ ! -f "$PROJECT_DIR/.env.production" ]; then
  echo ""
  echo "⚠️  .env.production não encontrado."
  echo "   O backup foi salvo em: $BACKUP_FILE"
  echo "   Para importar manualmente em outro projeto:"
  echo "   npm run firestore:import $BACKUP_FILE"
  echo ""
  exit 0
fi

echo "📥 Passo 2/2 — Importando para projeto DESTINO (.env.production)..."
echo ""

set -a
source "$PROJECT_DIR/.env.production"
set +a

npx tsx "$SCRIPT_DIR/firestore-import.ts" "$BACKUP_FILE" append

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Migração concluída!"
echo "  Backup: $BACKUP_FILE"
echo "═══════════════════════════════════════════"
