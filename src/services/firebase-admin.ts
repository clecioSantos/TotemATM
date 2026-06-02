import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length) return;

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

  // Limpeza profunda da chave privada
  let formattedPrivateKey = privateKey
    .replace(/\\n/g, "\n")           // Converte strings "\n" literais em quebras de linha reais
    .replace(/\\r/g, "\r")           // Converte strings "\r" literais
    .replace(/^["']|["']$/g, "")     // Remove aspas extras no início e fim (comum no Hostinger)
    .trim();

  // Caso a Hostinger tenha removido todas as quebras de linha ao salvar a variável,
  // o PEM falhará. Tentamos garantir que os delimitadores BEGIN e END estejam em linhas próprias.
  if (formattedPrivateKey && !formattedPrivateKey.includes("\n") && formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    formattedPrivateKey = formattedPrivateKey
      .replace("-----BEGIN PRIVATE KEY-----", "-----BEGIN PRIVATE KEY-----\n")
      .replace("-----END PRIVATE KEY-----", "\n-----END PRIVATE KEY-----");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
  });
}

export function getAdminAuth() {
  initializeFirebaseAdmin();
  return admin.auth();
}

export async function setUserClaims(uid: string, role: string) {
  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, { role });
}

export function getAdminDb() {
  initializeFirebaseAdmin();
  return admin.firestore();
}
