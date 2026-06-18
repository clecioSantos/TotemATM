import {
  Timestamp,
  GeoPoint,
  DocumentReference,
} from "firebase-admin/firestore";

export type SerializedValue =
  | { __type: "timestamp"; seconds: number; nanoseconds: number }
  | { __type: "geopoint"; latitude: number; longitude: number }
  | { __type: "reference"; path: string }
  | { __type: "date"; value: string }
  | any;

export function serializeValue(value: any): SerializedValue {
  if (value === null || value === undefined) return value;

  if (value instanceof Timestamp) {
    return { __type: "timestamp", seconds: value.seconds, nanoseconds: value.nanoseconds };
  }

  if (value instanceof GeoPoint) {
    return { __type: "geopoint", latitude: value.latitude, longitude: value.longitude };
  }

  if (value instanceof Date) {
    return { __type: "date", value: value.toISOString() };
  }

  if (typeof value === "object" && value.constructor?.name === "DocumentReference") {
    const ref = value as DocumentReference;
    return { __type: "reference", path: ref.path };
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = serializeValue(value[key]);
    }
    return result;
  }

  return value;
}

export function deserializeValue(value: any, db: FirebaseFirestore.Firestore): any {
  if (value === null || value === undefined) return value;

  if (value && typeof value === "object" && value.__type) {
    switch (value.__type) {
      case "timestamp":
        return new Timestamp(value.seconds, value.nanoseconds);
      case "geopoint":
        return new GeoPoint(value.latitude, value.longitude);
      case "reference":
        return db.doc(value.path);
      case "date":
        return new Date(value.value);
    }
  }

  if (Array.isArray(value)) {
    return value.map((v) => deserializeValue(v, db));
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
      result[key] = deserializeValue(value[key], db);
    }
    return result;
  }

  return value;
}

export function validateBackupStructure(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Arquivo JSON inválido ou vazio" };
  }

  if (!data.version) {
    return { valid: false, error: "Campo 'version' ausente no backup" };
  }

  if (!data.collections || !Array.isArray(data.collections)) {
    return { valid: false, error: "Campo 'collections' deve ser um array" };
  }

  for (let i = 0; i < data.collections.length; i++) {
    const col = data.collections[i];
    if (!col.name || typeof col.name !== "string") {
      return { valid: false, error: `Collection na posição ${i} sem 'name' válido` };
    }
    if (!col.documents || !Array.isArray(col.documents)) {
      return { valid: false, error: `Collection '${col.name}' sem 'documents' (array)` };
    }
    for (let j = 0; j < col.documents.length; j++) {
      const doc = col.documents[j];
      if (!doc.id || typeof doc.id !== "string") {
        return { valid: false, error: `Documento na collection '${col.name}'[${j}] sem 'id'` };
      }
      if (doc.data === undefined || doc.data === null) {
        return { valid: false, error: `Documento '${doc.id}' em '${col.name}' sem 'data'` };
      }
    }
  }

  return { valid: true };
}
