import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { pushSender } from "@/src/services/push-sender.service";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { getAuth } = await import("firebase-admin/auth");
    const decodedToken = await getAuth().verifyIdToken(authHeader.slice(7));

    const body = await req.json();
    const { companyId, title, body: messageBody, data } = body;

    if (!companyId || !title || !messageBody) {
      return NextResponse.json({ error: "companyId, title e body são obrigatórios" }, { status: 400 });
    }

    const db = getAdminDb();
    const companyDoc = await db.collection("companies").doc(companyId).get();
    if (!companyDoc.exists) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 });
    }

    await pushSender.sendToStore(companyId, { title, body: messageBody, data });

    logger.info("NOTIFY_STORE", "Notificação enviada para loja", { companyId, title, by: decodedToken.uid });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    logger.error("NOTIFY_STORE", "Erro ao notificar loja", error);
    return NextResponse.json({ error: "Erro ao enviar notificação" }, { status: 500 });
  }
}
