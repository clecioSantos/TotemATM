import { NextRequest, NextResponse } from "next/server";
import { PaymentProviderFactory } from "@/src/services/payment/payment-provider.factory";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName, customerEmail, customerTaxId, customerPhone, description } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "orderId e amount são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.replace(/^ORDER-/, "");
    const provider = PaymentProviderFactory.create();

    const payment = await provider.createPayment({
      orderId: cleanOrderId,
      amount,
      customerName,
      customerEmail,
      customerTaxId,
      customerPhone,
      description,
    });

    if (provider.name === "pagbank") {
      const envUrl = process.env.PAGBANK_API_URL;
      if (envUrl?.includes("sandbox")) {
        const { PagBankService } = await import("../../../services/pagbank/pagbank.service");
        const timeoutId = setTimeout(() => {
          PagBankService.simulateSandboxPayment(payment.paymentId)
            .then(() => logger.info("PIX_ROUTE", `Simulação concluída para ${payment.paymentId}`))
            .catch(err => logger.error("PIX_ROUTE", "Falha no agendamento da simulação", err));
        }, 10000);
        if (typeof timeoutId === "object" && "unref" in timeoutId) {
          (timeoutId as any).unref();
        }
      }
    }

    if (provider.name === "abacatepay") {
      const isDevKey = process.env.ABACATEPAY_API_KEY?.trim()?.toLowerCase().includes("dev")
        || process.env.ABACATEPAY_API_KEY?.trim()?.toLowerCase().includes("test");
      if (isDevKey) {
        const { AbacatePayService } = await import("../../../services/abacatepay/abacatepay.service");
        const timeoutId = setTimeout(() => {
          AbacatePayService.simulatePayment(payment.paymentId)
            .then(() => logger.info("PIX_ROUTE", `Simulação AbacatePay concluída para ${payment.paymentId}`))
            .catch(err => logger.error("PIX_ROUTE", "Falha na simulação AbacatePay", err));
        }, 10000);
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

    logger.error("API_PIX", "Erro ao criar pagamento PIX", error, {
      endpoint: "/api/payments/pix",
      provider: providerName,
      httpStatus,
      responseData,
      nodeEnv: process.env.NODE_ENV,
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
