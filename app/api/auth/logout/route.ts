import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/src/lib/logger";

export async function POST() {
  try {
    const cookieStore = await cookies();

    cookieStore.delete("session");
    cookieStore.delete("user-role");

    logger.info("API_LOGOUT", "Logout realizado com sucesso");

    return NextResponse.json({ success: true, status: "success" });
  } catch (error) {
    logger.error("API_LOGOUT", "Erro ao fazer logout", error);
    return NextResponse.json({ success: false, error: "Erro interno" }, { status: 500 });
  }
}
