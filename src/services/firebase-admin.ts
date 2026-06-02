import admin from "firebase-admin";

let initialized = false;

function mask(value?: string, visible = 6): string {
  if (!value) return "(undefined)";
  if (value.length <= visible * 2) return "***";
  return `${value.slice(0, visible)}...${value.slice(-visible)}`;
}

function logEnvironmentDiagnostics() {
  console.log("🔥 Firebase Admin Diagnostics", {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    platform: process.platform,
    pid: process.pid,

    env: {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY,
    },

    values: {
      projectId: process.env.FIREBASE_PROJECT_ID || "(undefined)",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "(undefined)",
      privateKeyLength:
        process.env.FIREBASE_PRIVATE_KEY?.length ?? 0,
      privateKeyPreview: mask(
        process.env.FIREBASE_PRIVATE_KEY
      ),
    },
  });
}

function validateFirebaseConfig() {
  const missing: string[] = [];

  if (!process.env.FIREBASE_PROJECT_ID) {
    missing.push("FIREBASE_PROJECT_ID");
  }

  if (!process.env.FIREBASE_CLIENT_EMAIL) {
    missing.push("FIREBASE_CLIENT_EMAIL");
  }

  if (!process.env.FIREBASE_PRIVATE_KEY) {
    missing.push("FIREBASE_PRIVATE_KEY");
  }

  if (missing.length > 0) {
    throw new Error(
      [
        "❌ Firebase Admin SDK configuration error",
        `Missing variables: ${missing.join(", ")}`,
        `Current directory: ${process.cwd()}`,
        `NODE_ENV: ${process.env.NODE_ENV}`,
      ].join("\n")
    );
  }
}

function formatPrivateKey(privateKey: string): string {
  const formatted = privateKey
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  console.log("🔑 Private Key Diagnostics", {
    length: formatted.length,
    startsCorrectly: formatted.startsWith(
      "-----BEGIN PRIVATE KEY-----"
    ),
    endsCorrectly: formatted.endsWith(
      "-----END PRIVATE KEY-----"
    ),
    lineCount: formatted.split("\n").length,
  });

  return formatted;
}

async function testFirebaseConnection() {
  try {
    const auth = admin.auth();

    await auth.listUsers(1);

    console.log(
      "✅ Firebase Auth connection test passed"
    );
  } catch (error) {
    console.error(
      "❌ Firebase Auth connection test failed"
    );
    throw error;
  }
}

async function initializeFirebaseAdmin() {
  if (initialized || admin.apps.length > 0) {
    return;
  }

  console.log("🚀 Starting Firebase Admin initialization");

  logEnvironmentDiagnostics();

  try {
    validateFirebaseConfig();

    const projectId = process.env.FIREBASE_PROJECT_ID!;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
    const privateKey = formatPrivateKey(
      process.env.FIREBASE_PRIVATE_KEY!
    );

    console.log("🔧 Creating Firebase credential");

    const credential = admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    });

    console.log("🔧 Initializing Firebase app");

    admin.initializeApp({
      credential,
      projectId,
    });

    console.log("✅ Firebase app initialized");

    await testFirebaseConnection();

    initialized = true;

    console.log(
      "🎉 Firebase Admin SDK initialized successfully"
    );
  } catch (error) {
    console.error(
      "❌ Firebase Admin initialization failed"
    );

    if (error instanceof Error) {
      console.error("Message:", error.message);
      console.error("Stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }

    throw error;
  }
}

export async function getAdminAuth() {
  await initializeFirebaseAdmin();
  return admin.auth();
}

export async function getAdminDb() {
  await initializeFirebaseAdmin();
  return admin.firestore();
}

export async function setUserClaims(
  uid: string,
  role: string
) {
  const auth = await getAdminAuth();

  console.log("🔐 Setting custom claims", {
    uid,
    role,
  });

  await auth.setCustomUserClaims(uid, {
    role,
  });

  console.log("✅ Custom claims updated");
}

export async function verifyFirebaseHealth() {
  try {
    await initializeFirebaseAdmin();

    const auth = admin.auth();

    await auth.listUsers(1);

    return {
      success: true,
      initialized: true,
      appsCount: admin.apps.length,
      projectId: process.env.FIREBASE_PROJECT_ID,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      initialized: false,
      appsCount: admin.apps.length,
      error:
        error instanceof Error
          ? error.message
          : String(error),
      timestamp: new Date().toISOString(),
    };
  }
}