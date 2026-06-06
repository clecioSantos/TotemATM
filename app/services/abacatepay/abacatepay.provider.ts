import type { PaymentProvider } from "@/src/services/payment/interfaces/payment-provider.interface";
import type {
  CreatePaymentParams,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentWebhookEvent,
} from "@/src/services/payment/interfaces/payment.types";
import { AbacatePayService } from "./abacatepay.service";
import { logger } from "@/src/lib/logger";

const ABACATEPAY_PUBLIC_KEY =
  "t9dXRhHHo3yDEj5pVDYz0frf7q6bMKyMRmxxCPIPp3RCplBfXRxqlC6ZpiWmOqj4L63qEaeUOtrCI8P0VMUgo6iIga2ri9ogaHFs0WIIywSMg0q7RmBfybe1E5XJcfC4IW3alNqym0tXoAKkzvfEjZxV6bE0oG2zJrNNYmUCKZyV0KZ3JS8Votf9EAWWYdiDkMkpbMdPggfh1EqHlVkMiTady6jOR3hyzGEHrIz2Ret0xHKMbiqkr9HS1JhNHDX9";

export class AbacatePayProvider implements PaymentProvider {
  readonly name = "abacatepay";

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    logger.info("ABACATEPAY_PROVIDER", `Criando pagamento via AbacatePay para pedido ${params.orderId}`, {
      amount: params.amount,
    });

    const result = await AbacatePayService.createPixOrder(
      params.orderId,
      params.amount,
      params.customerName,
      params.customerEmail,
      params.customerTaxId,
      params.customerPhone,
      params.description
    );

    return {
      provider: "abacatepay",
      paymentId: result.id,
      qrCode: result.brCodeBase64 || "",
      pixCode: result.brCode || "",
      status: (result.status as any) || "PENDING",
      expiresAt: result.expiresAt,
      externalId: params.orderId,
      rawResponse: result as unknown as Record<string, unknown>,
    };
  }

  async getPayment(paymentId: string): Promise<PaymentStatusResponse> {
    const result = await AbacatePayService.checkStatus(paymentId);

    return {
      provider: "abacatepay",
      paymentId: result.id,
      status: (result.status as any) || "PENDING",
    };
  }

  async cancelPayment(paymentId: string): Promise<void> {
    logger.info("ABACATEPAY_PROVIDER", `Cancelando checkout ${paymentId}`);
  }

  async processWebhook(
    payload: Record<string, unknown>,
    headers: Record<string, string | string[] | undefined>
  ): Promise<PaymentWebhookEvent | null> {
    const event = payload.event as string | undefined;
    if (!event) {
      logger.warn("ABACATEPAY_PROVIDER", "Webhook sem campo event");
      return null;
    }

    const transparentData = (payload as any).data?.transparent as Record<string, unknown> | undefined;
    if (!transparentData) {
      logger.warn("ABACATEPAY_PROVIDER", "Webhook sem data.transparent");
      return null;
    }

    const paymentId = transparentData.id as string;
    const externalId = transparentData.externalId as string;
    const status = transparentData.status as string;

    if (!externalId) {
      logger.warn("ABACATEPAY_PROVIDER", "Webhook sem externalId (orderId)");
      return null;
    }

    const orderId = externalId.replace(/^ORDER-/, "");

    return {
      provider: "abacatepay",
      event,
      paymentId,
      orderId,
      status: status === "PAID" ? "PAID" : "PENDING",
      rawPayload: payload,
    };
  }

  validateConfiguration(): { valid: boolean; issues: string[] } {
    return AbacatePayService.validateConfiguration();
  }

  static verifySignature(rawBody: string, signatureFromHeader: string | undefined): boolean {
    if (!signatureFromHeader) return false;

    try {
      const mod = require("crypto") as typeof import("crypto");
      const expectedSig = mod
        .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
        .update(Buffer.from(rawBody, "utf8"))
        .digest("base64");

      const A = Buffer.from(expectedSig);
      const B = Buffer.from(signatureFromHeader);

      return A.length === B.length && mod.timingSafeEqual(A, B);
    } catch {
      return false;
    }
  }
}
