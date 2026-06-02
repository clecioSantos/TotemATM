import admin from "firebase-admin";

function initializeFirebaseAdmin() {
  if (admin.apps.length) {
    console.log("✅ Firebase Admin já inicializado");
    return;
  }

  console.log("========================================");
  console.log("🔥 Iniciando Firebase Admin");
  console.log("========================================");

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  console.log("📋 Variáveis encontradas:");
  console.log("PROJECT_ID:", projectId ? "✅ Sim" : "❌ Não");
  console.log("CLIENT_EMAIL:", clientEmail ? "✅ Sim" : "❌ Não");
  console.log("PRIVATE_KEY:", privateKey ? "✅ Sim" : "❌ Não");

  if (!projectId || !clientEmail || !privateKey) {
    const missing = [];

    if (!projectId) missing.push("FIREBASE_PROJECT_ID");
    if (!clientEmail) missing.push("FIREBASE_CLIENT_EMAIL");
    if (!privateKey) missing.push("FIREBASE_PRIVATE_KEY");

    throw new Error(
      `Variáveis ausentes: ${missing.join(", ")}`
    );
  }

  console.log("\n🔍 Analisando chave privada...");

  console.log("Tamanho original:", privateKey.length);

  console.log(
    "Primeiros 100 caracteres originais:\n",
    privateKey.substring(0, 100)
  );

  console.log(
    "Últimos 100 caracteres originais:\n",
    privateKey.substring(Math.max(0, privateKey.length - 100))
  );

  console.log(
    "Contém BEGIN PRIVATE KEY:",
    privateKey.includes("-----BEGIN PRIVATE KEY-----")
  );

  console.log(
    "Contém END PRIVATE KEY:",
    privateKey.includes("-----END PRIVATE KEY-----")
  );

  console.log(
    "Contém \\n literal:",
    privateKey.includes("\\n")
  );

  console.log(
    "Contém quebra de linha real:",
    privateKey.includes("\n")
  );

  let formattedPrivateKey = privateKey
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/^["']|["']$/g, "")
    .trim();

  console.log("\n🔧 Após formatação:");

  console.log("Tamanho:", formattedPrivateKey.length);

  console.log(
    "Contém BEGIN PRIVATE KEY:",
    formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")
  );

  console.log(
    "Contém END PRIVATE KEY:",
    formattedPrivateKey.includes("-----END PRIVATE KEY-----")
  );

  if (
    formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----") &&
    formattedPrivateKey.includes("-----END PRIVATE KEY-----")
  ) {
    formattedPrivateKey = formattedPrivateKey
      .replace(
        "-----BEGIN PRIVATE KEY-----",
        "-----BEGIN PRIVATE KEY-----\n"
      )
      .replace(
        "-----END PRIVATE KEY-----",
        "\n-----END PRIVATE KEY-----"
      );
  }

  console.log("\n📄 Preview da chave formatada:");

  const lines = formattedPrivateKey.split("\n");

  console.log("Quantidade de linhas:", lines.length);

  if (lines.length > 0) {
    console.log("Linha 1:", lines[0]);

    if (lines.length > 1) {
      console.log("Linha 2:", lines[1].substring(0, 50) + "...");
    }

    console.log(
      "Última linha:",
      lines[lines.length - 1]
    );
  }

  if (
    !formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----")
  ) {
    throw new Error(
      "❌ Chave inválida: BEGIN PRIVATE KEY não encontrado"
    );
  }

  if (
    !formattedPrivateKey.includes("-----END PRIVATE KEY-----")
  ) {
    throw new Error(
      "❌ Chave inválida: END PRIVATE KEY não encontrado"
    );
  }

  try {
    console.log("\n🚀 Chamando admin.initializeApp...");

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });

    console.log("✅ Firebase Admin inicializado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao inicializar Firebase Admin:");
    console.error(error);

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
) {
  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, { role });
}