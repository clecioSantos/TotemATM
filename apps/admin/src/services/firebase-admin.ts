import admin from "firebase-admin";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];
    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

    throw new Error(
      `❌ Firebase Admin SDK Error: Variáveis faltando: ${missing.join(", ")}. \n` +
      `Diretório Atual: ${process.cwd()} \n` +
      `Verifique se o arquivo apps/admin/.env.local existe e contém esses nomes EXATOS.`
    );
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: privateKey.includes("-----BEGIN") ? privateKey.replace(/\\n/g, "\n") : privateKey,
    }),
  }); 
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();