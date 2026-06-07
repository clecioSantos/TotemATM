import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoProvider } from "@/app/services/mercadopago/mercadopago.provider";
import { markOrderAsPaid } from "@/src/services/payment/services/order-payment.service";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  console.log("WEBHOOK EXECUTOU");

  return Response.json({
    ok: true,
    timestamp: Date.now(),
  });
}