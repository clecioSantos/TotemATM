import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries());
    }

    console.log("📦 Webhook payload:", JSON.stringify(payload));
    
    let orderId = payload.reference_id || payload.reference || payload.charges?.[0]?.reference_id;
    if (orderId && typeof orderId === 'string' && orderId.startsWith("ORDER-")) {
      orderId = orderId.substring("ORDER-".length);
    }
    
    let status = payload.status;
    if (!status && payload.charges && payload.charges.length > 0) {
      status = payload.charges[0].status;
    }

    console.log(`🔍 Processando Pedido: ${orderId} | Status: ${status}`);

    if (!orderId) {
      console.warn("⚠️ Webhook recebido sem reference_id identificado.");
      return NextResponse.json({ received: true });
    }

    if (status === "PAID") {
      const db = getAdminDb();
      await db.collection("orders").doc(orderId).update({
        paymentStatus: "PAID",
        status: "preparing",
        paidAt: new Date(),
      });
      
      console.log(`✅ Pagamento confirmado para o pedido: ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🔥 Webhook Error:", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
