import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoProvider } from "@/app/services/mercadopago/mercadopago.provider";
import { markOrderAsPaid } from "@/src/services/payment/services/order-payment.service";
import { logger } from "@/src/lib/logger";

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const env = (process.env.MERCADOPAGO_ENVIRONMENT || "production").toLowerCase();
  const isSandbox = env === "sandbox" || env === "test" || env === "dev";

  if (!secret || isSandbox) {
    if (isSandbox) {
      logger.info("MERCADOPAGO_WEBHOOK", "Ambiente sandbox: validação de assinatura desabilitada");
    }
    return true;
  }

  if (!signatureHeader) {
    logger.warn("MERCADOPAGO_WEBHOOK", "Assinatura ausente mas secret configurado");
    return false;
  }

  try {
    const parts = signatureHeader.split(",");
    let ts = "";
    let receivedSig = "";

    for (const part of parts) {
      const eqIndex = part.indexOf("=");
      if (eqIndex === -1) continue;
      const key = part.substring(0, eqIndex).trim();
      const value = part.substring(eqIndex + 1).trim();
      if (key === "ts") ts = value;
      if (key === "v1") receivedSig = value;
    }

    if (!ts || !receivedSig) return false;

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const contentType = req.headers.get("content-type") || "";
    const signatureHeader = req.headers.get("x-signature");

    logger.info("MERCADOPAGO_WEBHOOK", "Webhook recebido", {
      contentType,
      contentLength: rawBody.length,
      hasSignature: !!signatureHeader,
    });

    if (!verifySignature(rawBody, signatureHeader)) {
      logger.warn("MERCADOPAGO_WEBHOOK", "Webhook rejeitado: assinatura inválida");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      if (contentType.includes("application/json")) {
        payload = JSON.parse(rawBody);
      } else {
        const params = new URLSearchParams(rawBody);
        payload = Object.fromEntries(params.entries()) as unknown as Record<string, unknown>;
      }
    } catch {
      logger.error("MERCADOPAGO_WEBHOOK", "Payload inválido");
      return NextResponse.json({ received: true });
    }

    const action = payload.action as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (!action || !data?.id) {
      logger.warn("MERCADOPAGO_WEBHOOK", "Webhook ignorado: sem action ou data.id", undefined, {
        action,
        hasDataId: !!data?.id,
      });
      return NextResponse.json({ received: true });
    }

    const headers: Record<string, string | string[] | undefined> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const provider = new MercadoPagoProvider();
    const event = await provider.processWebhook(payload, headers);

    if (!event) {
      logger.info("MERCADOPAGO_WEBHOOK", "Evento ignorado: não foi possível processar");
      return NextResponse.json({ received: true });
    }

    logger.info("MERCADOPAGO_WEBHOOK", `Evento processado: ${event.event}`, {
      paymentId: event.paymentId,
      orderId: event.orderId,
      status: event.status,
    });

    if (event.status === "PAID") {
      await markOrderAsPaid(event.orderId);
      logger.info("MERCADOPAGO_WEBHOOK", `Pagamento aprovado para pedido ${event.orderId}`);
    } else {
      logger.info("MERCADOPAGO_WEBHOOK", `Evento não-PAID: ${event.event} para pedido ${event.orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("MERCADOPAGO_WEBHOOK", "Erro interno no processamento do webhook", error);
    return NextResponse.json({ received: true });
  }
}
