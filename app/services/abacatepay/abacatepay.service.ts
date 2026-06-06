import { logger } from "@/src/lib/logger";
import { fetchJson } from "@/src/lib/fetch-with-timeout";

const ABACATEPAY_TIMEOUT_MS = 20000;
const ABACATEPAY_API_URL = "https://api.abacatepay.com/v2";

function toCents(value: number): number {
  return Math.round(value * 100);
}

interface CreatePixResponse {
  data: {
    id: string;
    amount: number;
    status: string;
    devMode: boolean;
    brCode: string;
    brCodeBase64: string;
    platformFee: number;
    receiptUrl: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, unknown>;
  };
  success: boolean;
  error: string | null;
}

interface CheckStatusResponse {
  data: {
    id: string;
    status: string;
    expiresAt: string;
  };
  success: boolean;
  error: string | null;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return "***";
  return key.substring(0, 4) + "..." + key.substring(key.length - 4);
}

export class AbacatePayService {
  private static getApiKey(): string {
    const key = process.env.ABACATEPAY_API_KEY?.trim();
    if (!key) {
      throw new Error("ABACATEPAY_API_KEY não configurada");
    }
    return key;
  }

  private static getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.getApiKey()}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  static validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    const apiKey = process.env.ABACATEPAY_API_KEY?.trim();
    if (!apiKey) {
      issues.push("ABACATEPAY_API_KEY ausente");
    } else if (apiKey.length < 10) {
      issues.push(`ABACATEPAY_API_KEY muito curta (${apiKey.length} caracteres)`);
    }

    return { valid: issues.length === 0, issues };
  }

  static async createPixOrder(
    orderId: string,
    amount: number,
    customerName?: string,
    customerEmail?: string,
    customerTaxId?: string,
    customerPhone?: string,
    description?: string
  ): Promise<CreatePixResponse["data"]> {
    const amountInCents = toCents(amount);

    const dataPayload: Record<string, unknown> = {
      amount: amountInCents,
      expiresIn: 1800,
      metadata: {
        pedidoId: orderId,
      },
    };

    if (description) {
      dataPayload.description = description;
    }

    const hasAllCustomerFields = !!(customerName && customerTaxId && customerEmail && customerPhone);
    if (hasAllCustomerFields) {
      dataPayload.customer = {
        name: customerName,
        taxId: customerTaxId,
        email: customerEmail,
        cellphone: customerPhone,
      };
    }

    const body: Record<string, unknown> = {
      method: "PIX",
      data: dataPayload,
    };

    const url = `${ABACATEPAY_API_URL}/transparents/create`;

    const logSafeBody = JSON.parse(JSON.stringify(body));
    const key = process.env.ABACATEPAY_API_KEY?.trim() || "";
    logger.info("ABACATEPAY", "Request Payload", {
      url,
      method: "POST",
      headers: {
        Authorization: `Bearer ${maskApiKey(key)}`,
        "Content-Type": "application/json",
      },
      body: logSafeBody,
      amountOriginal: amount,
      amountInCents,
    });

    try {
      const response = await fetchJson<CreatePixResponse>(url, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(body),
        timeout: ABACATEPAY_TIMEOUT_MS,
        context: "ABACATEPAY_CREATE_PIX",
      });

      logger.info("ABACATEPAY", "Response Success", {
        paymentId: response.data?.id,
        status: response.data?.status,
        devMode: response.data?.devMode,
      });

      logger.info("ABACATEPAY", `Checkout criado com sucesso: ${orderId}`, {
        paymentId: response.data.id,
        status: response.data.status,
        devMode: response.data.devMode,
      });

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const err = error as Error & { status?: number; responseData?: unknown };

      logger.error("ABACATEPAY", "Response Error", error, {
        httpStatus: err.status,
        responseData: err.responseData,
        sentPayload: body,
        amountOriginal: amount,
        amountInCents,
      });

      if (errorMessage.includes("Timeout")) {
        logger.error("ABACATEPAY", `Timeout ao criar checkout para pedido ${orderId}`, error, {
          timeout: ABACATEPAY_TIMEOUT_MS,
        });
        throw new Error("O serviço de pagamento está temporariamente indisponível. Tente novamente.");
      }

      const apiError =
        err.status && err.responseData
          ? `AbacatePay [${err.status}]: ${JSON.stringify(err.responseData)}`
          : errorMessage;

      throw new Error(apiError);
    }
  }

  static async checkStatus(paymentId: string): Promise<CheckStatusResponse["data"]> {
    const url = `${ABACATEPAY_API_URL}/transparents/check?id=${encodeURIComponent(paymentId)}`;

    logger.info("ABACATEPAY", `Consultando status do checkout ${paymentId}`);

    try {
      const response = await fetchJson<CheckStatusResponse>(url, {
        method: "GET",
        headers: this.getHeaders(),
        timeout: ABACATEPAY_TIMEOUT_MS,
        context: "ABACATEPAY_CHECK_STATUS",
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || "Falha ao consultar status");
      }

      return response.data;
    } catch (error) {
      logger.error("ABACATEPAY", `Erro ao consultar status do checkout ${paymentId}`, error);
      throw error;
    }
  }

  static async simulatePayment(paymentId: string): Promise<void> {
    const apiKey = process.env.ABACATEPAY_API_KEY?.trim() || "";
    const isDevKey =
      apiKey.toLowerCase().includes("dev") ||
      apiKey.toLowerCase().includes("test") ||
      apiKey.toLowerCase().includes("sandbox");

    if (!isDevKey) {
      logger.warn("ABACATEPAY_SIMULATE", "Simulação abortada: chave não parece ser de desenvolvimento");
      return;
    }

    const url = `${ABACATEPAY_API_URL}/transparents/simulate-payment?id=${encodeURIComponent(paymentId)}`;

    logger.info("ABACATEPAY_SIMULATE", `Simulando pagamento para checkout ${paymentId}`);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        logger.info("ABACATEPAY_SIMULATE", `Pagamento simulado para ${paymentId}`);
      } else {
        const text = await response.text().catch(() => "");
        logger.warn(
          "ABACATEPAY_SIMULATE",
          `Simulação pode não ter funcionado para ${paymentId}`,
          undefined,
          {
            status: response.status,
            body: text.substring(0, 500),
          }
        );
      }
    } catch (error) {
      logger.error("ABACATEPAY_SIMULATE", `Erro ao simular pagamento para ${paymentId}`, error);
    }
  }
}
