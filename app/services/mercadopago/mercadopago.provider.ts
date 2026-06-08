import type { PaymentProvider } from "@/src/services/payment/interfaces/payment-provider.interface";
import type {
  CreatePaymentParams,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentWebhookEvent,
} from "@/src/services/payment/interfaces/payment.types";
import { MercadoPagoService } from "./mercadopago.service";
import { logger } from "@/src/lib/logger";

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago";

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    const tokenLabel = params.accessToken
      ? "utilizando token da loja"
      : "utilizando token global";

    logger.info("MERCADOPAGO_PROVIDER", `Criando pagamento via Mercado Pago para pedido ${params.orderId}`, {
      amount: params.amount,
      tokenMode: tokenLabel,
      hasApplicationFee: params.applicationFee !== undefined,
      applicationFee: params.applicationFee,
    });

    const response = await MercadoPagoService.createPixOrder(
      params.orderId,
      params.amount,
      params.customerEmail,
      params.description,
      params.accessToken,
      params.applicationFee
    );

    const txData = response.point_of_interaction?.transaction_data;
    let rawB64 = txData?.qr_code_base64 || "";
    const pixCode = txData?.qr_code || "";

    if (rawB64 && !rawB64.startsWith("data:image/")) {
      rawB64 = `data:image/png;base64,${rawB64}`;
    }

    logger.info("MERCADOPAGO_PROVIDER", "PIX_SPLIT", {
      paymentId: response.id,
      base64Length: rawB64.length,
      pixCodeLength: pixCode.length,
      hasApplicationFee: params.applicationFee !== undefined,
      applicationFee: params.applicationFee,
      amount: params.amount,
    });

    return {
      provider: "mercadopago",
      paymentId: String(response.id),
      qrCode: rawB64,
      pixCode,
      status: MercadoPagoService.mapStatus(response.status) as any,
      expiresAt: response.date_of_expiration,
      externalId: params.orderId,
      rawResponse: response as unknown as Record<string, unknown>,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentStatusResponse> {
    const result = await MercadoPagoService.getPayment(paymentId);

    return {
      provider: "mercadopago",
      paymentId,
      status: MercadoPagoService.mapStatus(result.status) as any,
      externalId: result.external_reference,
    };
  }

  async cancelPayment(paymentId: string): Promise<void> {
    logger.info("MERCADOPAGO_PROVIDER", `Cancelando pagamento ${paymentId}`);
  }

  async processWebhook(
    payload: Record<string, unknown>,
    _headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentWebhookEvent | null> {
    const data = (payload as any).data as Record<string, unknown> | undefined;
    if (!data?.id) {
      logger.warn("MERCADOPAGO_PROVIDER", "Webhook sem data.id");
      return null;
    }

    const mpPaymentId = String(data.id);

    let paymentData;
    let orderId = "";
    let paymentStatus = "pending";
    try {
      paymentData = await MercadoPagoService.getPayment(mpPaymentId);
      orderId = (paymentData.external_reference || "").replace(/^ORDER-/, "");
      paymentStatus = paymentData.status;
    } catch (error) {
      const fallbackRef = (payload.external_reference as string || "").replace(/^ORDER-/, "");
      if (fallbackRef) {
        logger.info("MERCADOPAGO_PROVIDER", `API indisponível, usando fallback do payload para pedido ${fallbackRef}`);
        orderId = fallbackRef;
        paymentStatus = "approved";
      } else {
        logger.error("MERCADOPAGO_PROVIDER", `Erro ao consultar pagamento ${mpPaymentId} no webhook`, error);
        return null;
      }
    }

    if (!orderId) {
      logger.warn("MERCADOPAGO_PROVIDER", `Pagamento ${mpPaymentId} sem external_reference`);
      return null;
    }

    return {
      provider: "mercadopago",
      event: (payload.action as string) || "payment.unknown",
      paymentId: mpPaymentId,
      orderId,
      status: MercadoPagoService.mapStatus(paymentStatus) as any,
      rawPayload: payload,
    };
  }

  validateConfiguration(): { valid: boolean; issues: string[] } {
    return MercadoPagoService.validateConfiguration();
  }
}
