import { MercadoPagoService } from "./mercadopago.service";
import { processApprovedPayment } from "@/src/services/payment/services/order-payment.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

const FALLBACK_INTERVALS = [30_000, 60_000, 120_000, 300_000];

export async function scheduleMercadoPagoFallbackChecks(
  orderId: string,
  paymentId: string,
  accessToken?: string,
  storeId?: string,
  expiresAt?: string
): Promise<void> {
  logger.info("MP_FALLBACK_START", "Agendando verificações de contingência", {
    orderId,
    paymentId,
    storeId,
    expiresAt,
    intervals: FALLBACK_INTERVALS.map((ms) => `${ms / 1000}s`),
  });

  for (const delay of FALLBACK_INTERVALS) {
    await new Promise((resolve) => setTimeout(resolve, delay));

    const shouldStop = await checkAndProcess(orderId, paymentId, accessToken, storeId, `${delay / 1000}s`);
    if (shouldStop) return;
  }

  if (expiresAt) {
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const msUntilExpiry = expirationDate.getTime() - now.getTime();
    const waitMs = Math.max(0, msUntilExpiry) + 30_000;

    if (waitMs > 0) {
      logger.info("MP_FALLBACK_PENDING", "Aguardando expiração do QR Code para verificação final", {
        orderId,
        paymentId,
        storeId,
        expiresAt,
        waitMs,
      });

      await new Promise((resolve) => setTimeout(resolve, waitMs));

      const wasApproved = await checkAndProcess(orderId, paymentId, accessToken, storeId, "expirado");
      if (wasApproved) return;
    }
  }

  const db = getAdminDb();
  const orderRef = db.collection("orders").doc(orderId);
  const order = await orderRef.get();

  if (order.exists) {
    const data = order.data();
    if (data?.paymentStatus !== "PAID") {
      await orderRef.update({
        paymentStatus: "EXPIRED",
        status: "abandoned",
        cancelledAt: new Date(),
        cancelReason: "QR Code expirado sem pagamento",
      });

      logger.info("MP_FALLBACK_FAILED", "Pedido abandonado por expiração do QR Code", {
        orderId,
        paymentId,
        storeId,
      });
    }
  }
}

async function checkAndProcess(
  orderId: string,
  paymentId: string,
  accessToken: string | undefined,
  storeId: string | undefined,
  label: string
): Promise<boolean> {
  try {
    const result = await MercadoPagoService.checkMercadoPagoPaymentStatus(paymentId, accessToken);

    logger.info("MP_FALLBACK_CHECK", "Verificação de contingência", {
      orderId,
      paymentId,
      storeId,
      step: label,
      mpStatus: result.status,
      approved: result.approved,
    });

    if (result.approved) {
      logger.info("MP_FALLBACK_APPROVED", "Pagamento aprovado na verificação de contingência", {
        orderId,
        paymentId,
        storeId,
        step: label,
        status: result.status,
        statusDetail: result.statusDetail,
      });

      await processApprovedPayment({ orderId, paymentId, provider: "mercadopago", storeId });
      return true;
    }

    return false;
  } catch (error) {
    logger.error("MP_FALLBACK_FAILED", "Erro na verificação de contingência", error, {
      orderId,
      paymentId,
      storeId,
      step: label,
    });
    return false;
  }
}

export async function reconcilePendingMercadoPagoPayments(): Promise<{
  processed: number;
  approved: number;
  failed: number;
}> {
  logger.info("MP_RECONCILIATION_START", "Iniciando reconciliação de pagamentos pendentes");

  const db = getAdminDb();
  let processed = 0;
  let approved = 0;
  let failed = 0;

  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const snapshot = await db
      .collection("orders")
      .where("paymentStatus", "==", "WAITING_PAYMENT")
      .where("createdAt", ">=", cutoff)
      .get();

    const mercadopagoOrders = snapshot.docs.filter((doc) => {
      const data = doc.data();
      return data.paymentProvider === "mercadopago" || (data.paymentId && !data.paymentProvider);
    });

    logger.info("MP_RECONCILIATION_START", `Encontrados ${mercadopagoOrders.length} pedidos Mercado Pago pendentes (de ${snapshot.size} total)`);

    const promises = mercadopagoOrders.map(async (doc) => {
      const orderData = doc.data();
      const orderId = doc.id;
      const paymentId = orderData.paymentId as string | undefined;
      const companyId = orderData.companyId as string | undefined;

      if (!paymentId) {
        logger.warn("MP_RECONCILIATION_START", `Pedido ${orderId} sem paymentId, pulando`);
        return;
      }

      processed++;

      try {
        let accessToken: string | undefined;

        if (companyId) {
          const companyDoc = await db.collection("companies").doc(companyId).get();
          if (companyDoc.exists) {
            const companyData = companyDoc.data()!;
            if (companyData.mercadopago_connected && companyData.mercadopago_access_token) {
              accessToken = companyData.mercadopago_access_token;
            }
          }
        }

        const result = await MercadoPagoService.checkMercadoPagoPaymentStatus(paymentId, accessToken);

        if (result.approved) {
          logger.info("MP_RECONCILIATION_APPROVED", "Reconciliação: pagamento aprovado", {
            orderId,
            paymentId,
            companyId,
          });

          await processApprovedPayment({ orderId, paymentId, provider: "mercadopago", storeId: companyId });
          approved++;
        } else if (result.status === "cancelled" || result.status === "rejected") {
          logger.info("MP_RECONCILIATION_APPROVED", `Reconciliação: pagamento ${result.status}`, {
            orderId,
            paymentId,
            companyId,
          });

          await db.collection("orders").doc(orderId).update({
            paymentStatus: result.status === "cancelled" ? "CANCELLED" : "FAILED",
            status: "abandoned",
            cancelledAt: new Date(),
            cancelReason: `Pagamento ${result.status} no Mercado Pago`,
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        failed++;
        logger.error("MP_RECONCILIATION_APPROVED", "Reconciliação: erro ao processar pedido", error, {
          orderId,
          paymentId,
          companyId,
        });
      }
    });

    await Promise.allSettled(promises);

    logger.info("MP_RECONCILIATION_START", "Reconciliação finalizada", {
      total: snapshot.size,
      processed,
      approved,
      failed,
    });
  } catch (error) {
    logger.error("MP_RECONCILIATION_START", "Erro na reconciliação", error);
  }

  return { processed, approved, failed };
}