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
    description?: string,
    accessToken?: string,
    applicationFee?: number
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

    if (applicationFee !== undefined && applicationFee > 0) {
      body.application_fee = applicationFee;
    }

    const idempotencyKey = orderId;
    const url = `${this.getBaseUrl()}/payments`;

    const logSafeBody = JSON.parse(JSON.stringify(body));
    const token = (accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN)?.trim() || "";
    logger.info("MERCADOPAGO", "Request Payload", {
      url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${maskToken(token)}`,
        "X-Idempotency-Key": idempotencyKey,
      },
      body: logSafeBody,
      amountOriginal: amount,
      amountInCents,
      amountInDecimals,
      hasApplicationFee: applicationFee !== undefined,
      applicationFee,
    });
    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Idempotency-Key": idempotencyKey,
      };

      const response = await fetchJson<CreatePixResponse>(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_CREATE_PIX",
      });

      const rawB64 = response.point_of_interaction?.transaction_data?.qr_code_base64 || "";
      const rawQrCode = response.point_of_interaction?.transaction_data?.qr_code || "";
      logger.info("MERCADOPAGO", "Response Success", {
        paymentId: response.id,
        status: response.status,
        hasQrCode: !!rawQrCode,
        hasBase64: !!rawB64,
        base64Length: rawB64.length,
        base64Preview: rawB64.substring(0, 30),
        qrCodeLength: rawQrCode.length,
        qrCodePreview: rawQrCode.substring(0, 30),
        hasDataUriPrefix: rawB64.startsWith("data:image/"),
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

  static async getPayment(paymentId: string, accessToken?: string): Promise<GetPaymentResponse> {
    const url = `${this.getBaseUrl()}/payments/${paymentId}`;
    const token = (accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN)?.trim() || "";

    logger.info("MERCADOPAGO", `Consultando pagamento ${paymentId}`);

    try {
      const response = await fetchJson<GetPaymentResponse>(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
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

  private static async oauthFetch(
    body: URLSearchParams,
    context: string
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("https://api.mercadopago.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        logger.error("MERCADOPAGO", `Erro na chamada OAuth [${context}]`, { status: response.status, body: errorBody });
        throw new Error(`Falha na chamada OAuth: ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async refreshToken(refreshToken: string): Promise<Record<string, unknown>> {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("MERCADOPAGO_CLIENT_ID e MERCADOPAGO_CLIENT_SECRET não configurados");
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    });

    return this.oauthFetch(body, "REFRESH_TOKEN");
  }

  static async exchangeAuthorizationCode(code: string): Promise<Record<string, unknown>> {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("MERCADOPAGO_CLIENT_ID, MERCADOPAGO_CLIENT_SECRET e MERCADOPAGO_REDIRECT_URI não configurados");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    return this.oauthFetch(body, "TOKEN_EXCHANGE");
  }

  static buildOAuthUrl(state: string): string {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new Error("MERCADOPAGO_CLIENT_ID e MERCADOPAGO_REDIRECT_URI não configurados");
    }

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      platform_id: "mp",
      redirect_uri: redirectUri,
      state,
    });

    return `https://auth.mercadopago.com.br/authorization?${params.toString()}`;
  }

  static calculateExpiresAt(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
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
