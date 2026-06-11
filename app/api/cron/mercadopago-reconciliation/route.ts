import { NextResponse } from "next/server";
import { reconcilePendingMercadoPagoPayments } from "@/app/services/mercadopago/mercadopago-fallback.service";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  logger.info("CRON", "Iniciando job de reconciliação Mercado Pago");

  try {
    const result = await reconcilePendingMercadoPagoPayments();

    logger.info("CRON", "Job de reconciliação concluído", result);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error("CRON", "Erro no job de reconciliação", error);

    return NextResponse.json(
      { success: false, error: "Erro na reconciliação" },
      { status: 500 }
    );
  }
}