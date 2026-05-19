/**
 * Script para corrigir URLs de imagens antigas no Firestore
 * Remove localhost:3010 e deixa apenas o caminho relativo
 * 
 * Execute uma vez para migrar dados antigos:
 * npx ts-node scripts/fix-image-urls.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

// Configure seu Firebase
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixImageUrls() {
  console.log('🔄 Iniciando migração de URLs de imagens...\n');

  try {
    // Buscar todos os produtos com imageUrl que contenha localhost
    const productsRef = collection(db, 'products');
    const q = query(productsRef);
    const snapshot = await getDocs(q);

    let updatedCount = 0;

    for (const docSnapshot of snapshot.docs) {
      const data = docSnapshot.data();
      
      if (data.imageUrl && data.imageUrl.includes('localhost:3010')) {
        // Extrair apenas o caminho relativo
        const newUrl = data.imageUrl.split('localhost:3010').pop() || data.imageUrl;
        
        await updateDoc(doc(db, 'products', docSnapshot.id), {
          imageUrl: newUrl,
        });

        console.log(`✅ ${data.name}: ${data.imageUrl} → ${newUrl}`);
        updatedCount++;
      }
    }

    console.log(`\n✨ Migração concluída! ${updatedCount} produtos atualizados.`);
  } catch (error) {
    console.error('❌ Erro durante migração:', error);
  }

  process.exit(0);
}

fixImageUrls();
