import { initializeApp, getApps, FirebaseError } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { logger } from "../lib/logger";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const missingVars = Object.entries(firebaseConfig)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  logger.error(
    "FIREBASE_CLIENT",
    `Variáveis de ambiente Firebase ausentes: ${missingVars.join(", ")}`
  );
}

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  logger.info("FIREBASE_CLIENT", "Firebase Client SDK inicializado");
} catch (error) {
  const msg = error instanceof FirebaseError
    ? `Firebase error (${error.code}): ${error.message}`
    : error instanceof Error
    ? error.message
    : String(error);
  logger.error("FIREBASE_CLIENT", `Erro ao inicializar Firebase Client: ${msg}`, error);
  throw error;
}

export const firestore = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
    logger.info("FIREBASE_CLIENT", "Analytics inicializado");
  } catch (error) {
    logger.warn("FIREBASE_CLIENT", "Erro ao inicializar Analytics", error);
  }
}
export { analytics };

export { FirebaseError };
