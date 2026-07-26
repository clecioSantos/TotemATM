import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";
import crypto from "crypto";

export const dynamic = "force-dynamic";

function getBaseUrl(req: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.MERCADOPAGO_REDIRECT_URI) {
    try {
      return new URL(process.env.MERCADOPAGO_REDIRECT_URI).origin;
    } catch {}
  }
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || "";
    const userId = searchParams.get("userId") || "";
    const redirect = searchParams.get("redirect") || "";
    const direct = searchParams.get("direct") === "1";

    const state = crypto.randomBytes(32).toString("hex");
    const baseUrl = getBaseUrl(req);

    const db = getAdminDb();
    await db.collection("mercadopago_oauth_states").doc(state).set({
      state,
      companyId,
      userId,
      baseUrl,
      redirect,
      createdAt: new Date(),
    });

    const url = MercadoPagoService.buildOAuthUrl(state);

    if (direct) {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({ url });
  } catch (error) {
    logger.error("MERCADOPAGO_OAUTH", "Erro ao gerar URL de conexão", error);
    return NextResponse.json(
      { error: "Erro ao iniciar conexão com Mercado Pago" },
      { status: 500 }
    );
  }
}
