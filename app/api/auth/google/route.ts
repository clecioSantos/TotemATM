import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, redirectUri } = await req.json();
    if (!code) {
      return NextResponse.json({ error: "Código de autorização ausente" }, { status: 400 });
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error("API_GOOGLE_AUTH", "GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados");
      return NextResponse.json({ error: "Configuração do Google ausente no servidor" }, { status: 500 });
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_BASE_URL || ""}/login`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      logger.error("API_GOOGLE_AUTH", "Erro ao trocar código por token", errBody);
      return NextResponse.json({ error: "Falha na autenticação com Google" }, { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const idToken = tokenData.id_token;

    const ticketRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!ticketRes.ok) {
      return NextResponse.json({ error: "Token inválido" }, { status: 502 });
    }

    const userInfo = await ticketRes.json();

    const googleUid = `google:${userInfo.sub}`;

    let customToken: string;
    try {
      const adminAuth = getAdminAuth();
      customToken = await adminAuth.createCustomToken(googleUid, {
        provider: "google",
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      });
    } catch (fbErr) {
      logger.error("API_GOOGLE_AUTH", "Erro ao criar custom token", fbErr);
      return NextResponse.json({ error: "Erro ao criar token de autenticação" }, { status: 500 });
    }

    logger.info("API_GOOGLE_AUTH", "Google auth code exchange successful", { email: userInfo.email });

    return NextResponse.json({
      customToken,
      user: {
        uid: googleUid,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
      },
    });
  } catch (error) {
    logger.error("API_GOOGLE_AUTH", "Erro interno", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
