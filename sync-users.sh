#!/bin/bash
# Script utilitário para rodar a sincronização de usuários

echo "----------------------------------------------------"
echo "🔍 Bora De Delivery: Sincronizando Authentication -> Firestore"
echo "----------------------------------------------------"

npx ts-node scripts/sync-auth-users.ts