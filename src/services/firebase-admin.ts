import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("🔥 Firebase Admin Initialization");

  console.log({
    hasProjectId: !!projectId,
    hasClientEmail: !!clientEmail,
    hasPrivateKey: !!privateKey,
    projectId,
    clientEmail,
    privateKeyLength: privateKey?.length || 0,
    cwd: process.cwd(),
    nodeEnv: process.env.NODE_ENV,
  });

  const missing: string[] = [];

  if (!projectId) missing.push("FIREBASE_PROJECT_ID");
  if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
  if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

  if (missing.length > 0) {
    throw new Error(
      `❌ Variáveis Firebase ausentes: ${missing.join(", ")}`
    );
  }

  let formattedPrivateKey = privateKey;

  // Corrige chaves armazenadas em uma única linha no .env
  formattedPrivateKey = process.env.FIREBASE_PRIVATE_KEY
  ?.replace(/\\\\n/g, '\n')
  ?.replace(/\\n/g, '\n')
  ?.replace(/\r/g, '')
  ?.trim();
  console.log("🔍 Private Key Diagnostics");
  console.log("BEGIN CHECK:", formattedPrivateKey?.substring(0, 50));
  console.log("END CHECK:", formattedPrivateKey?.substring(formattedPrivateKey.length - 50));
  console.log({
    startsWithBegin: formattedPrivateKey.includes(
      "-----BEGIN PRIVATE KEY-----"
    ),
    endsWithEnd: formattedPrivateKey.includes(
      "-----END PRIVATE KEY-----"
    ),
    lines: formattedPrivateKey.split("\n").length,
  });
console.log(
  privateKey
    ?.split('\n')
    .slice(0, 2)
);

console.log(
  privateKey
    ?.split('\n')
    .slice(-2)
);
console.log(
  JSON.stringify(
    process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50)
  )
);
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    console.log("✅ Firebase Admin inicializado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin");

    console.error({
      message: error instanceof Error ? error.message : error,
      projectId,
      clientEmail,
      privateKeyLength: formattedPrivateKey.length,
    });

    throw error;
  }
}

export function getAdminAuth() {
  initializeFirebaseAdmin();
  return admin.auth();
}

export function getAdminDb() {
  initializeFirebaseAdmin();
  return admin.firestore();
}

export async function setUserClaims(
  uid: string,
  role: string
): Promise<void> {
  try {
    const auth = getAdminAuth();
    await auth.setCustomUserClaims(uid, { role });
  } catch (error) {
    console.error(`🔥 Erro ao definir claims do usuário ${uid}:`, error);
    throw error;
  }
}