import { NextRequest, NextResponse } from "next/server";
import { PaymentProviderFactory } from "@/src/services/payment/payment-provider.factory";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 10);
  let requestBody: Record<string, unknown> = {};

  try {
    requestBody = await req.json();
    const orderId = requestBody.orderId as string | undefined;
    const amount = requestBody.amount as number | undefined;
    const customerName = requestBody.customerName as string | undefined;
    const customerEmail = requestBody.customerEmail as string | undefined;
    const customerTaxId = requestBody.customerTaxId as string | undefined;
    const customerPhone = requestBody.customerPhone as string | undefined;
    const description = requestBody.description as string | undefined;

    logger.info("API_PIX", `[${requestId}] Iniciando criação de pagamento`, {
      orderId,
      amount,
      hasCustomerName: !!customerName,
      provider: process.env.PAYMENT_PROVIDER || "pagbank",
    });

    if (!orderId || !amount) {
      logger.warn("API_PIX", `[${requestId}] orderId ou amount ausentes`, undefined, { orderId, amount });
      return NextResponse.json(
        { success: false, error: "orderId e amount são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.replace(/^ORDER-/, "");
    logger.info("API_PIX", `[${requestId}] Obtendo provider da factory`);
    const provider = PaymentProviderFactory.create();
    logger.info("API_PIX", `[${requestId}] Provider ativo: ${provider.name}`);

    logger.info("API_PIX", `[${requestId}] Chamando provider.createPayment`, {
      cleanOrderId,
      amount,
    });

    const payment = await provider.createPayment({
      orderId: cleanOrderId,
      amount,
      customerName,
      customerEmail,
      customerTaxId,
      customerPhone,
      description,
    });

    logger.info("API_PIX", `[${requestId}] Pagamento criado com sucesso`, {
      provider: payment.provider,
      paymentId: payment.paymentId,
      status: payment.status,
      hasQrCode: !!payment.qrCode,
      hasPixCode: !!payment.pixCode,
    });

    if (provider.name === "pagbank") {
      const envUrl = process.env.PAGBANK_API_URL;
      if (envUrl?.includes("sandbox")) {
        logger.info("API_PIX", `[${requestId}] Agendando simulação PagBank`);
        const { PagBankService } = await import("../../../services/pagbank/pagbank.service");
        const timeoutId = setTimeout(() => {
          PagBankService.simulateSandboxPayment(payment.paymentId)
            .then(() => logger.info("API_PIX", `[${requestId}] Simulação PagBank concluída para ${payment.paymentId}`))
            .catch(err => logger.error("API_PIX", `[${requestId}] Falha na simulação PagBank`, err));
        }, 10000);
        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
    }

    if (provider.name === "abacatepay") {
      const apiKey = process.env.ABACATEPAY_API_KEY?.trim() || "";
      const isDevKey = apiKey.toLowerCase().includes("dev") || apiKey.toLowerCase().includes("test") || apiKey.toLowerCase().includes("sandbox");
      if (isDevKey) {
        logger.info("ABACATEPAY_MOCK", `[${requestId}] Mock payment scheduled`, {
          paymentId: payment.paymentId,
          orderId: cleanOrderId,
          delay: 5000,
        });

        const timeoutId = setTimeout(async () => {
          try {
            const { markOrderAsPaid } = await import(
              "@/src/services/payment/services/order-payment.service"
            );
            const result = await markOrderAsPaid(cleanOrderId);

            if (result) {
              logger.info("ABACATEPAY_MOCK", `[${requestId}] Mock payment approved`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
              });
            } else {
              logger.warn("ABACATEPAY_MOCK", `[${requestId}] Mock payment skipped (already paid or order not found)`, {
                paymentId: payment.paymentId,
                orderId: cleanOrderId,
              });
            }
          } catch (err) {
            logger.error("ABACATEPAY_MOCK", `[${requestId}] Mock payment failed`, err, {
              paymentId: payment.paymentId,
              orderId: cleanOrderId,
            });
          }
        }, 5000);

        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
    }

    return NextResponse.json({
      success: true,
      provider: payment.provider,
      paymentId: payment.paymentId,
      qrCode: payment.qrCode,
      pixCode: payment.pixCode,
      status: payment.status,
      expiresAt: payment.expiresAt,
      pixQrCode: payment.qrCode,
      pixCopyPaste: payment.pixCode,
    });
  } catch (error: any) {
    const httpStatus = error?.status;
    const responseData = error?.responseData;
    const providerName = PaymentProviderFactory.getProviderName();

    logger.error("API_PIX", `[${requestId}] Erro ao criar pagamento PIX`, error, {
      endpoint: "/api/payments/pix",
      provider: providerName,
      httpStatus,
      responseData,
      errorMessage: error?.message || String(error),
      errorStack: error?.stack,
      requestBody,
      nodeEnv: process.env.NODE_ENV,
      hasAbacateKey: !!process.env.ABACATEPAY_API_KEY,
      hasPagbankToken: !!process.env.PAGBANK_TOKEN,
      paymentProvider: process.env.PAYMENT_PROVIDER,
    });

    const userMessage = httpStatus === 401 || httpStatus === 403
      ? "Erro de autenticação com o gateway de pagamento."
      : error?.message || "Erro ao gerar pagamento";

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: httpStatus || 500 }
    );
  }
}
