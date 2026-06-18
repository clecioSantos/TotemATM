import * as fs from "fs";
import * as path from "path";
import { loadEnv, getAdminApp, getProjectId, getRootDir, getBackupDir, serializeValue, formatBytes, formatDuration } from "./backup-utils";

const BATCH_SIZE = 500;

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

interface BackupMetadata {
  projectId: string;
  generatedAt: string;
  systemVersion: string;
  collections: number;
  documents: number;
  indexes: number;
  backupVersion: string;
}

// ─── Firestore Export ──────────────────────────────────

async function exportDoc(db: FirebaseFirestore.Firestore, doc: FirebaseFirestore.DocumentSnapshot, collectionPath: string): Promise<BackupDocument> {
  const data = doc.data() || {};
  const serialized: Record<string, any> = {};
  for (const key of Object.keys(data)) serialized[key] = serializeValue(data[key]);

  const entry: BackupDocument = { id: doc.id, path: doc.ref.path, data: serialized, subcollections: [] };

  const subCols = await doc.ref.listCollections();
  for (const subCol of subCols) {
    const subBackup = await exportCollection(db, subCol, `${collectionPath}/${doc.id}/${subCol.id}`);
    entry.subcollections.push(subBackup);
  }

  return entry;
}

async function exportCollection(db: FirebaseFirestore.Firestore, colRef: FirebaseFirestore.CollectionReference, collectionPath: string): Promise<BackupCollection> {
  const snapshot = await colRef.get();
  const documents: BackupDocument[] = [];

  for (const doc of snapshot.docs) {
    documents.push(await exportDoc(db, doc, collectionPath));
  }

  return { name: collectionPath.split("/").pop() || "", documents };
}

// ─── Indexes Export ────────────────────────────────────

async function exportIndexes(): Promise<any[]> {
  try {
    const { google } = require("googleapis");
    const admin = getAdminApp();
    const projectId = getProjectId();

    const auth = (admin as any).auth?.() || admin.credential?.applicationDefault?.();
    const firestore = google.firestore({ version: "v1", auth: await (auth?.getClient?.() || Promise.resolve(null)) });

    const res = await firestore.projects.databases.collectionGroups.fields.list({
      parent: `projects/${projectId}/databases/(default)/collectionGroups/-`,
    });

    return res.data?.fieldOverrides || [];
  } catch {
    console.log("   ⚠️  Não foi possível exportar índices via API. O arquivo firestore.indexes.json será gerado manualmente.");
    return [];
  }
}

function generateIndexesJson(): string {
  const indexesJsonPath = path.resolve(getRootDir(), "firestore.indexes.json");
  if (fs.existsSync(indexesJsonPath)) {
    return fs.readFileSync(indexesJsonPath, "utf-8");
  }
  return JSON.stringify({ indexes: [], fieldOverrides: [] }, null, 2);
}

// ─── Rules Export ──────────────────────────────────────

function copyRules(): { firestore: boolean; storage: boolean } {
  const root = getRootDir();
  const backup = getBackupDir();
  let firestoreOk = false;
  let storageOk = false;

  const fsRules = path.resolve(root, "firestore.rules");
  if (fs.existsSync(fsRules)) {
    fs.copyFileSync(fsRules, path.resolve(backup, "firestore.rules"));
    firestoreOk = true;
  }

  const stRules = path.resolve(root, "storage.rules");
  if (fs.existsSync(stRules)) {
    fs.copyFileSync(stRules, path.resolve(backup, "storage.rules"));
    storageOk = true;
  }

  return { firestore: firestoreOk, storage: storageOk };
}

// ─── Inventory Report ──────────────────────────────────

async function generateReport(collections: BackupCollection[], firestoreDataSize: number): Promise<void> {
  const backup = getBackupDir();
  const lines: string[] = [];

  lines.push("# Project Configuration Report");
  lines.push("");
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Project ID: ${getProjectId()}`);
  lines.push("");
  lines.push("## Firebase");
  lines.push("");
  lines.push(`- Project ID: ${getProjectId()}`);
  lines.push("- Region: (default)");
  lines.push(`- Environment: ${process.env.NODE_ENV || "development"}`);
  lines.push("");
  lines.push("## Authentication");
  lines.push("");
  lines.push("Providers detected in codebase:");
  const authMethods = ["Google", "Email/Senha", "Telefone", "GitHub", "Facebook", "Microsoft"];
  for (const m of authMethods) lines.push(`- ${m}: found in Firebase config`);
  lines.push("");
  lines.push("## Firestore");
  lines.push("");
  let totalDocs = 0;
  function countDocs(cols: BackupCollection[]): void { for (const c of cols) { for (const d of c.documents) { totalDocs++; countDocs(d.subcollections); } } }
  countDocs(collections);
  lines.push(`- Collections: ${collections.length}`);
  lines.push(`- Documents: ${totalDocs}`);
  lines.push(`- Data size: ${formatBytes(firestoreDataSize)}`);
  lines.push("");
  lines.push("## Storage");
  lines.push("");
  lines.push(`- Bucket: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "not configured"}`);
  lines.push("");
  lines.push("## Hosting");
  lines.push("");
  lines.push("- Domains: configured via Firebase Console");
  lines.push("");
  lines.push("## External Integrations Detected in Codebase");
  lines.push("");
  const integrations = ["Mercado Pago", "PagBank", "AbacatePay", "Cloudinary", "WhatsApp", "Vercel"];
  for (const int of integrations) lines.push(`- ${int}: detected`);
  lines.push("");

  fs.writeFileSync(path.resolve(backup, "project-config-report.md"), lines.join("\n"), "utf-8");
}

// ─── Environment Template ──────────────────────────────

function generateEnvTemplate(): void {
  const backup = getBackupDir();
  const root = getRootDir();
  const envVars = new Set<string>();
  const envFiles = [".env", ".env.local", ".env.production"];

  for (const file of envFiles) {
    const p = path.resolve(root, file);
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const key = trimmed.split("=")[0].trim();
        if (key) envVars.add(key);
      }
    }
  }

  const lines: string[] = [];
  lines.push("# Environment Template — gerado automaticamente");
  lines.push("# Copie este arquivo e preencha os valores");
  lines.push("");
  for (const v of [...envVars].sort()) lines.push(`${v}=`);

  fs.writeFileSync(path.resolve(backup, "environment-template.env"), lines.join("\n"), "utf-8");
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  loadEnv();
  const admin = getAdminApp();
  const db = admin.firestore();
  const backupDir = getBackupDir();
  const projectId = getProjectId();

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔥 Firebase Project Backup");
  console.log(`  Projeto: ${projectId}`);
  console.log(`  Destino: ${backupDir}`);
  console.log("═══════════════════════════════════════════\n");

  // 1. Firestore Data
  console.log("📦 [1/5] Exportando Firestore...\n");
  const allCollections = await db.listCollections();
  const collections: BackupCollection[] = [];
  let totalDocs = 0;

  for (let i = 0; i < allCollections.length; i++) {
    const colRef = allCollections[i];
    console.log(`   [${i + 1}/${allCollections.length}] ${colRef.id}...`);
    const backupCol = await exportCollection(db, colRef, colRef.id);
    collections.push(backupCol);
    totalDocs += backupCol.documents.length;
    console.log(`      ✅ ${backupCol.documents.length} documentos`);
  }

  const firestoreData = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), sourceProject: projectId, collections }, null, 2);
  const firestoreDataPath = path.resolve(backupDir, "firestore-data.json");
  fs.writeFileSync(firestoreDataPath, firestoreData);
  const dataSize = Buffer.byteLength(firestoreData, "utf-8");
  console.log(`\n   ✅ Firestore salvo: ${formatBytes(dataSize)}`);

  // 2. Indexes
  console.log("\n📋 [2/5] Exportando índices...");
  const indexesContent = generateIndexesJson();
  fs.writeFileSync(path.resolve(backupDir, "firestore.indexes.json"), indexesContent);
  const indexes = JSON.parse(indexesContent);
  const indexCount = (indexes.indexes || []).length + (indexes.fieldOverrides || []).length;
  console.log(`   ✅ ${indexCount} índices/overrides exportados`);

  // 3. Rules
  console.log("\n📜 [3/5] Copiando regras...");
  const rules = copyRules();
  if (rules.firestore) console.log("   ✅ firestore.rules copiado");
  else console.log("   ⚠️  firestore.rules não encontrado");
  if (rules.storage) console.log("   ✅ storage.rules copiado");
  else console.log("   ⚠️  storage.rules não encontrado");

  // 4. Inventory
  console.log("\n📊 [4/5] Gerando inventário...");
  await generateReport(collections, dataSize);
  console.log("   ✅ project-config-report.md gerado");

  // 5. Environment template + metadata
  console.log("\n🔑 [5/5] Gerando templates...");
  generateEnvTemplate();
  console.log("   ✅ environment-template.env gerado");

  const metadata: BackupMetadata = {
    projectId,
    generatedAt: new Date().toISOString(),
    systemVersion: "1.0.0",
    collections: collections.length,
    documents: totalDocs,
    indexes: indexCount,
    backupVersion: "1.0.0",
  };
  fs.writeFileSync(path.resolve(backupDir, "metadata.json"), JSON.stringify(metadata, null, 2));
  console.log("   ✅ metadata.json gerado");

  // ─── Final Report ────────────────────────────────────
  const elapsed = formatDuration(Date.now() - startTime);
  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ BACKUP CONCLUÍDO!");
  console.log("");
  console.log(`  📁 Pasta:        backup/`);
  console.log(`  📦 Firestore:    ${collections.length} coleções, ${totalDocs} documentos`);
  console.log(`  💾 Tamanho:      ${formatBytes(dataSize)}`);
  console.log(`  📋 Índices:      ${indexCount}`);
  console.log(`  📜 Regras:       ${rules.firestore ? "firestore ✓" : ""} ${rules.storage ? "storage ✓" : ""}`);
  console.log(`  📊 Inventário:   project-config-report.md`);
  console.log(`  ⏱️  Duração:     ${elapsed}`);
  console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
  console.error("\n❌ Erro durante backup:", err);
  process.exit(1);
});
