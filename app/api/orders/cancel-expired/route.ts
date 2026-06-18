import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

const EXPIRATION_MINUTES = 30;

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);

  try {
    const db = getAdminDb();
    const cutoff = new Date(Date.now() - EXPIRATION_MINUTES * 60 * 1000);

    logger.info("CANCEL_EXPIRED", `[${requestId}] Buscando pedidos pendentes anteriores a ${cutoff.toISOString()}`);

    const snapshot = await db.collection("orders")
      .where("paymentStatus", "==", "WAITING_PAYMENT")
      .where("createdAt", "<", cutoff)
      .get();

    let cancelled = 0;
    let skipped = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      // Pular se já foi cancelado por outro processo
      if (data.status === "cancelled" || data.paymentStatus === "CANCELLED" || data.paymentStatus === "EXPIRED" || data.paymentStatus === "FAILED") {
        skipped++;
        continue;
      }

      // Pular pedidos com data de expiração ainda válida
      if (data.paymentExpiresAt) {
        const expiresAt = data.paymentExpiresAt.toDate ? data.paymentExpiresAt.toDate() : new Date(data.paymentExpiresAt);
        if (expiresAt > new Date()) {
          skipped++;
          continue;
        }
      }

      await db.collection("orders").doc(doc.id).update({
        paymentStatus: "EXPIRED",
        status: "cancelled",
        cancelledAt: new Date(),
        cancelReason: `Pedido expirou após ${EXPIRATION_MINUTES}min sem pagamento`,
        updatedAt: new Date(),
      });

      cancelled++;
    }

    logger.info("CANCEL_EXPIRED", `[${requestId}] Concluído`, {
      total: snapshot.size,
      cancelled,
      skipped,
    });

    return NextResponse.json({
      success: true,
      total: snapshot.size,
      cancelled,
      skipped,
    });
  } catch (error: any) {
    logger.error("CANCEL_EXPIRED", `[${requestId}] Erro ao cancelar pedidos expirados`, error);
    return NextResponse.json(
      { success: false, error: "Erro ao cancelar pedidos expirados" },
      { status: 500 }
    );
  }
}
