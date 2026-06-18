import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";

// ─── Environment ────────────────────────────────────────

export function loadEnv(envFile?: string): void {
  const scriptsDir = path.resolve(__dirname);
  const rootDir = path.resolve(scriptsDir, "..");

  if (envFile) {
    const envPath = path.resolve(rootDir, envFile);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: true });
      console.log(`📂 Env carregado: ${envFile}`);
      return;
    }
  }

  const envProdPath = path.resolve(rootDir, ".env.production");
  const envPath = path.resolve(rootDir, ".env");
  if (fs.existsSync(envProdPath)) {
    dotenv.config({ path: envProdPath, override: true });
    console.log(`📂 Env carregado: .env.production`);
  } else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
    console.log(`📂 Env carregado: .env`);
  }
}

export function getAdminApp() {
  if (admin.apps.length) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId: projectId || "", clientEmail, privateKey }),
    });
  } else {
    admin.initializeApp({ projectId: projectId || "" });
  }
  return admin;
}

export function getProjectId(): string {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "unknown";
}

// ─── Paths ──────────────────────────────────────────────

export function getRootDir(): string {
  return path.resolve(__dirname, "..");
}

export function getBackupDir(): string {
  const dir = path.resolve(getRootDir(), "backup");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// ─── Firestore Serialization ────────────────────────────

import { Timestamp, GeoPoint, DocumentReference } from "firebase-admin/firestore";

export type SerializedValue =
  | { __type: "timestamp"; seconds: number; nanoseconds: number }
  | { __type: "geopoint"; latitude: number; longitude: number }
  | { __type: "reference"; path: string }
  | { __type: "date"; value: string }
  | any;

export function serializeValue(value: any): SerializedValue {
  if (value === null || value === undefined) return value;
  if (value instanceof Timestamp) return { __type: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds };
  if (value instanceof GeoPoint) return { __type: "geopoint", latitude: value.latitude, longitude: value.longitude };
  if (value instanceof Date) return { __type: "date", value: value.toISOString() };
  if (typeof value === "object" && value.constructor?.name === "DocumentReference") {
    return { __type: "reference", path: (value as DocumentReference).path };
  }
  if (Array.isArray(value)) return value.map(serializeValue);
  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) result[key] = serializeValue(value[key]);
    return result;
  }
  return value;
}

export function deserializeValue(value: any, db: FirebaseFirestore.Firestore): any {
  if (value === null || value === undefined) return value;
  if (value && typeof value === "object" && value.__type) {
    switch (value.__type) {
      case "timestamp": return new Timestamp(value.seconds, value.nanoseconds);
      case "geopoint": return new GeoPoint(value.latitude, value.longitude);
      case "reference": return db.doc(value.path);
      case "date": return new Date(value.value);
    }
  }
  if (Array.isArray(value)) return value.map((v) => deserializeValue(v, db));
  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) result[key] = deserializeValue(value[key], db);
    return result;
  }
  return value;
}

export function validateBackupStructure(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") return { valid: false, error: "JSON inválido ou vazio" };
  if (!data.version) return { valid: false, error: "Campo 'version' ausente" };
  if (!data.collections || !Array.isArray(data.collections)) return { valid: false, error: "Campo 'collections' deve ser um array" };
  for (let i = 0; i < data.collections.length; i++) {
    const col = data.collections[i];
    if (!col.name || typeof col.name !== "string") return { valid: false, error: `Collection [${i}] sem 'name'` };
    if (!col.documents || !Array.isArray(col.documents)) return { valid: false, error: `Collection '${col.name}' sem 'documents'` };
    for (let j = 0; j < col.documents.length; j++) {
      const doc = col.documents[j];
      if (!doc.id) return { valid: false, error: `Documento em '${col.name}'[${j}] sem 'id'` };
      if (doc.data === undefined) return { valid: false, error: `Documento '${doc.id}' sem 'data'` };
    }
  }
  return { valid: true };
}

// ─── Helpers ────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function formatDuration(ms: number): string {
  const s = (ms / 1000).toFixed(1);
  if (ms < 60000) return `${s}s`;
  return `${Math.floor(ms / 60000)}m ${((ms % 60000) / 1000).toFixed(0)}s`;
}
