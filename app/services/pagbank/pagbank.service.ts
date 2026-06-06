import { logger } from "@/src/lib/logger";
import { fetchJson } from "@/src/lib/fetch-with-timeout";

const PAGBANK_TIMEOUT_MS = 20000;

export class PagBankService {
  private static baseUrl = process.env.PAGBANK_API_URL?.replace(/\/+$/, "");
  private static token = process.env.PAGBANK_TOKEN?.trim();
  private static webhookUrl = process.env.PAGBANK_WEBHOOK_URL;

  static validateConfiguration(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!this.token) {
      issues.push("PAGBANK_TOKEN ausente");
    } else if (this.token.length < 10) {
      issues.push(`PAGBANK_TOKEN muito curto (${this.token.length} caracteres)`);
    }

    if (!this.baseUrl) {
      issues.push("PAGBANK_API_URL ausente");
    } else if (!this.baseUrl.includes("pagseguro.com")) {
      issues.push(`PAGBANK_API_URL não parece ser do PagSeguro: ${this.baseUrl}`);
    } else if (this.baseUrl.includes("sandbox") && this.baseUrl.includes("api.") && !this.baseUrl.includes("sandbox.api.")) {
      issues.push("PAGBANK_API_URL pode ter formato incorreto");
    }

    const isProductionUrl = this.baseUrl?.includes("api.pagseguro.com") && !this.baseUrl?.includes("sandbox");
    if (isProductionUrl && this.token) {
      logger.info("PAGBANK_VALIDATE", "Ambiente Produção detectado", {
        tokenLength: this.token.length,
        tokenPrefix: this.token.substring(0, 8) + "...",
        url: this.baseUrl,
      });
    } else if (this.baseUrl?.includes("sandbox")) {
      logger.info("PAGBANK_VALIDATE", "Ambiente Sandbox detectado", {
        tokenLength: this.token?.length || 0,
        url: this.baseUrl,
      });
    }

    return { valid: issues.length === 0, issues };
  }

  private static validateConfig(): void {
    const missing: string[] = [];

    if (!this.baseUrl) missing.push("PAGBANK_API_URL");
    if (!this.token) missing.push("PAGBANK_TOKEN");

    if (missing.length > 0) {
      const errorMsg = `PagBank config ausente: ${missing.join(", ")}`;
      logger.error("PAGBANK", errorMsg);
      throw new Error(errorMsg);
    }
  }

  static async createPixOrder(
    orderId: string,
    amount: number,
    customerName: string
  ) {
    this.validateConfig();

    const payload: Record<string, unknown> = {
      reference_id: orderId,
      customer: {
        name: customerName || "Cliente Teste",
        email: "cliente.teste@exemplo.com",
        tax_id: "12345678909",
        phones: [
          {
            country: "55",
            area: "11",
            number: "999999999",
            type: "MOBILE",
          },
        ],
      },
      qr_codes: [
        {
          amount: {
            value: Math.round(amount * 100),
          },
          expiration_date: new Date(
            Date.now() + 30 * 60 * 1000
          ).toISOString(),
        },
      ],
    };

    if (this.webhookUrl) {
      payload.notification_urls = [this.webhookUrl];
    }

    const url = `${this.baseUrl}/orders`;

    logger.info("PAGBANK", `Criando ordem PIX para pedido ${orderId}`, {
      url,
      amount,
      hasWebhook: !!this.webhookUrl,
    });

    try {
      const data = await fetchJson(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        timeout: PAGBANK_TIMEOUT_MS,
        context: "PAGBANK_CREATE_PIX",
      });

      logger.info("PAGBANK", `Resposta completa do PagBank para pedido ${orderId}`, {
        data: JSON.stringify(data),
      });

      logger.info("PAGBANK", `Ordem PIX criada com sucesso: ${orderId}`, {
        pagbankOrderId: (data as Record<string, unknown>)?.id,
      });

      return data as unknown as Record<string, unknown>;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const err = error as Error & { status?: number; responseData?: unknown };

      if (errorMessage.includes("Timeout")) {
        logger.error("PAGBANK", `Timeout ao criar ordem PIX para pedido ${orderId}`, error, {
          url,
          timeout: PAGBANK_TIMEOUT_MS,
        });
        throw new Error("O serviço de pagamento está temporariamente indisponível. Tente novamente.");
      }

      logger.error("PAGBANK", `Erro ao criar ordem PIX para pedido ${orderId}`, error, {
        url,
        httpStatus: err.status,
        responseData: err.responseData,
        tokenLength: this.token?.length,
        tokenPrefix: this.token ? this.token.substring(0, 8) + "..." : "NONE",
        baseUrl: this.baseUrl,
        isSandbox: this.baseUrl?.includes("sandbox"),
      });

      if (err.status === 401 || err.status === 403) {
        const env = this.baseUrl?.includes("sandbox") ? "SANDBOX" : "PRODUÇÃO";
        throw new Error(
          `Pagamento temporariamente indisponível. [${env}: HTTP ${err.status}]`
        );
      }

      throw new Error("Erro ao processar pagamento. Tente novamente mais tarde.");
    }
  }

  static async simulateSandboxPayment(orderId: string) {
    if (!this.baseUrl?.includes("sandbox")) {
      logger.warn("PAGBANK_SIMULATE", "Simulação abortada: ambiente não é Sandbox");
      return;
    }

    logger.info("PAGBANK_SIMULATE", `Iniciando simulação de pagamento para: ${orderId}`);

    try {
      const url = `${this.baseUrl}/orders/${orderId}/pay`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({}),
      });

      logger.info("PAGBANK_SIMULATE", `Simulação concluída para ${orderId}`, {
        status: response.status,
      });
    } catch (error) {
      logger.error("PAGBANK_SIMULATE", `Erro ao simular pagamento para ${orderId}`, error);
    }
  }
}
