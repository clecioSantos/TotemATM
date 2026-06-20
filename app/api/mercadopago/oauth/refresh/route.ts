import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { companyId } = await req.json();
    if (!companyId) {
      return NextResponse.json({ error: "companyId é obrigatório" }, { status: 400 });
    }

    const db = getAdminDb();
    const companyRef = db.collection("companies").doc(companyId);
    const companySnap = await companyRef.get();

    if (!companySnap.exists) {
      return NextResponse.json({ error: "Empresa não encontrada" }, { status: 404 });
    }

    const companyData = companySnap.data()!;
    const accessToken =
      companyData.mercadopago_access_token ||
      companyData.accessToken;

    if (!accessToken) {
      return NextResponse.json({ error: "Nenhum token de acesso encontrado" }, { status: 400 });
    }

    logger.info("MP_ACCOUNT", "Obtendo dados da conta");

    const mpRes = await fetch("https://api.mercadopago.com/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!mpRes.ok) {
      logger.error("MP_ACCOUNT", "Erro ao consultar /users/me", { status: mpRes.status });
      return NextResponse.json(
        { error: "Não foi possível atualizar os dados da conta Mercado Pago." },
        { status: 502 }
      );
    }

    const mpUser = await mpRes.json();
    const accountData = {
      mercadopago_account: {
        mpUserId: String(mpUser.id),
        mpNickname: mpUser.nickname || "",
        mpFirstName: mpUser.first_name || "",
        mpLastName: mpUser.last_name || "",
        mpEmail: mpUser.email || "",
        mpConnectedAt: new Date(),
      },
    };

    await companyRef.update(accountData);

    logger.info("MP_ACCOUNT", "Dados atualizados com sucesso", { mpUserId: mpUser.id });

    return NextResponse.json({
      connected: true,
      mpUserId: String(mpUser.id),
      mpNickname: mpUser.nickname || "",
      mpFirstName: mpUser.first_name || "",
      mpLastName: mpUser.last_name || "",
      mpEmail: mpUser.email || "",
      mpConnectedAt: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("MP_ACCOUNT", "Erro ao consultar /users/me", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar os dados da conta Mercado Pago." },
      { status: 500 }
    );
  }
}
