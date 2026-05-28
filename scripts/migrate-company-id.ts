/**
 * Script para vincular todos os registros existentes a uma empresa específica.
 * Útil para migrar dados legados após a implementação da lógica multi-empresa.
 * 
 * Para executar:
 * 1. Certifique-se de que as variáveis de ambiente estão no seu terminal ou arquivo .env
 * 2. Execute: npx ts-node scripts/migrate-company-id.ts
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); // Fallback para .env

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length) {
  if (!projectId) {
    console.error("❌ Erro: FIREBASE_PROJECT_ID não encontrado no ambiente.");
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey?.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

const TARGET_COMPANY_ID = "YHC7bygHq1cqxPeIF8Ob";
const COLLECTIONS_TO_UPDATE = ['products', 'condiments', 'orders', 'categories'];

async function migrateCollections() {
  console.log(`🚀 Iniciando migração para o companyId: ${TARGET_COMPANY_ID}\n`);

  for (const collectionName of COLLECTIONS_TO_UPDATE) {
    console.log(`📦 Processando coleção: ${collectionName}...`);
    
    try {
      const colRef = db.collection(collectionName);
      const snapshot = await colRef.get();
      
      if (snapshot.empty) {
        console.log(`   - Coleção vazia. Pulando.`);
        continue;
      }

      let count = 0;
      for (const docSnap of snapshot.docs) {
        await docSnap.ref.update({ 
          companyId: TARGET_COMPANY_ID 
        });
        
        count++;
      }

      console.log(`   ✅ ${count} documentos atualizados em '${collectionName}'.`);
    } catch (error) {
      console.error(`   ❌ Erro ao atualizar coleção '${collectionName}':`, error);
    }
  }

  console.log('\n✨ Migração concluída com sucesso!');
  process.exit(0);
}

migrateCollections();