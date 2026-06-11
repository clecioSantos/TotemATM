import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function markOrderAsPaid(orderId: string): Promise<boolean> {
  try {
    const db = getAdminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const order = await orderRef.get();

    if (!order.exists) {
      logger.warn("ORDER_PAYMENT", `Pedido ${orderId} não encontrado para marcação como pago`);
      return false;
    }

    const data = order.data();

    if (data?.paymentStatus === "PAID") {
      logger.info("ORDER_PAYMENT", `Pedido ${orderId} já está marcado como pago. Idempotência: ignorando.`);
      return true;
    }

    await orderRef.update({
      paymentStatus: "PAID",
      status: "preparing",
      paidAt: new Date(),
    });

    logger.info("ORDER_PAYMENT", `Pedido ${orderId} marcado como pago com sucesso`);
    return true;
  } catch (error) {
    logger.error("ORDER_PAYMENT", `Erro ao marcar pedido ${orderId} como pago`, error);
    return false;
  }
}

export async function processApprovedPayment(params: {
  orderId: string;
  paymentId: string;
  provider: string;
  storeId?: string;
}): Promise<boolean> {
  const { orderId, paymentId, provider, storeId } = params;

  logger.info("ORDER_PAYMENT", "processApprovedPayment: iniciando", {
    orderId,
    paymentId,
    provider,
    storeId,
  });

  const result = await markOrderAsPaid(orderId);

  if (result) {
    logger.info("ORDER_PAYMENT", "processApprovedPayment: sucesso", {
      orderId,
      paymentId,
      provider,
      storeId,
    });
  } else {
    logger.warn("ORDER_PAYMENT", "processApprovedPayment: falha ao marcar como pago", {
      orderId,
      paymentId,
      provider,
      storeId,
    });
  }

  return result;
}
