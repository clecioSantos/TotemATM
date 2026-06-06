import { logger } from "./logger";
import { setupGlobalErrorHandlers } from "./global-error-handler";
import { validateEnv } from "./env-validator";
import { startMemoryMonitor } from "./memory-monitor";
import { PaymentProviderFactory } from "../services/payment/payment-provider.factory";

let started = false;
let bootComplete = false;

const bootTimings: Record<string, number> = {};
let bootStartTime = 0;

function markStep(name: string): void {
  bootTimings[name] = Date.now();
}

function elapsed(name: string): number {
  return bootTimings[name] - (bootStartTime || Date.now());
}

function validatePaymentProvider(): void {
  try {
    const result = PaymentProviderFactory.validateActiveProvider();
    if (!result.valid) {
      const providerName = PaymentProviderFactory.getProviderName();
      logger.warn("BOOT", `${providerName}: ${result.issues.length} problema(s) de configuração`, undefined, {
        provider: providerName,
        issues: result.issues,
        nodeEnv: process.env.NODE_ENV,
      });
    }
  } catch (error) {
    logger.error("BOOT", "Erro ao validar configuração do provedor de pagamento", error);
  }
}

function getMemoryMB(): string {
  try {
    const usage = process.memoryUsage();
    return `${Math.round(usage.heapUsed / 1024 / 1024)}MB`;
  } catch {
    return "N/A";
  }
}

export function initializeApplication(): void {
  if (started) return;
  started = true;
  bootStartTime = Date.now();

  // @ts-expect-error EdgeRuntime is a global provided by Next.js Edge Runtime
  if (typeof EdgeRuntime !== "undefined") {
    logger.info("BOOT", "Edge Runtime detectado, pulando inicialização Node.js");
    return;
  }

  logger.info("BOOT", "=== INICIANDO APLICAÇÃO ===", {
    nodeVersion: process.version,
    platform: process.platform,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
    memory: getMemoryMB(),
    pid: process.pid,
  });

  // Fase 1: Validação de ambiente (leve)
  markStep("validateEnv");
  validateEnv();
  logger.info("BOOT", `Validação de ambiente: ${elapsed("validateEnv")}ms`);

  // Fase 1b: Validação do provedor de pagamento ativo
  markStep("validatePaymentProvider");
  validatePaymentProvider();
  logger.info("BOOT", `Validação do provedor de pagamento: ${elapsed("validatePaymentProvider")}ms`);

  // Fase 2: Handlers globais de erro (leve)
  markStep("globalErrorHandlers");
  setupGlobalErrorHandlers();
  logger.info("BOOT", `Handlers de erro: ${elapsed("globalErrorHandlers")}ms`);

  // Fase 3: Monitoramento de memória (leve, com unref)
  markStep("memoryMonitor");
  startMemoryMonitor();
  logger.info("BOOT", `Monitor de memória: ${elapsed("memoryMonitor")}ms`);

  // Fase 4: Marcar boot como completo
  markStep("bootComplete");
  bootComplete = true;

  const totalTime = Date.now() - bootStartTime;
  logger.info("BOOT", "=== STARTUP CONCLUÍDO ===", {
    totalTimeMs: totalTime,
    memory: getMemoryMB(),
    steps: Object.entries(bootTimings).map(([step, time]) => ({
      step,
      elapsedMs: time - bootStartTime,
    })),
  });

  // Fase 5: Tarefas secundárias (executam após o servidor estar pronto)
  setImmediate(() => {
    initializeSecondaryServices();
  });
}

async function initializeSecondaryServices(): Promise<void> {
  logger.info("BOOT", "Iniciando serviços secundários (background)...");

  // Firebase Admin é lazy (inicializado sob demanda)
  // Cloudinary é lazy (inicializado sob demanda)
  // Cache e outros serviços podem ser adicionados aqui

  logger.info("BOOT", "Serviços secundários iniciados em background");
}

export function isBootComplete(): boolean {
  return bootComplete;
}

export function getBootTimings(): Record<string, number> {
  return { ...bootTimings };
}

export function getBootDuration(): number {
  return bootStartTime ? Date.now() - bootStartTime : 0;
}
