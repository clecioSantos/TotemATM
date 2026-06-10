import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";
import crypto from "crypto";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.MERCADOPAGO_REDIRECT_URI) {
    try {
      return new URL(process.env.MERCADOPAGO_REDIRECT_URI).origin;
    } catch {}
  }
  return "http://localhost:3000";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || "";
    const userId = searchParams.get("userId") || "";

    const state = crypto.randomBytes(32).toString("hex");
    const baseUrl = getBaseUrl();

    const db = getAdminDb();
    await db.collection("mercadopago_oauth_states").doc(state).set({
      state,
      companyId,
      userId,
      baseUrl,
      createdAt: new Date(),
    });

    const url = MercadoPagoService.buildOAuthUrl(state);

    return NextResponse.json({ url });
  } catch (error) {
    logger.error("MERCADOPAGO_OAUTH", "Erro ao gerar URL de conexão", error);
    return NextResponse.json(
      { error: "Erro ao iniciar conexão com Mercado Pago" },
      { status: 500 }
    );
  }
}
