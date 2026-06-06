import type { PaymentProvider } from "@/src/services/payment/interfaces/payment-provider.interface";
import type {
  CreatePaymentParams,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentWebhookEvent,
} from "@/src/services/payment/interfaces/payment.types";
import { PagBankService } from "./pagbank.service";
import { logger } from "@/src/lib/logger";

export class PagBankProvider implements PaymentProvider {
  readonly name = "pagbank";

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    logger.info("PAGBANK_PROVIDER", `Criando pagamento via PagBank para pedido ${params.orderId}`, {
      amount: params.amount,
    });

    const response = await PagBankService.createPixOrder(
      params.orderId,
      params.amount,
      params.customerName || "Cliente"
    );

    const qrCodeData = (response as any)?.qr_codes?.[0];
    if (!qrCodeData) {
      throw new Error("PagBank não retornou QR Code na resposta");
    }

    return {
      provider: "pagbank",
      paymentId: (response as any).id,
      qrCode: qrCodeData.links?.find((l: any) => l.rel === "QRCODE.PNG")?.href || "",
      pixCode: qrCodeData.text || "",
      status: "PENDING",
      expiresAt: qrCodeData.expiration_date,
      externalId: params.orderId,
      rawResponse: response as Record<string, unknown>,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentStatusResponse> {
    logger.info("PAGBANK_PROVIDER", `Consultando status do pagamento ${paymentId}`);

    return {
      provider: "pagbank",
      paymentId,
      status: "PENDING",
    };
  }

  async cancelPayment(paymentId: string): Promise<void> {
    logger.info("PAGBANK_PROVIDER", `Cancelando pagamento ${paymentId}`);
  }

  async processWebhook(
    payload: Record<string, unknown>,
    _headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentWebhookEvent | null> {
    const orderId = this.extractOrderId(payload);
    const status = this.extractStatus(payload);

    if (!orderId) {
      logger.warn("PAGBANK_PROVIDER", "Webhook recebido sem reference_id");
      return null;
    }

    const paymentId = ((payload as any).id || (payload as any).charges?.[0]?.id || "") as string;

    return {
      provider: "pagbank",
      event: status === "PAID" ? "payment.paid" : `payment.${status?.toLowerCase()}`,
      paymentId,
      orderId,
      status: status === "PAID" ? "PAID" : "PENDING",
      rawPayload: payload,
    };
  }

  validateConfiguration(): { valid: boolean; issues: string[] } {
    return PagBankService.validateConfiguration();
  }

  private extractOrderId(payload: Record<string, unknown>): string {
    const refId = (payload.reference_id || payload.reference || (payload as any).charges?.[0]?.reference_id) as string | undefined;
    if (!refId) return "";
    return refId.replace(/^ORDER-/, "");
  }

  private extractStatus(payload: Record<string, unknown>): string {
    return (payload.status || (payload as any).charges?.[0]?.status || "") as string;
  }
}
