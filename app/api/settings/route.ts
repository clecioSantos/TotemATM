import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/src/services/firebase-admin";
import { logger } from "@/src/lib/logger";

export async function GET() {
  try {
    const db = getAdminDb();
    const doc = await db.collection("settings").doc("global").get();
    const data = doc.data() || {};
    return NextResponse.json({ success: true, ...data });
  } catch (error) {
    logger.error("API_SETTINGS", "Erro ao ler configurações globais", error);
    return NextResponse.json({ success: false, error: "Erro ao ler configurações" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const db = getAdminDb();
    await db.collection("settings").doc("global").set(body, { merge: true });
    logger.info("API_SETTINGS", "Configurações globais atualizadas", body);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("API_SETTINGS", "Erro ao salvar configurações globais", error);
    return NextResponse.json({ success: false, error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
