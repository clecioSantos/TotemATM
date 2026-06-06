import * as admin from 'firebase-admin';
import { logger } from './src/lib/logger';

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
    logger.info("FIREBASE_ADMIN_CONFIG", "Firebase Admin inicializado (applicationDefault)");
  }
} catch (error) {
  logger.error("FIREBASE_ADMIN_CONFIG", "Erro ao inicializar Firebase Admin (applicationDefault)", error);
  throw error;
}

export const getAdminDb = () => {
  try {
    return admin.firestore();
  } catch (error) {
    logger.error("FIREBASE_ADMIN_CONFIG", "Erro ao obter Firestore Admin", error);
    throw error;
  }
};

export const getAdminAuth = () => {
  try {
    return admin.auth();
  } catch (error) {
    logger.error("FIREBASE_ADMIN_CONFIG", "Erro ao obter Auth Admin", error);
    throw error;
  }
};
