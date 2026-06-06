import { NextResponse } from "next/server";
import { logger } from "@/src/lib/logger";

export async function GET() {
  try {
    const rawKey = process.env.PAGBANK_PUBLIC_KEY || "";

    if (!rawKey) {
      logger.warn("PUBLIC_KEY", "PAGBANK_PUBLIC_KEY não configurada");
      return NextResponse.json({
        success: false,
        error: 'Chave pública não configurada'
      }, { status: 404 });
    }

    const publicKey = rawKey.replace(/\\n/g, '\n');

    return NextResponse.json({
      success: true,
      public_key: publicKey,
      created_at: Date.now()
    }, { status: 200 });
  } catch (error) {
    logger.error("PUBLIC_KEY", "Erro ao obter chave pública", error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno'
    }, { status: 500 });
  }
}
