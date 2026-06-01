import { NextRequest, NextResponse } from "next/server";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "@/src/services/firebase";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    // O reference_id é o nosso ID de pedido do Firestore
    const orderId = payload.reference_id;
    const status = payload.status; // Ex: "PAID"

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
