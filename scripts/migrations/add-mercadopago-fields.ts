import * as admin from "firebase-admin";
import { logger } from "../../src/lib/logger";

async function migrate() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.error("Variáveis de ambiente do Firebase Admin não configuradas.");
    process.exit(1);
  }

  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, "\n"),
      }),
    });
  }

  const db = admin.firestore();
  const companiesRef = db.collection("companies");

  logger.info("MIGRATION", "=== Iniciando migration: add-mercadopago-fields ===");

  let updated = 0;
  let skipped = 0;
  let total = 0;

  try {
    const snapshot = await companiesRef.get();
    total = snapshot.size;
    logger.info("MIGRATION", `Total de empresas encontradas: ${total}`);

    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      const updates: Record<string, unknown> = {};

      if (data.mercadopago_connected === undefined) {
        updates.mercadopago_connected = false;
      }
      if (data.mercadopago_user_id === undefined) {
        updates.mercadopago_user_id = null;
      }
      if (data.mercadopago_access_token === undefined) {
        updates.mercadopago_access_token = null;
      }
      if (data.mercadopago_refresh_token === undefined) {
        updates.mercadopago_refresh_token = null;
      }
      if (data.mercadopago_token_expires_at === undefined) {
        updates.mercadopago_token_expires_at = null;
      }
      if (data.mercadopago_connected_at === undefined) {
        updates.mercadopago_connected_at = null;
      }
      if (data.platform_commission_percent === undefined) {
        updates.platform_commission_percent = 6.00;
      }
      if (data.enabled === undefined) {
        updates.enabled = false;
      }

      if (Object.keys(updates).length > 0) {
        batch.update(doc.ref, updates);
        updated++;
        batchCount++;

        if (batchCount >= 500) {
          await batch.commit();
          logger.info("MIGRATION", `Lote de ${batchCount} atualizações commitado`);
          batchCount = 0;
        }
      } else {
        skipped++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      logger.info("MIGRATION", `Lote final de ${batchCount} atualizações commitado`);
    }

    logger.info("MIGRATION", "=== Migration concluída ===", {
      total,
      updated,
      skipped,
    });
  } catch (error) {
    logger.error("MIGRATION", "Erro durante a migration", error);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
