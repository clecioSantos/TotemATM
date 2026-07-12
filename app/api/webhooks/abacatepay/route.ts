import { NextRequest, NextResponse } from "next/server";
import { AbacatePayProvider } from "@/app/services/abacatepay/abacatepay.provider";
import { processApprovedPayment } from "@/src/services/payment/services/order-payment.service";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || undefined;
    const urlSecret = req.nextUrl.searchParams.get("webhookSecret") || "";

    logger.info("ABACATEPAY_WEBHOOK", "Webhook recebido", {
      hasSignature: !!signature,
      hasUrlSecret: !!urlSecret,
      contentLength: rawBody.length,
    });

    const expectedSecret = process.env.ABACATEPAY_WEBHOOK_SECRET;
    if (expectedSecret && urlSecret !== expectedSecret) {
      logger.warn("ABACATEPAY_WEBHOOK", "Webhook rejeitado: secret inválido");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isValid = AbacatePayProvider.verifySignature(rawBody, signature);
    if (!isValid) {
      logger.warn("ABACATEPAY_WEBHOOK", "Webhook rejeitado: assinatura HMAC inválida");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      logger.error("ABACATEPAY_WEBHOOK", "Payload JSON inválido");
      return NextResponse.json({ received: true });
    }

    const provider = new AbacatePayProvider();
    const event = await provider.processWebhook(payload, {
      "x-webhook-signature": signature,
    });

    if (!event) {
      logger.info("ABACATEPAY_WEBHOOK", "Evento ignorado: não foi possível extrair dados");
      return NextResponse.json({ received: true });
    }

    logger.info("ABACATEPAY_WEBHOOK", `Evento processado: ${event.event}`, {
      paymentId: event.paymentId,
      orderId: event.orderId,
      status: event.status,
    });

    if (event.event === "transparent.completed" && event.status === "PAID") {
      await processApprovedPayment({
        orderId: event.orderId,
        paymentId: event.paymentId,
        provider: "abacatepay",
      });
      logger.info("ABACATEPAY_WEBHOOK", `Pagamento aprovado para pedido ${event.orderId}`);
    } else {
      logger.info("ABACATEPAY_WEBHOOK", `Evento não-PAID recebido: ${event.event} para pedido ${event.orderId}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("ABACATEPAY_WEBHOOK", "Erro interno no processamento do webhook", error);
    return NextResponse.json({ received: true });
  }
}
