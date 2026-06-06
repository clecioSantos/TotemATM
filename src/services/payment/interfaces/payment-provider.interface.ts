import type {
  CreatePaymentParams,
  PaymentResponse,
  PaymentStatusResponse,
  PaymentWebhookEvent,
} from "./payment.types";

export interface PaymentProvider {
  readonly name: string;

  createPayment(params: CreatePaymentParams): Promise<PaymentResponse>;

  getPayment(paymentId: string): Promise<PaymentStatusResponse>;

  cancelPayment(paymentId: string): Promise<void>;

  processWebhook(payload: Record<string, unknown>, headers: Record<string, string | string[] | undefined>): Promise<PaymentWebhookEvent | null>;

  validateConfiguration(): { valid: boolean; issues: string[] };
}
