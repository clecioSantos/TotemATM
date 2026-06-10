import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      logger.error("MERCADOPAGO_CALLBACK", "Erro retornado pelo Mercado Pago", { error });
      return NextResponse.redirect(new URL("/admin/financeiro?error=access_denied", req.url));
    }

    if (!code || !state) {
      logger.error("MERCADOPAGO_CALLBACK", "Parâmetros ausentes", { code: !!code, state: !!state });
      return NextResponse.redirect(new URL("/admin/financeiro?error=missing_params", req.url));
    }

    const db = getAdminDb();
    const stateDoc = await db.collection("mercadopago_oauth_states").doc(state).get();

    if (!stateDoc.exists) {
      logger.error("MERCADOPAGO_CALLBACK", "State inválido ou expirado");
      return NextResponse.redirect(new URL("/admin/financeiro?error=invalid_state", req.url));
    }

    const stateData = stateDoc.data()!;
    const baseUrl = stateData.baseUrl || "http://localhost:3000";

    await db.collection("mercadopago_oauth_states").doc(state).delete();

    const tokenRaw = await MercadoPagoService.exchangeAuthorizationCode(code);
    const tokenData = tokenRaw as {
      access_token: string;
      refresh_token: string;
      user_id: string;
      expires_in: number;
    };

    const companyId = stateData.companyId;
    if (companyId) {
      await db.collection("companies").doc(companyId).update({
        mercadopago_connected: true,
        mercadopago_user_id: tokenData.user_id,
        mercadopago_access_token: tokenData.access_token,
        mercadopago_refresh_token: tokenData.refresh_token,
        mercadopago_token_expires_at: MercadoPagoService.calculateExpiresAt(tokenData.expires_in),
        mercadopago_connected_at: new Date(),
      });
    }

    return NextResponse.redirect(new URL("/admin/financeiro?success=connected", baseUrl));
  } catch (error) {
    logger.error("MERCADOPAGO_CALLBACK", "Erro no callback OAuth", error);
    return NextResponse.redirect(new URL("/admin/financeiro?error=server_error", req.url));
  }
}
