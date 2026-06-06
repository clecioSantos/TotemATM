import { logger } from "./logger";

interface EnvVarRule {
  name: string;
  required: boolean;
  description: string;
}

const SERVER_VARS: EnvVarRule[] = [
  { name: "FIREBASE_PROJECT_ID", required: true, description: "Firebase Admin Project ID" },
  { name: "FIREBASE_CLIENT_EMAIL", required: true, description: "Firebase Admin Client Email" },
  { name: "FIREBASE_PRIVATE_KEY", required: true, description: "Firebase Admin Private Key" },
  { name: "PAGBANK_TOKEN", required: true, description: "PagBank API Token" },
  { name: "PAGBANK_API_URL", required: true, description: "PagBank API URL" },
  { name: "PAGBANK_WEBHOOK_URL", required: false, description: "PagBank Webhook URL" },
  { name: "PAGBANK_PRIVATE_KEY", required: false, description: "PagBank Private Key" },
  { name: "PAGBANK_PUBLIC_KEY", required: false, description: "PagBank Public Key" },
  { name: "CLOUDINARY_CLOUD_NAME", required: true, description: "Cloudinary Cloud Name" },
  { name: "CLOUDINARY_API_KEY", required: true, description: "Cloudinary API Key" },
  { name: "CLOUDINARY_API_SECRET", required: true, description: "Cloudinary API Secret" },
];

const CLIENT_VARS: EnvVarRule[] = [
  { name: "NEXT_PUBLIC_FIREBASE_API_KEY", required: true, description: "Firebase Client API Key" },
  { name: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", required: true, description: "Firebase Client Auth Domain" },
  { name: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", required: true, description: "Firebase Client Project ID" },
  { name: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", required: true, description: "Firebase Client Storage Bucket" },
  { name: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", required: true, description: "Firebase Client Messaging Sender ID" },
  { name: "NEXT_PUBLIC_FIREBASE_APP_ID", required: true, description: "Firebase Client App ID" },
  { name: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", required: false, description: "Firebase Client Measurement ID" },
];

function checkVars(rules: EnvVarRule[], environment: string): string[] {
  const missing: string[] = [];

  for (const rule of rules) {
    const value = process.env[rule.name];

    if (rule.required && (!value || value.trim() === "")) {
      missing.push(rule.name);
      logger.error(
        "ENV_VALIDATOR",
        `Variável de ambiente obrigatória ausente: ${rule.name} (${rule.description}) - ambiente: ${environment}`
      );
    } else if (value) {
      logger.info(
        "ENV_VALIDATOR",
        `Variável ${rule.name} presente (${rule.description}) - ambiente: ${environment}`
      );
    } else {
      logger.warn(
        "ENV_VALIDATOR",
        `Variável opcional ausente: ${rule.name} (${rule.description}) - ambiente: ${environment}`
      );
    }
  }

  return missing;
}

export function validateEnv(): void {
  const runtime = process.env.NEXT_RUNTIME;

  logger.info("ENV_VALIDATOR", `Iniciando validação de variáveis de ambiente (NODE_ENV=${process.env.NODE_ENV}, NEXT_RUNTIME=${runtime || "nodejs"})`);

  const missingServer = checkVars(SERVER_VARS, "server");
  const missingClient = checkVars(CLIENT_VARS, "client");

  const allMissing = [...missingServer, ...missingClient];

  if (allMissing.length > 0) {
    logger.error(
      "ENV_VALIDATOR",
      `${allMissing.length} variável(is) obrigatória(s) ausente(s). A aplicação pode não funcionar corretamente.`,
      undefined,
      { missing: allMissing }
    );
  } else {
    logger.info("ENV_VALIDATOR", "Todas as variáveis de ambiente obrigatórias estão presentes");
  }
}
