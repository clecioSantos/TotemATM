import { NextResponse } from "next/server";
import { processAutomations } from "@/src/services/promotions.service";
import { logger } from "@/src/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Não autorizado" }, { status: 401 });
    }

    logger.info("AUTOMATIONS", "Iniciando processamento de automações");

    const results = await processAutomations();

    logger.info("AUTOMATIONS", "Automações processadas", results);

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    logger.error("AUTOMATIONS", `Erro ao processar automações: ${errMsg}`, error);
    return NextResponse.json(
      { success: false, error: errMsg },
      { status: 500 }
    );
  }
}
