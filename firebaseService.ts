import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { logger } from "./src/lib/logger";

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
  logger.info("FIREBASE_SERVICE", "Firebase Client SDK inicializado (hardcoded)");
} catch (error) {
  logger.error("FIREBASE_SERVICE", "Erro ao inicializar Firebase Client SDK (hardcoded)", error);
  throw error;
}

export const firestore = getFirestore(app);
export const auth = getAuth(app);

let analytics;
if (typeof window !== "undefined") {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    logger.warn("FIREBASE_SERVICE", "Erro ao inicializar Analytics (hardcoded)", error);
  }
}
export { analytics };
