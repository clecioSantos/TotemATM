import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: any;

    try {
      if (contentType.includes("application/json")) {
        payload = await req.json();
      } else {
        const text = await req.text();
        const params = new URLSearchParams(text);
        payload = Object.fromEntries(params.entries());
      }
    } catch (parseError) {
      logger.error("WEBHOOK", "Erro ao fazer parse do payload do webhook", parseError);
      return NextResponse.json({ received: true });
    }

    logger.info("WEBHOOK", "Payload recebido", {
      hasReferenceId: !!payload.reference_id,
      hasStatus: !!payload.status,
      chargeCount: payload.charges?.length || 0,
    });

    let orderId = payload.reference_id || payload.reference || payload.charges?.[0]?.reference_id;
    if (orderId && typeof orderId === 'string' && orderId.startsWith("ORDER-")) {
      orderId = orderId.substring("ORDER-".length);
    }

    let status = payload.status;
    if (!status && payload.charges && payload.charges.length > 0) {
      status = payload.charges[0].status;
    }

    logger.info("WEBHOOK", `Processando Pedido: ${orderId} | Status: ${status}`);

    if (!orderId) {
      logger.warn("WEBHOOK", "Webhook recebido sem reference_id identificado", undefined, { payload });
      return NextResponse.json({ received: true });
    }

    if (status === "PAID") {
      try {
        const db = getAdminDb();
        await db.collection("orders").doc(orderId).update({
          paymentStatus: "PAID",
          status: "preparing",
          paidAt: new Date(),
        });

        logger.info("WEBHOOK", `Pagamento confirmado para o pedido: ${orderId}`);
      } catch (dbError) {
        logger.error("WEBHOOK", `Erro ao atualizar pedido ${orderId} no Firestore`, dbError);
      }
    } else {
      logger.info("WEBHOOK", `Status não-PAID recebido: ${status} para pedido ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("WEBHOOK", "Erro interno no processamento do webhook", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
