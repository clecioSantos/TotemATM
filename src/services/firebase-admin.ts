import admin from "firebase-admin";
import { logger } from "../lib/logger";

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    logger.info("FIREBASE_ADMIN", "Firebase Admin já inicializado");
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  logger.info("FIREBASE_ADMIN", "Inicializando Firebase Admin", {
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    projectId,
    nodeEnv: process.env.NODE_ENV,
  });

  const missing: string[] = [];
  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

  if (missing.length > 0) {
    const errorMsg = `Variáveis Firebase ausentes: ${missing.join(", ")}`;
    logger.error("FIREBASE_ADMIN", errorMsg);
    throw new Error(errorMsg);
  }

  let formattedPrivateKey = privateKey;
  formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/\\\\n/g, '\n')
    ?.replace(/\\n/g, '\n')
    ?.replace(/\r/g, '')
    ?.trim();

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    logger.info("FIREBASE_ADMIN", "Firebase Admin inicializado com sucesso");
  } catch (error) {
    logger.error("FIREBASE_ADMIN", "Erro ao inicializar Firebase Admin", error, {
      projectId,
      clientEmail,
    });
    throw error;
  }
}

export function getAdminAuth() {
  try {
    initializeFirebaseAdmin();
    return admin.auth();
  } catch (error) {
    logger.error("FIREBASE_ADMIN", "Erro ao obter Admin Auth", error);
    throw error;
  }
}

export function getAdminDb() {
  try {
    initializeFirebaseAdmin();
    return admin.firestore();
  } catch (error) {
    logger.error("FIREBASE_ADMIN", "Erro ao obter Admin Firestore", error);
    throw error;
  }
}

export function getAdminMessaging() {
  try {
    initializeFirebaseAdmin();
    return admin.messaging();
  } catch (error) {
    logger.error("FIREBASE_ADMIN", "Erro ao obter Admin Messaging", error);
    throw error;
  }
}

export async function setUserClaims(
  uid: string,
  role: string
): Promise<void> {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, { role });
    logger.info("FIREBASE_ADMIN", `Claims definidos para ${uid}: role=${role}`);
  } catch (error) {
    logger.error("FIREBASE_ADMIN", `Erro ao definir claims para ${uid}`, error);
    throw error;
  }
}
