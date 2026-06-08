import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");
    const userId = searchParams.get("userId");

    if (!companyId || !userId) {
      return NextResponse.json(
        { success: false, error: "companyId e userId são obrigatórios" },
        { status: 400 }
      );
    }

    const state = crypto.randomBytes(32).toString("hex");

    const db = getAdminDb();
    await db.collection("mercadopago_oauth_states").doc(state).set({
      state,
      companyId,
      userId,
      createdAt: new Date(),
    });

    const oauthUrl = MercadoPagoService.buildOAuthUrl(state);

    logger.info("MERCADOPAGO", "OAUTH_CONNECT", {
      companyId,
      userId,
      hasState: true,
    });

    return NextResponse.json({ success: true, url: oauthUrl });
  } catch (error) {
    logger.error("MERCADOPAGO", "Erro ao gerar URL OAuth", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar URL de conexão" },
      { status: 500 }
    );
  }
}
