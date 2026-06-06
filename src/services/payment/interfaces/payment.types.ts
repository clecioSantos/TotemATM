export type PaymentProviderName = "pagbank" | "abacatepay";

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED" | "REFUNDED" | "FAILED";

export interface CreatePaymentParams {
  orderId: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerTaxId?: string;
  customerPhone?: string;
  description?: string;
}

export interface PaymentResponse {
  provider: PaymentProviderName;
  paymentId: string;
  qrCode: string;
  pixCode: string;
  status: PaymentStatus;
  expiresAt?: string;
  externalId?: string;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentStatusResponse {
  provider: PaymentProviderName;
  paymentId: string;
  status: PaymentStatus;
  externalId?: string;
  rawResponse?: Record<string, unknown>;
}

export interface PaymentWebhookEvent {
  provider: PaymentProviderName;
  event: string;
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  rawPayload: Record<string, unknown>;
}
