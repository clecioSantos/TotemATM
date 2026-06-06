import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { logger } from "@/src/lib/logger";

const firebaseConfig = {
  apiKey: "AIzaSyC5yiYZsQbhWYPzNAKYFEpjzeT3Yl41Org",
  authDomain: "totenatm.firebaseapp.com",
  projectId: "totenatm",
  storageBucket: "totenatm.firebasestorage.app",
  messagingSenderId: "919273037092",
  appId: "1:919273037092:web:1f9fa90c131f253f4aa7b1",
  measurementId: "G-Z7H89MQCTL",
};

let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  logger.info("TOTEM_FIREBASE", "Firebase Client SDK inicializado (totem)");
} catch (error) {
  logger.error("TOTEM_FIREBASE", "Erro ao inicializar Firebase Client SDK (totem)", error);
  throw error;
}

export const db = getFirestore(app);
export const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    logger.warn("TOTEM_FIREBASE", "Erro ao inicializar Analytics (totem)", error);
  }
}
export { analytics };
