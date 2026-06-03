import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let payload: any;

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      // Se não for JSON, lê como texto e converte de Form Data para Objeto
      const text = await req.text();
      const params = new URLSearchParams(text);
      payload = Object.fromEntries(params.entries());
    }

    console.log("📦 Webhook payload:", payload);
    
    // Tenta obter o ID do pedido (suporta reference_id do V2 ou reference do legado)
    // Nota: No V2, o reference_id do pedido pago vem na raiz ou dentro de cada charge
    let orderId = payload.reference_id || payload.reference || payload.charges?.[0]?.reference_id;
    if (orderId && typeof orderId === 'string' && orderId.startsWith("ORDER-")) {
      orderId = orderId.substring("ORDER-".length);
    }
    
    // O status no PagBank V2 para ordens pode vir na raiz ou dentro do array de charges
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
      const orderRef = doc(firestore, "orders", orderId);
      
      await updateDoc(orderRef, {
        paymentStatus: "PAID",
        status: "preparing", // Avança automaticamente para a cozinha
        paidAt: serverTimestamp(),
      });
      
      console.log(`✅ Pagamento confirmado para o pedido: ${orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🔥 Webhook Error:", error);
    return NextResponse.json({ error: "Erro interno no webhook" }, { status: 500 });
  }
}
