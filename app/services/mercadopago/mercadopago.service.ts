import { logger } from "@/src/lib/logger";
import { fetchJson } from "@/src/lib/fetch-with-timeout";

const MERCADOPAGO_TIMEOUT_MS = 20000;
const MERCADOPAGO_API_URL = "https://api.mercadopago.com/v1";

function toCents(value: number): number {
  return Math.round(value * 100);
}

interface CreatePixResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  description: string;
  point_of_interaction: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  payer: { email: string };
  external_reference?: string;
  date_of_expiration?: string;
}

interface GetPaymentResponse {
  id: number;
  status: string;
  status_detail: string;
  transaction_amount: number;
  external_reference?: string;
}

function maskToken(token: string): string {
  if (token.length <= 8) return "***";
  return token.substring(0, 4) + "..." + token.substring(token.length - 4);
}

export class MercadoPagoService {
  private static getAccessToken(): string {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
    }
    return token;
  }

  private static getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getAccessToken()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  private static getBaseUrl(): string {
    return MERCADOPAGO_API_URL;
  }

  static validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!token) {
      issues.push("MERCADOPAGO_ACCESS_TOKEN ausente");
    } else if (token.length < 10) {
      issues.push(`MERCADOPAGO_ACCESS_TOKEN muito curto (${token.length} caracteres)`);
    }

    return { valid: issues.length === 0, issues };
  }

  static async createPixOrder(
    orderId: string,
    amount: number,
    payerEmail?: string,
    description?: string
  ): Promise<CreatePixResponse> {
    const amountInCents = toCents(amount);
    const amountInDecimals = amountInCents / 100;

    const body: Record<string, unknown> = {
      transaction_amount: amountInDecimals,
      description: description || `Pedido ${orderId}`,
      payment_method_id: "pix",
      payer: {
        email: payerEmail || "cliente@exemplo.com",
      },
      external_reference: orderId,
    };

    const url = `${this.getBaseUrl()}/payments`;

    const logSafeBody = JSON.parse(JSON.stringify(body));
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";
    logger.info("MERCADOPAGO", "Request Payload", {
      url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${maskToken(token)}`,
      },
      body: logSafeBody,
      amountOriginal: amount,
      amountInCents,
      amountInDecimals,
    });

    try {
      const response = await fetchJson<CreatePixResponse>(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_CREATE_PIX",
      });

      logger.info("MERCADOPAGO", "Response Success", {
        paymentId: response.id,
        status: response.status,
        hasQrCode: !!response.point_of_interaction?.transaction_data?.qr_code,
      });

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const err = error as Error & { status?: number; responseData?: unknown };

      logger.error("MERCADOPAGO", "Response Error", error, {
        httpStatus: err.status,
        responseData: err.responseData,
        sentPayload: body,
      });

      if (errorMessage.includes("Timeout")) {
        const timeoutErr = new Error("O serviço de pagamento está temporariamente indisponível. Tente novamente.") as Error & { status: number };
        timeoutErr.status = 504;
        throw timeoutErr;
      }

      const httpStatus = err.status || 500;
      const apiMessage = err.responseData
        ? `MercadoPago [${httpStatus}]: ${JSON.stringify(err.responseData)}`
        : errorMessage;

      const finalErr = new Error(apiMessage) as Error & { status: number };
      finalErr.status = httpStatus;
      throw finalErr;
    }
  }

  static async getPayment(paymentId: string): Promise<GetPaymentResponse> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}`;

    logger.info("MERCADOPAGO", `Consultando pagamento ${paymentId}`);

    try {
      const response = await fetchJson<GetPaymentResponse>(url, {
        method: "GET",
        headers: this.getHeaders(),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_GET_PAYMENT",
      });

      logger.info("MERCADOPAGO", `Status do pagamento ${paymentId}: ${response.status}`);

      return response;
    } catch (error) {
      logger.error("MERCADOPAGO", `Erro ao consultar pagamento ${paymentId}`, error);
      throw error;
    }
  }

  static mapStatus(mpStatus: string): string {
    switch (mpStatus) {
      case "approved":
        return "PAID";
      case "pending":
      case "in_process":
        return "PENDING";
      case "rejected":
        return "FAILED";
      case "cancelled":
        return "CANCELLED";
      case "refunded":
        return "REFUNDED";
      case "expired":
        return "EXPIRED";
      default:
        return "PENDING";
    }
  }
}
