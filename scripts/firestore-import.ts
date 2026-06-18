import * as admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { deserializeValue, validateBackupStructure, SerializedValue } from "./firestore-serializer";

// Carregar .env.production se existir, senão .env
const scriptsDir = path.resolve(__dirname);
const rootDir = path.resolve(scriptsDir, "..");
const envProdPath = path.resolve(rootDir, ".env.production");
const envPath = path.resolve(rootDir, ".env");

console.log(`📁 Diretório raiz: ${rootDir}`);
console.log(`🔍 Procurando: ${envProdPath}`);
console.log(`🔍 Procurando: ${envPath}`);
console.log(`📄 .env.production existe? ${fs.existsSync(envProdPath)}`);

let loadedFile = "nenhum";
if (fs.existsSync(envProdPath)) {
  dotenv.config({ path: envProdPath, override: true });
  loadedFile = ".env.production";
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: true });
  loadedFile = ".env";
}

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

console.log(`📂 Env carregado: ${loadedFile}`);
console.log(`🎯 Projeto destino: ${projectId || "não definido"}`);
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
  data: Record<string, any>;
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
  stats: { collections: number; documents: number; subcollections: number; totalDocuments: number; sizeBytes: number; durationMs: number };
  collections: BackupCollection[];
}

const BATCH_SIZE = 500;
const MODE = (process.argv[3] || "append").toLowerCase();
const DRY_RUN = process.argv.includes("--dry-run");

async function importDocuments(col: BackupCollection, parentDoc?: admin.firestore.DocumentReference): Promise<{ docs: number; subs: number }> {
  let docsImported = 0;
  let subsImported = 0;

  const colRef = parentDoc ? parentDoc.collection(col.name) : db.collection(col.name);

  for (let i = 0; i < col.documents.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = col.documents.slice(i, i + BATCH_SIZE);

    for (const docEntry of chunk) {
      const docRef = colRef.doc(docEntry.id);
      const data = deserializeValue(docEntry.data, db);

      if (DRY_RUN) {
        docsImported++;
        continue;
      }

      if (MODE === "overwrite") {
        batch.set(docRef, data, { merge: false });
      } else {
        // append — merge suave, só adiciona/altera campos, não remove existentes
        batch.set(docRef, data, { merge: true });
      }
    }

    if (!DRY_RUN) {
      await batch.commit();
    }
    docsImported += chunk.length;

    const progress = Math.min(100, Math.round((i + chunk.length) / col.documents.length * 100));
    process.stdout.write(`\r   📄 ${docsImported}/${col.documents.length} documentos (${progress}%)`);
  }

  // Importar subcoleções
  for (const docEntry of col.documents) {
    if (docEntry.subcollections.length > 0) {
      for (const subcol of docEntry.subcollections) {
        const docRef = colRef.doc(docEntry.id);
        const subResult = await importDocuments(subcol, docRef);
        subsImported += subResult.docs + subResult.subs;
      }
    }
  }

  return { docs: docsImported, subs: subsImported };
}

async function main() {
  const startTime = Date.now();
  const inputArg = process.argv[2];

  if (!inputArg) {
    console.error("\n❌ Uso: npx tsx scripts/firestore-import.ts <arquivo.json> [append|overwrite] [--dry-run]");
    console.error("   Ex: npx tsx scripts/firestore-import.ts ./backup.json overwrite");
    console.error("   Ex: npx tsx scripts/firestore-import.ts ./backup.json append --dry-run\n");
    process.exit(1);
  }

  const inputPath = path.resolve(inputArg);

  if (!fs.existsSync(inputPath)) {
    console.error(`\n❌ Arquivo não encontrado: ${inputPath}\n`);
    process.exit(1);
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔥 Firestore Import Tool");
  console.log(`  Projeto destino: ${projectId}`);
  console.log(`  Arquivo:         ${inputPath}`);
  console.log(`  Modo:            ${DRY_RUN ? "DRY RUN" : MODE}`);
  console.log("═══════════════════════════════════════════\n");

  // Validar estrutura
  console.log("🔍 Validando arquivo de backup...");
  let raw: string;
  try {
    raw = fs.readFileSync(inputPath, "utf-8");
  } catch {
    console.error("❌ Erro ao ler arquivo");
    process.exit(1);
  }

  let backupData: BackupData;
  try {
    backupData = JSON.parse(raw);
  } catch {
    console.error("❌ JSON inválido");
    process.exit(1);
  }

  const validation = validateBackupStructure(backupData);
  if (!validation.valid) {
    console.error(`❌ Estrutura inválida: ${validation.error}`);
    process.exit(1);
  }

  console.log(`   ✅ Backup v${backupData.version} — ${backupData.sourceProject}`);
  console.log(`   📦 ${backupData.stats.totalDocuments} documentos em ${backupData.collections.length} coleções`);
  console.log(`   📅 Exportado em: ${backupData.exportedAt}\n`);

  if (!DRY_RUN && MODE === "overwrite") {
    console.log("⚠️  ATENÇÃO: Modo OVERWRITE — documentos existentes serão substituídos!");
    console.log("   Pressione Ctrl+C para cancelar ou aguarde 5s para continuar...\n");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  let totalDocs = 0;
  let totalSubs = 0;

  for (let i = 0; i < backupData.collections.length; i++) {
    const col = backupData.collections[i];
    console.log(`[${i + 1}/${backupData.collections.length}] Importando "${col.name}"...`);

    const result = await importDocuments(col);
    totalDocs += result.docs;
    totalSubs += result.subs;

    console.log(`\r   ✅ ${result.docs} documentos importados`);
    console.log("");
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  if (DRY_RUN) {
    console.log("═══════════════════════════════════════════");
    console.log("  🏁 DRY RUN — Nenhum dado foi escrito!");
    console.log(`  Seriam importados: ${totalDocs} documentos`);
    console.log("═══════════════════════════════════════════\n");
    return;
  }

  console.log("═══════════════════════════════════════════");
  console.log("  ✅ Importação concluída!");
  console.log("");
  console.log(`  📄 Documentos:     ${totalDocs}`);
  console.log(`  📁 Subcoleções:    ${totalSubs}`);
  console.log(`  ⏱️  Duração:       ${elapsed}s`);
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Erro durante importação:", err);
  process.exit(1);
});
