/**
 * Script para sincronizar usuários do Firebase Auth com a coleção 'users' do Firestore.
 * Identifica usuários que existem no Auth mas não possuem perfil no banco de dados.
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config(); 

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
console.log(privateKey);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey,
    })
  });
}

const db = admin.firestore();
const auth = admin.auth();

async function syncMissingUsers() {
  console.log('🚀 Iniciando busca por usuários órfãos no Firebase Auth...');
  let createdCount = 0;

  const processUsers = async (nextPageToken?: string) => {
    const result = await auth.listUsers(1000, nextPageToken);
    
    for (const userRecord of result.users) {
      const userDoc = await db.collection('users').doc(userRecord.uid).get();

      if (!userDoc.exists) {
        console.log(`+ Criando perfil para: ${userRecord.email || userRecord.uid}`);
        
        await db.collection('users').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userRecord.email || '',
          name: userRecord.displayName || 'Usuário Importado',
          role: 'client', // Role padrão
          companyId: 'default',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        createdCount++;
      }
    }

    if (result.pageToken) {
      await processUsers(result.pageToken);
    }
  };

  await processUsers();
  console.log(`\n✨ Sincronização concluída! ${createdCount} novos documentos criados no Firestore.`);
  process.exit(0);
}

syncMissingUsers().catch(err => {
  console.error('❌ Erro durante a sincronização:', err);
  process.exit(1);
});