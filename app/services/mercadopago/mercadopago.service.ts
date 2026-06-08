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

interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user_id: number;
  public_key: string;
  live_mode: boolean;
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

  private static getHeaders(token?: string): Record<string, string> {
    const accessToken = token || this.getAccessToken();
    return {
      Authorization: `Bearer ${accessToken}`,
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
      body.application_fee = Math.round(applicationFee * 100) / 100;
    }

    const idempotencyKey = orderId;
    const url = `${this.getBaseUrl()}/payments`;

    const tokenToUse = accessToken || this.getAccessToken();
    const logSafeBody = JSON.parse(JSON.stringify(body));
    logger.info("MERCADOPAGO", "Request Payload", {
      url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${maskToken(tokenToUse)}`,
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
      const response = await fetchJson<CreatePixResponse>(url, {
        method: "POST",
        headers: {
          ...this.getHeaders(tokenToUse),
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_CREATE_PIX",
      });

      const rawB64 = response.point_of_interaction?.transaction_data?.qr_code_base64 || "";
      const rawQrCode = response.point_of_interaction?.transaction_data?.qr_code || "";
      logger.info("MERCADOPAGO", "PIX_CREATE", {
        paymentId: response.id,
        status: response.status,
        hasQrCode: !!rawQrCode,
        hasBase64: !!rawB64,
        base64Length: rawB64.length,
        qrCodeLength: rawQrCode.length,
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

    logger.info("MERCADOPAGO", `Consultando pagamento ${paymentId}`);

    try {
      const response = await fetchJson<GetPaymentResponse>(url, {
        method: "GET",
        headers: this.getHeaders(accessToken),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_GET_PAYMENT",
      });

      logger.info("MERCADOPAGO", `PAYMENT_UPDATED`, {
        paymentId,
        status: response.status,
        transactionAmount: response.transaction_amount,
      });

      return response;
    } catch (error) {
      logger.error("MERCADOPAGO", `Erro ao consultar pagamento ${paymentId}`, error);
      throw error;
    }
  }

  static async refreshToken(refreshToken: string): Promise<OAuthTokenResponse> {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();

    if (!clientId || !clientSecret) {
      throw new Error("MERCADOPAGO_CLIENT_ID ou MERCADOPAGO_CLIENT_SECRET não configurados");
    }

    const url = "https://api.mercadopago.com/oauth/token";

    logger.info("MERCADOPAGO", "OAUTH_REFRESH", {
      hasClientId: !!clientId,
    });

    try {
      const response = await fetchJson<OAuthTokenResponse>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_secret: clientSecret,
          client_id: clientId,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_REFRESH_TOKEN",
      });

      logger.info("MERCADOPAGO", "OAUTH_REFRESH", {
        userId: response.user_id,
        expiresIn: response.expires_in,
        liveMode: response.live_mode,
        hasAccessToken: !!response.access_token,
        hasRefreshToken: !!response.refresh_token,
      });

      return response;
    } catch (error) {
      const err = error as Error & { status?: number; responseData?: unknown };
      logger.error("MERCADOPAGO", "OAUTH_REFRESH_ERROR", error, {
        httpStatus: err.status,
        responseData: err.responseData,
      });
      throw error;
    }
  }

  static async exchangeAuthorizationCode(code: string): Promise<OAuthTokenResponse> {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET?.trim();
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI?.trim();

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("MERCADOPAGO_CLIENT_ID, CLIENT_SECRET e REDIRECT_URI devem estar configurados");
    }

    const url = "https://api.mercadopago.com/oauth/token";

    logger.info("MERCADOPAGO", "OAUTH_TOKEN_EXCHANGE", {
      hasClientId: !!clientId,
      hasRedirectUri: !!redirectUri,
    });

    try {
      const response = await fetchJson<OAuthTokenResponse>(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_secret: clientSecret,
          client_id: clientId,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
        timeout: MERCADOPAGO_TIMEOUT_MS,
        context: "MERCADOPAGO_TOKEN_EXCHANGE",
      });

      logger.info("MERCADOPAGO", "OAUTH_TOKEN_EXCHANGE", {
        userId: response.user_id,
        expiresIn: response.expires_in,
        liveMode: response.live_mode,
        hasAccessToken: !!response.access_token,
        hasRefreshToken: !!response.refresh_token,
      });

      return response;
    } catch (error) {
      const err = error as Error & { status?: number; responseData?: unknown };
      logger.error("MERCADOPAGO", "OAUTH_TOKEN_EXCHANGE_ERROR", error, {
        httpStatus: err.status,
        responseData: err.responseData,
      });
      throw error;
    }
  }

  static buildOAuthUrl(state: string): string {
    const clientId = process.env.MERCADOPAGO_CLIENT_ID?.trim();
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI?.trim();

    if (!clientId || !redirectUri) {
      throw new Error("MERCADOPAGO_CLIENT_ID e MERCADOPAGO_REDIRECT_URI devem estar configurados");
    }

    const baseUrl = "https://auth.mercadopago.com/authorization";
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      platform_id: "mp",
      redirect_uri: redirectUri,
      state,
    });

    return `${baseUrl}?${params.toString()}`;
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

  static calculateExpiresAt(expiresIn: number): Date {
    return new Date(Date.now() + expiresIn * 1000);
  }
}
