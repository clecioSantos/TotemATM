import { NextRequest, NextResponse } from "next/server";
import { processApprovedPayment } from "@/src/services/payment/services/order-payment.service";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, total } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, error: "orderId é obrigatório" }, { status: 400 });
    }

    if (total != null) {
      const { getAdminDb } = await import("@/src/services/firebase-admin");
      const db = getAdminDb();
      await db.collection("orders").doc(orderId).update({ total });
    }

    await processApprovedPayment({
      orderId,
      paymentId: "sandbox_" + Date.now(),
      provider: "sandbox",
    });

    logger.info("SANDBOX_PAYMENT", `Pedido ${orderId} pago via sandbox`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("SANDBOX_PAYMENT", "Erro no pagamento sandbox", error);
    return NextResponse.json({ success: false, error: "Erro ao processar pagamento sandbox" }, { status: 500 });
  }
}
