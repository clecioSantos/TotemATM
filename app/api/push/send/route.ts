import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/src/services/firebase-admin";
import { pushSender } from "@/src/services/push-sender.service";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    let decodedToken;
    try {
      const adminAuth = getAdminAuth();
      decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const callerUid = decodedToken.uid;
    const callerRole = decodedToken.role || "client";

    if (callerRole !== "admin" && callerRole !== "owner") {
      return NextResponse.json({ error: "Permissão negada" }, { status: 403 });
    }

    const { target, title, body, data, uid, companyId, role } = await req.json();

    if (!title || !body) {
      return NextResponse.json({ error: "title e body são obrigatórios" }, { status: 400 });
    }

    const payload = { title, body, data: data || {} };

    switch (target) {
      case "user":
        if (!uid) return NextResponse.json({ error: "uid é obrigatório para target=user" }, { status: 400 });
        await pushSender.sendToUser(uid, payload);
        break;
      case "store":
        if (!companyId) return NextResponse.json({ error: "companyId é obrigatório para target=store" }, { status: 400 });
        await pushSender.sendToStore(companyId, payload);
        break;
      case "role":
        if (!role) return NextResponse.json({ error: "role é obrigatório para target=role" }, { status: 400 });
        await pushSender.sendToRole(role, payload);
        break;
      default:
        return NextResponse.json({ error: "target inválido. Use: user, store, role" }, { status: 400 });
    }

    logger.info("API_PUSH", "Push enviado", { target, title, callerUid });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("API_PUSH", "Erro interno", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
