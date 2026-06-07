import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoProvider } from "@/app/services/mercadopago/mercadopago.provider";
import { markOrderAsPaid } from "@/src/services/payment/services/order-payment.service";
import { logger } from "@/src/lib/logger";

function parseSignatureHeader(signatureHeader: string): { ts: string; v1: string } | null {
  const parts = signatureHeader.split(",");
  let ts = "";
  let v1 = "";
  for (const part of parts) {
    const eqIndex = part.indexOf("=");
    if (eqIndex === -1) continue;
    const key = part.substring(0, eqIndex).trim();
    const value = part.substring(eqIndex + 1).trim();
    if (key === "ts") ts = value;
    if (key === "v1") v1 = value;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

function verifySignature(dataId: string, ts: string, receivedSig: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true;

  try {
    const mod = require("crypto") as typeof import("crypto");
    const dataToSign = `id:${dataId};ts:${ts};`;
    const expectedSig = mod
      .createHmac("sha256", secret)
      .update(dataToSign)
      .digest("hex");
    return mod.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(receivedSig));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  logger.info("MERCADOPAGO_WEBHOOK", "=== INICIO DO WEBHOOK ===");

  try {
    const rawBody = await req.text();
    const contentType = req.headers.get("content-type") || "";
    const signatureHeader = req.headers.get("x-signature");

    const allHeaders: Record<string, string> = {};
    req.headers.forEach((value, key) => { allHeaders[key] = value; });

    logger.info("MERCADOPAGO_WEBHOOK", "CONTEUDO COMPLETO RECEBIDO", {
      allHeaders,
      contentType,
      contentLength: rawBody.length,
      hasSignature: !!signatureHeader,
      signatureHeader: signatureHeader || "(ausente)",
      bodyCompleto: rawBody,
    });

    let payload: Record<string, unknown>;

    try {
      if (contentType.includes("application/json")) {
        payload = JSON.parse(rawBody);
      } else {
        const params = new URLSearchParams(rawBody);
        payload = Object.fromEntries(params.entries()) as unknown as Record<string, unknown>;
      }

      logger.info("MERCADOPAGO_WEBHOOK", "Payload parseado", {
        action: (payload as any)?.action,
        type: (payload as any)?.type,
        dataId: (payload as any)?.data?.id,
      });
    } catch (error) {
      logger.error("MERCADOPAGO_WEBHOOK", "Payload invalido", error);
      logger.warn("MERCADOPAGO_WEBHOOK", "Retornando received=true apos payload invalido");
      return NextResponse.json({ received: true });
    }

    const action = payload.action as string | undefined;
    const data = payload.data as Record<string, unknown> | undefined;

    if (!action || !data?.id) {
      logger.warn("MERCADOPAGO_WEBHOOK", "Webhook ignorado: sem action ou data.id", undefined, {
        action,
        hasDataId: !!data?.id,
      });
      logger.info("MERCADOPAGO_WEBHOOK", "Retornando received=true apos acao invalida");
      return NextResponse.json({ received: true });
    }

    const dataId = String(data.id);
    const parsedSig = signatureHeader ? parseSignatureHeader(signatureHeader) : null;

    logger.info("MERCADOPAGO_WEBHOOK", "Iniciando validacao de assinatura", {
      dataId,
      ts: parsedSig?.ts,
      hasSecret: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
      environment: process.env.MERCADOPAGO_ENVIRONMENT,
    });

    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const env = (process.env.MERCADOPAGO_ENVIRONMENT || "production").toLowerCase();
    const isSandbox = env === "sandbox" || env === "test" || env === "dev";

    let signatureValid = true;

    if (!secret || isSandbox) {
      if (isSandbox) {
        logger.info("MERCADOPAGO_WEBHOOK", "Ambiente sandbox: validacao de assinatura desabilitada");
      }
    } else if (!parsedSig) {
      logger.warn("MERCADOPAGO_WEBHOOK", "Assinatura ausente mas secret configurado");
      signatureValid = false;
    } else {
      signatureValid = verifySignature(dataId, parsedSig.ts, parsedSig.v1);
    }

    logger.info("MERCADOPAGO_WEBHOOK", "Resultado da validacao", {
      signatureValid,
      hasSecret: !!secret,
      environment: env,
    });

    if (!signatureValid) {
      logger.warn("MERCADOPAGO_WEBHOOK", "Webhook rejeitado por assinatura invalida");
      logger.info("MERCADOPAGO_WEBHOOK", "Retornando Unauthorized");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const headers: Record<string, string | string[] | undefined> = {};
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });

    logger.info("MERCADOPAGO_WEBHOOK", "Chamando processWebhook");

    const provider = new MercadoPagoProvider();
    const event = await provider.processWebhook(payload, headers);

    logger.info("MERCADOPAGO_WEBHOOK", "Resultado processWebhook", {
      hasEvent: !!event,
      eventType: event?.event,
      paymentId: event?.paymentId,
      orderId: event?.orderId,
      status: event?.status,
    });

    if (!event) {
      logger.info("MERCADOPAGO_WEBHOOK", "Evento ignorado: nao foi possivel processar");
      logger.info("MERCADOPAGO_WEBHOOK", "Retornando received=true apos evento nulo");
      return NextResponse.json({ received: true });
    }

    logger.info("MERCADOPAGO_WEBHOOK", `Evento processado: ${event.event}`, {
      paymentId: event.paymentId,
      orderId: event.orderId,
      status: event.status,
    });

    if (event.status === "PAID") {
      logger.info("MERCADOPAGO_WEBHOOK", "Iniciando markOrderAsPaid", {
        orderId: event.orderId,
      });
      await markOrderAsPaid(event.orderId);
      logger.info("MERCADOPAGO_WEBHOOK", `Pagamento aprovado para pedido ${event.orderId}`);
    } else {
      logger.info("MERCADOPAGO_WEBHOOK", `Evento nao-PAID: ${event.event} para pedido ${event.orderId}`);
    }

    logger.info("MERCADOPAGO_WEBHOOK", "=== WEBHOOK FINALIZADO COM SUCESSO ===");
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("MERCADOPAGO_WEBHOOK", "Erro interno no processamento do webhook", error, {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    logger.info("MERCADOPAGO_WEBHOOK", "Retornando received=true apos erro");
    return NextResponse.json({ received: true });
  }
}
