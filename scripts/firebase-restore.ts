import * as fs from "fs";
import * as path from "path";
import { loadEnv, getAdminApp, getProjectId, getRootDir, getBackupDir, deserializeValue, validateBackupStructure, formatDuration } from "./backup-utils";

const BATCH_SIZE = 500;
const MODE = (process.argv[3] || "append").toLowerCase();
const DRY_RUN = process.argv.includes("--dry-run");

interface BackupData {
  version: number;
  exportedAt: string;
  sourceProject: string;
  collections: any[];
}

// ─── Validation ────────────────────────────────────────

function validateBackupDir(backupDir: string): string[] {
  const required = ["firestore-data.json", "firestore.indexes.json", "firestore.rules", "metadata.json"];
  const missing: string[] = [];
  for (const file of required) {
    if (!fs.existsSync(path.resolve(backupDir, file))) {
      missing.push(file);
    }
  }
  return missing;
}

// ─── Firestore Restore ─────────────────────────────────

async function restoreCollection(db: FirebaseFirestore.Firestore, col: any, parentDoc?: FirebaseFirestore.DocumentReference): Promise<number> {
  let count = 0;
  const colRef = parentDoc ? parentDoc.collection(col.name) : db.collection(col.name);

  for (let i = 0; i < col.documents.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = col.documents.slice(i, i + BATCH_SIZE);

    for (const docEntry of chunk) {
      const docRef = colRef.doc(docEntry.id);
      const data = deserializeValue(docEntry.data, db);

      if (!DRY_RUN) {
        if (MODE === "overwrite") batch.set(docRef, data, { merge: false });
        else batch.set(docRef, data, { merge: true });
      }
      count++;
    }

    if (!DRY_RUN) await batch.commit();
    const progress = Math.min(100, Math.round((i + chunk.length) / col.documents.length * 100));
    process.stdout.write(`\r   📄 ${count}/${col.documents.length} (${progress}%)`);
  }

  // Subcoleções
  for (const docEntry of col.documents) {
    if (docEntry.subcollections?.length > 0) {
      for (const subcol of docEntry.subcollections) {
        const docRef = colRef.doc(docEntry.id);
        count += await restoreCollection(db, subcol, docRef);
      }
    }
  }

  return count;
}

// ─── Indexes Restore ───────────────────────────────────

async function restoreIndexes(backupDir: string): Promise<boolean> {
  const indexPath = path.resolve(backupDir, "firestore.indexes.json");
  if (!fs.existsSync(indexPath)) return false;

  const destPath = path.resolve(getRootDir(), "firestore.indexes.json");
  fs.copyFileSync(indexPath, destPath);
  console.log("   ✅ firestore.indexes.json copiado para a raiz do projeto");
  console.log("   ⚠️  Publique manualmente via: npx firebase deploy --only firestore:indexes");
  return true;
}

// ─── Rules Restore ─────────────────────────────────────

function restoreRules(backupDir: string): { firestore: boolean; storage: boolean } {
  const root = getRootDir();
  let fsOk = false;
  let stOk = false;

  const fsRules = path.resolve(backupDir, "firestore.rules");
  if (fs.existsSync(fsRules)) {
    fs.copyFileSync(fsRules, path.resolve(root, "firestore.rules"));
    fsOk = true;
  }

  const stRules = path.resolve(backupDir, "storage.rules");
  if (fs.existsSync(stRules)) {
    fs.copyFileSync(stRules, path.resolve(root, "storage.rules"));
    stOk = true;
  }

  return { firestore: fsOk, storage: stOk };
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const backupDirArg = process.argv[2];
  const backupDir = backupDirArg ? path.resolve(backupDirArg) : getBackupDir();

  if (!fs.existsSync(backupDir)) {
    console.error(`\n❌ Pasta de backup não encontrada: ${backupDir}\n`);
    process.exit(1);
  }

  loadEnv();
  const admin = getAdminApp();
  const db = admin.firestore();
  const projectId = getProjectId();

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔥 Firebase Project Restore");
  console.log(`  Projeto destino: ${projectId}`);
  console.log(`  Backup:          ${backupDir}`);
  console.log(`  Modo:            ${DRY_RUN ? "DRY RUN" : MODE}`);
  console.log("═══════════════════════════════════════════\n");

  // Validate
  console.log("🔍 Validando backup...");
  const metadataPath = path.resolve(backupDir, "metadata.json");
  if (fs.existsSync(metadataPath)) {
    const meta = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
    console.log(`   ✅ Backup v${meta.backupVersion} — ${meta.projectId}`);
    console.log(`   📦 ${meta.documents} documentos, ${meta.collections} coleções`);
    console.log(`   📅 ${meta.generatedAt}\n`);
  }

  // 1. Firestore Data
  console.log("📦 [1/3] Restaurando Firestore...\n");
  const dataPath = path.resolve(backupDir, "firestore-data.json");
  if (!fs.existsSync(dataPath)) {
    console.error("   ❌ firestore-data.json não encontrado");
    process.exit(1);
  }

  const raw = fs.readFileSync(dataPath, "utf-8");
  let backupData: BackupData;
  try { backupData = JSON.parse(raw); } catch {
    console.error("   ❌ JSON inválido em firestore-data.json");
    process.exit(1);
  }

  const validation = validateBackupStructure(backupData);
  if (!validation.valid) {
    console.error(`   ❌ Estrutura inválida: ${validation.error}`);
    process.exit(1);
  }

  if (!DRY_RUN && MODE === "overwrite") {
    console.log("⚠️  Modo OVERWRITE — documentos serão substituídos!");
    console.log("   Pressione Ctrl+C para cancelar ou aguarde 3s...\n");
    await new Promise((r) => setTimeout(r, 3000));
  }

  let totalDocs = 0;
  for (let i = 0; i < backupData.collections.length; i++) {
    const col = backupData.collections[i];
    console.log(`   [${i + 1}/${backupData.collections.length}] ${col.name}...`);
    const count = await restoreCollection(db, col);
    totalDocs += count;
    process.stdout.write(`\r   ✅ ${count} documentos restaurados\n`);
  }

  // 2. Indexes
  console.log("\n📋 [2/3] Restaurando índices...");
  await restoreIndexes(backupDir);

  // 3. Rules
  console.log("\n📜 [3/3] Restaurando regras...");
  const rules = restoreRules(backupDir);
  if (rules.firestore) console.log("   ✅ firestore.rules restaurado");
  if (rules.storage) console.log("   ✅ storage.rules restaurado");

  const elapsed = formatDuration(Date.now() - startTime);

  if (DRY_RUN) {
    console.log("\n═══════════════════════════════════════════");
    console.log("  🏁 DRY RUN — Nenhum dado foi alterado!");
    console.log(`  Seriam restaurados: ${totalDocs} documentos`);
    console.log("═══════════════════════════════════════════\n");
    return;
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  ✅ RESTORE CONCLUÍDO!");
  console.log("");
  console.log(`  📦 Documentos:  ${totalDocs}`);
  console.log(`  📋 Índices:     copiados (publicar via firebase deploy)`);
  console.log(`  📜 Regras:      ${rules.firestore ? "firestore ✓ " : ""}${rules.storage ? "storage ✓" : ""}`);
  console.log(`  ⏱️  Duração:    ${elapsed}`);
  console.log("═══════════════════════════════════════════\n");

  console.log("📌 ATENÇÃO — Itens que NÃO são restaurados automaticamente:");
  console.log("   • Provedores de autenticação (Google, Email, etc.)");
  console.log("   • Domínios autorizados");
  console.log("   • Configurações do Hosting");
  console.log("   • Variáveis de ambiente reais");
  console.log("   • Chaves/secrets de API (Mercado Pago, PagBank, etc.)");
  console.log("   • Índices (copiados, mas precisam ser publicados via Firebase CLI)");
  console.log("");
  console.log("   Para publicar índices: npx firebase deploy --only firestore:indexes");
  console.log("   Para publicar regras:  npx firebase deploy --only firestore:rules,storage:rules");
}

main().catch((err) => {
  console.error("\n❌ Erro durante restore:", err);
  process.exit(1);
});
