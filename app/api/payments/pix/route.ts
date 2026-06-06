import { NextRequest, NextResponse } from "next/server";
import { PagBankService } from "../../../services/pagbank/pagbank.service";
import { logger } from "@/src/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, amount, customerName } = body;

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, error: "orderId e amount são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanOrderId = orderId.replace(/^ORDER-/, "");

    const pagbankOrder = await PagBankService.createPixOrder(cleanOrderId, amount, customerName) as any;

    if (!pagbankOrder?.qr_codes?.[0]) {
      const hasError = !!pagbankOrder?.error_messages?.length;
      logger.error("API_PIX", "Resposta do PagBank não contém QR Code", {
        orderId: cleanOrderId,
        hasErrorMessages: hasError,
        errorMessages: hasError ? pagbankOrder.error_messages : undefined,
        responseKeys: Object.keys(pagbankOrder || {}),
      });
      return NextResponse.json(
        {
          success: false,
          error: hasError
            ? `PagBank: ${pagbankOrder.error_messages[0]?.description || "erro desconhecido"}`
            : "QR Code não disponível. Tente novamente.",
        },
        { status: hasError ? 502 : 502 }
      );
    }

    const qrCodeData = pagbankOrder.qr_codes[0];
    const copyPaste = qrCodeData.text;
    const qrCodeImage = qrCodeData.links?.find((l: any) => l.rel === "QRCODE.PNG")?.href;

    if (process.env.PAGBANK_API_URL?.includes("sandbox")) {
      const timeoutId = setTimeout(() => {
        PagBankService.simulateSandboxPayment(pagbankOrder.id)
          .then(() => logger.info("PIX_ROUTE", `Simulação concluída para ${pagbankOrder.id}`))
          .catch(err => logger.error("PIX_ROUTE", "Falha no agendamento da simulação", err));
      }, 10000);
      if (typeof timeoutId === "object" && "unref" in timeoutId) {
        (timeoutId as any).unref();
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: pagbankOrder.id,
      pixCopyPaste: copyPaste,
      pixQrCode: qrCodeImage,
    });
  } catch (error: any) {
    const httpStatus = error?.status;
    const responseData = error?.responseData;

    logger.error("API_PIX", "Erro ao criar pagamento PIX", error, {
      endpoint: "/api/payments/pix",
      httpStatus,
      responseData,
      nodeEnv: process.env.NODE_ENV,
      isSandbox: process.env.PAGBANK_API_URL?.includes("sandbox"),
    });

    const userMessage = httpStatus === 401 || httpStatus === 403
      ? "Erro de autenticação com o gateway de pagamento."
      : "Erro ao gerar pagamento";

    return NextResponse.json(
      { success: false, error: userMessage },
      { status: httpStatus || 500 }
    );
  }
}
