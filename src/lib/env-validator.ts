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
  { name: "PAYMENT_PROVIDER", required: false, description: "Gateway de pagamento ativo: pagbank ou abacatepay (default: pagbank)" },
  { name: "PAGBANK_TOKEN", required: false, description: "PagBank API Token (Bearer)" },
  { name: "PAGBANK_API_URL", required: false, description: "PagBank API URL (ex: https://sandbox.api.pagseguro.com ou https://api.pagseguro.com)" },
  { name: "PAGBANK_WEBHOOK_URL", required: false, description: "PagBank Webhook URL" },
  { name: "PAGBANK_PRIVATE_KEY", required: false, description: "PagBank Private Key" },
  { name: "PAGBANK_PUBLIC_KEY", required: false, description: "PagBank Public Key" },
  { name: "ABACATEPAY_API_KEY", required: false, description: "AbacatePay API Key" },
  { name: "ABACATEPAY_WEBHOOK_SECRET", required: false, description: "AbacatePay Webhook Secret" },
  { name: "MERCADOPAGO_ACCESS_TOKEN", required: false, description: "Mercado Pago Access Token" },
  { name: "MERCADOPAGO_WEBHOOK_SECRET", required: false, description: "Mercado Pago Webhook Secret" },
  { name: "MERCADOPAGO_ENVIRONMENT", required: false, description: "Mercado Pago Environment (production ou sandbox)" },
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

function checkVars(rules: EnvVarRule[], environment: string): { missing: string[]; optionalMissing: string[] } {
  const missing: string[] = [];
  const optionalMissing: string[] = [];

  for (const rule of rules) {
    const value = process.env[rule.name];
    if (!value || value.trim() === "") {
      if (rule.required) {
        missing.push(rule.name);
      } else {
        optionalMissing.push(rule.name);
      }
    }
  }

  return { missing, optionalMissing };
}

export function validateEnv(): void {
  const runtime = process.env.NEXT_RUNTIME;

  const server = checkVars(SERVER_VARS, "server");
  const client = checkVars(CLIENT_VARS, "client");

  const allMissing = [...server.missing, ...client.missing];
  const allOptionalMissing = [...server.optionalMissing, ...client.optionalMissing];

  if (allMissing.length > 0) {
    logger.error(
      "ENV_VALIDATOR",
      `${allMissing.length} variável(is) obrigatória(s) ausente(s): ${allMissing.join(", ")}`,
      undefined,
      { missing: allMissing, environment: `${runtime || "nodejs"}` }
    );
  } else {
    logger.info("ENV_VALIDATOR", "Todas as variáveis obrigatórias presentes", {
      environment: runtime || "nodejs",
      optionalMissing: allOptionalMissing.length > 0 ? allOptionalMissing : undefined,
    });
  }
}
