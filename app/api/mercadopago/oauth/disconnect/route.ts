import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId } = body;

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: "companyId é obrigatório" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const companyRef = db.collection("companies").doc(companyId);
    await companyRef.update({
      mercadopago_connected: false,
      mercadopago_user_id: null,
      mercadopago_access_token: null,
      mercadopago_refresh_token: null,
      mercadopago_token_expires_at: null,
    });

    logger.info("MERCADOPAGO", "OAUTH_DISCONNECT", {
      companyId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("MERCADOPAGO", "Erro ao desconectar conta Mercado Pago", error);
    return NextResponse.json(
      { success: false, error: "Erro ao desconectar conta" },
      { status: 500 }
    );
  }
}
