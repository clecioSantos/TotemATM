import { getAdminDb } from "@/src/services/firebase-admin";
import { pushSender } from "@/src/services/push-sender.service";
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

    // Notificar loja e registrar uso de cupom
    try {
      const db = getAdminDb();
      const orderDoc = await db.collection("orders").doc(orderId).get();
      const orderData = orderDoc.data();
      const companyId = orderData?.companyId || storeId;

      // Notificar loja sobre novo pedido
      if (companyId) {
        const customerName = orderData?.customerName || orderData?.userName || "Cliente";
        const itemCount = orderData?.items?.length || 0;
        pushSender.sendToStore(companyId, {
          title: "🆕 Novo Pedido Recebido",
          body: `${customerName} fez um pedido de ${itemCount} item(ns) — R$ ${(orderData?.total || 0).toFixed(2)}`,
          data: { orderId, type: "new_order" },
        }).catch((err) => logger.warn("ORDER_PAYMENT", "Erro ao enviar push para loja", err));
      }

      // Registrar uso de cupom se houver
      if (orderData?.couponId && orderData?.couponCode) {
        const usageRef = db.collection("coupon_usage").doc();
        await usageRef.set({
          couponId: orderData.couponId,
          storeId: orderData.companyId || storeId,
          customerId: orderData.customerId,
          orderId,
          discountApplied: orderData.discountValue || 0,
          createdAt: new Date(),
        });

        const couponRef = db.collection("coupons").doc(orderData.couponId);
        const couponDoc = await couponRef.get();
        const currentCount = couponDoc.data()?.usageCount || 0;
        await couponRef.update({ usageCount: currentCount + 1 });

        logger.info("COUPON_USAGE", "Uso de cupom registrado", {
          couponId: orderData.couponId,
          couponCode: orderData.couponCode,
          orderId,
          discount: orderData.discountValue,
        });
      }
    } catch (couponError) {
      logger.warn("ORDER_PAYMENT", "Erro ao registrar uso de cupom", couponError);
    }
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
