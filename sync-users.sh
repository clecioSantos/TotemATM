#!/bin/bash
# Script utilitário para rodar a sincronização de usuários

echo "----------------------------------------------------"
echo "🔍 NexOrder: Sincronizando Authentication -> Firestore"
echo "----------------------------------------------------"

npx ts-node scripts/sync-auth-users.ts