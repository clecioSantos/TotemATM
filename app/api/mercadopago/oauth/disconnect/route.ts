import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    await db.collection("companies").doc(companyId).update({
      mercadopago_connected: false,
      mercadopago_user_id: null,
      mercadopago_access_token: null,
      mercadopago_refresh_token: null,
      mercadopago_token_expires_at: null,
      mercadopago_connected_at: null,
    });

    logger.info("MERCADOPAGO_DISCONNECT", `Mercado Pago desconectado da loja ${companyId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("MERCADOPAGO_DISCONNECT", "Erro ao desconectar", error);
    return NextResponse.json(
      { error: "Erro ao desconectar Mercado Pago" },
      { status: 500 }
    );
  }
}
