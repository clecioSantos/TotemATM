import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      logger.warn("MERCADOPAGO", "OAUTH_CALLBACK: code ou state ausentes", undefined, {
        hasCode: !!code,
        hasState: !!state,
      });
      return NextResponse.redirect(new URL("/admin/financeiro?error=oauth_invalid", req.url));
    }

    const db = getAdminDb();
    const stateDoc = await db.collection("mercadopago_oauth_states").doc(state).get();

    if (!stateDoc.exists) {
      logger.warn("MERCADOPAGO", "OAUTH_CALLBACK: state inválido ou expirado", undefined, { state });
      return NextResponse.redirect(new URL("/admin/financeiro?error=oauth_invalid_state", req.url));
    }

    const stateData = stateDoc.data()!;
    const companyId = stateData.companyId as string;

    await db.collection("mercadopago_oauth_states").doc(state).delete();

    let tokenData;
    try {
      tokenData = await MercadoPagoService.exchangeAuthorizationCode(code);
    } catch (error) {
      logger.error("MERCADOPAGO", "OAUTH_CALLBACK: erro na troca do código", error);
      return NextResponse.redirect(new URL("/admin/financeiro?error=oauth_token_exchange", req.url));
    }

    const expiresAt = MercadoPagoService.calculateExpiresAt(tokenData.expires_in);

    const companyRef = db.collection("companies").doc(companyId);
    await companyRef.update({
      mercadopago_connected: true,
      mercadopago_user_id: String(tokenData.user_id),
      mercadopago_access_token: tokenData.access_token,
      mercadopago_refresh_token: tokenData.refresh_token,
      mercadopago_token_expires_at: expiresAt,
      mercadopago_connected_at: new Date(),
    });

    logger.info("MERCADOPAGO", "OAUTH_CALLBACK", {
      companyId,
      mercadopagoUserId: tokenData.user_id,
      liveMode: tokenData.live_mode,
    });

    return NextResponse.redirect(new URL("/admin/financeiro?success=connected", req.url));
  } catch (error) {
    logger.error("MERCADOPAGO", "OAUTH_CALLBACK: erro interno", error);
    return NextResponse.redirect(new URL("/admin/financeiro?error=oauth_internal", req.url));
  }
}
