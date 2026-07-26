import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoService } from "@/app/services/mercadopago/mercadopago.service";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

function getRedirectBaseUrl(storedBaseUrl?: string, req?: NextRequest): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const host = req?.headers.get("host") || "localhost:3000";
  const protocol = req?.headers.get("x-forwarded-proto") || "http";
  const requestBaseUrl = `${protocol}://${host}`;
  if (storedBaseUrl && !storedBaseUrl.includes("localhost")) return storedBaseUrl;
  return requestBaseUrl;
}

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
      const baseUrl = getRedirectBaseUrl(undefined, req);
      return NextResponse.redirect(`${baseUrl}/admin/financeiro?error=oauth_invalid`);
    }

    const db = getAdminDb();
    const stateDoc = await db.collection("mercadopago_oauth_states").doc(state).get();

    if (!stateDoc.exists) {
      logger.warn("MERCADOPAGO", "OAUTH_CALLBACK: state inválido ou expirado", undefined, { state });
      return NextResponse.redirect(new URL(`/admin/financeiro?error=oauth_invalid_state`, req.url));
    }

    const stateData = stateDoc.data()!;
    const companyId = stateData.companyId as string;
    const storedBaseUrl = (stateData.baseUrl as string) || "";
    const storedRedirect = (stateData.redirect as string) || "";
    const fallbackUrl = storedRedirect || `/admin/financeiro`;

    await db.collection("mercadopago_oauth_states").doc(state).delete();

    let tokenData;
    try {
      tokenData = await MercadoPagoService.exchangeAuthorizationCode(code);
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      logger.error("MERCADOPAGO", isTimeout ? "OAUTH_CALLBACK: timeout na API do Mercado Pago" : "OAUTH_CALLBACK: erro na troca do código", error);
      const baseUrl = getRedirectBaseUrl(storedBaseUrl, req);
      return NextResponse.redirect(`${baseUrl}${fallbackUrl}?error=oauth_token_exchange`);
    }

    const expiresAt = MercadoPagoService.calculateExpiresAt(tokenData.expires_in as number);
    const accessToken = tokenData.access_token as string;

    logger.info("MP_ACCOUNT", "Obtendo dados da conta");

    let accountData: Record<string, any> = {};
    try {
      const mpRes = await fetch("https://api.mercadopago.com/users/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (mpRes.ok) {
        const mpUser = await mpRes.json();
        accountData = {
          mercadopago_account: {
            mpUserId: String(mpUser.id),
            mpNickname: mpUser.nickname || "",
            mpFirstName: mpUser.first_name || "",
            mpLastName: mpUser.last_name || "",
            mpEmail: mpUser.email || "",
            mpConnectedAt: new Date(),
          },
        };
        logger.info("MP_ACCOUNT", "Dados atualizados com sucesso", { mpUserId: mpUser.id });
      } else {
        logger.warn("MP_ACCOUNT", "Erro ao consultar /users/me", { status: mpRes.status });
      }
    } catch (fetchError) {
      logger.error("MP_ACCOUNT", "Erro ao consultar /users/me", fetchError);
    }

    const companyRef = db.collection("companies").doc(companyId);
    await companyRef.update({
      mercadopago_connected: true,
      mercadopago_user_id: String(tokenData.user_id),
      mercadopago_access_token: accessToken,
      mercadopago_refresh_token: tokenData.refresh_token,
      mercadopago_token_expires_at: expiresAt,
      mercadopago_connected_at: new Date(),
      ...accountData,
    });

    logger.info("MERCADOPAGO", "OAUTH_CALLBACK", {
      companyId,
      mercadopagoUserId: tokenData.user_id,
      liveMode: (tokenData as any).live_mode,
    });

    const baseUrl = getRedirectBaseUrl(storedBaseUrl, req);
    const redirectUrl = storedRedirect || `/admin/financeiro?success=connected`;
    return NextResponse.redirect(`${baseUrl}${redirectUrl}`);
  } catch (error) {
    logger.error("MERCADOPAGO", "OAUTH_CALLBACK: erro interno", error);
    return NextResponse.redirect(new URL(`/admin/financeiro?error=oauth_internal`, req.url));
  }
}
