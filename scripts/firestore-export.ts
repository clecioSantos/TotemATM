import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { serializeValue, SerializedValue } from "./firestore-serializer";

// Carregar variáveis de ambiente do .env
const scriptsDir = path.resolve(__dirname);
const rootDir = path.resolve(scriptsDir, "..");
const envPath = path.resolve(rootDir, ".env");
console.log(`📁 Diretório raiz: ${rootDir}`);
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

console.log(`🎯 Projeto origem: ${projectId || "não definido"}`);
console.log("");

if (!admin.apps.length) {
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId: projectId || "", clientEmail, privateKey }),
    });
  } else {
    admin.initializeApp({ projectId: projectId || "" });
  }
}

const db = admin.firestore();

interface BackupDocument {
  id: string;
  path: string;
  data: Record<string, SerializedValue>;
  subcollections: BackupCollection[];
}

interface BackupCollection {
  name: string;
  documents: BackupDocument[];
}

interface BackupData {
  version: number;
  exportedAt: string;
  sourceProject: string;
  stats: {
    collections: number;
    documents: number;
    subcollections: number;
    totalDocuments: number;
    sizeBytes: number;
    durationMs: number;
  };
  collections: BackupCollection[];
}

async function listSubCollections(docRef: FirebaseFirestore.DocumentReference): Promise<string[]> {
  const snap = await docRef.listCollections();
  return snap.map((col) => col.id);
}

async function exportDocuments(
  colRef: FirebaseFirestore.CollectionReference,
  collectionPath: string
): Promise<BackupCollection> {
  const snapshot = await colRef.get();
  const documents: BackupDocument[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const serializedData: Record<string, SerializedValue> = {};
    for (const key of Object.keys(data)) {
      serializedData[key] = serializeValue(data[key]);
    }

    const docEntry: BackupDocument = {
      id: doc.id,
      path: doc.ref.path,
      data: serializedData,
      subcollections: [],
    };

    // Export subcollections recursively
    const subcolIds = await listSubCollections(doc.ref);
    for (const subcolId of subcolIds) {
      const subColRef = doc.ref.collection(subcolId);
      const subBackup = await exportDocuments(subColRef, `${collectionPath}/${doc.id}/${subcolId}`);
      docEntry.subcollections.push(subBackup);
    }

    documents.push(docEntry);

    if (documents.length % 50 === 0) {
      process.stdout.write(`\r   📄 ${documents.length} documentos em "${collectionPath}"...`);
    }
  }

  return { name: collectionPath.split("/").pop() || "", documents };
}

async function main() {
  const startTime = Date.now();
  const outputPath = process.argv[2] || `./backup-${projectId}-${Date.now()}.json`;
  const backupPath = path.resolve(outputPath);

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔥 Firestore Export Tool");
  console.log(`  Projeto: ${projectId}`);
  console.log(`  Destino: ${backupPath}`);
  console.log("═══════════════════════════════════════════\n");

  // Listar todas as coleções raiz
  const allCollections = await db.listCollections();
  const rootColIds = allCollections.map((col) => col.id);

  console.log(`📂 Encontradas ${rootColIds.length} coleções raiz:\n`);
  for (const name of rootColIds) {
    console.log(`   ─ ${name}`);
  }
  console.log("");

  const collections: BackupCollection[] = [];
  let totalDocs = 0;

  for (let i = 0; i < rootColIds.length; i++) {
    const colId = rootColIds[i];
    console.log(`[${i + 1}/${rootColIds.length}] Exportando "${colId}"...`);

    const colRef = db.collection(colId);
    const backupCol = await exportDocuments(colRef, colId);

    collections.push(backupCol);
    totalDocs += backupCol.documents.length;

    console.log(`\r   ✅ ${backupCol.documents.length} documentos exportados`);
    console.log("");
  }

  // Contar subcoleções e docs
  let subcolCount = 0;
  let totalAllDocs = 0;

  function countDocs(cols: BackupCollection[]): void {
    for (const col of cols) {
      for (const doc of col.documents) {
        totalAllDocs++;
        if (doc.subcollections.length > 0) {
          subcolCount += doc.subcollections.length;
          countDocs(doc.subcollections);
        }
      }
    }
  }
  countDocs(collections);

  const backupData: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceProject: projectId || "",
    stats: {
      collections: rootColIds.length,
      documents: totalDocs,
      subcollections: subcolCount,
      totalDocuments: totalAllDocs,
      sizeBytes: 0,
      durationMs: Date.now() - startTime,
    },
    collections,
  };

  const json = JSON.stringify(backupData, null, 2);
  backupData.stats.sizeBytes = Buffer.byteLength(json, "utf-8");

  fs.writeFileSync(backupPath, json);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("═══════════════════════════════════════════");
  console.log("  ✅ Exportação concluída!");
  console.log("");
  console.log(`  📁 Arquivo:     ${backupPath}`);
  console.log(`  📂 Coleções:     ${rootColIds.length}`);
  console.log(`  📄 Documentos:   ${totalDocs}`);
  console.log(`  📁 Subcoleções:  ${subcolCount}`);
  console.log(`  📦 Total docs:   ${totalAllDocs}`);
  console.log(`  💾 Tamanho:      ${(backupData.stats.sizeBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  ⏱️  Duração:     ${elapsed}s`);
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Erro durante exportação:", err);
  process.exit(1);
});
