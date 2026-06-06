import type { PaymentProvider } from "./interfaces/payment-provider.interface";
import type { PaymentProviderName } from "./interfaces/payment.types";
import { logger } from "@/src/lib/logger";

let cachedProvider: PaymentProvider | null = null;

export class PaymentProviderFactory {
  static create(): PaymentProvider {
    if (cachedProvider) return cachedProvider;

    const providerName = (process.env.PAYMENT_PROVIDER || "pagbank") as PaymentProviderName;

    const provider = PaymentProviderFactory.createForName(providerName);
    cachedProvider = provider;
    return provider;
  }

  static createForName(name: PaymentProviderName): PaymentProvider {
    switch (name) {
      case "abacatepay": {
        const { AbacatePayProvider } = require("../../../app/services/abacatepay/abacatepay.provider");
        return new AbacatePayProvider();
      }
      case "pagbank":
      default: {
        const { PagBankProvider } = require("../../../app/services/pagbank/pagbank.provider");
        return new PagBankProvider();
      }
    }
  }

  static getProviderName(): PaymentProviderName {
    return (process.env.PAYMENT_PROVIDER || "pagbank") as PaymentProviderName;
  }

  static resetCache(): void {
    cachedProvider = null;
  }

  static validateActiveProvider(): { valid: boolean; issues: string[] } {
    const providerName = this.getProviderName();
    logger.info("PAYMENT_FACTORY", `Validando provider ativo: ${providerName}`);

    try {
      const provider = this.create();
      const result = provider.validateConfiguration();
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("PAYMENT_FACTORY", `Erro ao validar provider ${providerName}`, error);
      return { valid: false, issues: [message] };
    }
  }
}
