import { logger } from "./logger";
import { setupGlobalErrorHandlers } from "./global-error-handler";
import { validateEnv } from "./env-validator";
import { startMemoryMonitor } from "./memory-monitor";

let started = false;

export function initializeApplication(): void {
  if (started) return;
  started = true;

  logger.info("STARTUP", "=== INICIANDO APLICAÇÃO ===", {
    nodeVersion: process.version,
    platform: process.platform,
    nodeEnv: process.env.NODE_ENV,
    cwd: process.cwd(),
  });

  logger.info("STARTUP", "Carregando variáveis de ambiente");
  validateEnv();

  logger.info("STARTUP", "Registrando handlers globais de erro");
  setupGlobalErrorHandlers();

  logger.info("STARTUP", "Iniciando monitoramento de memória");
  startMemoryMonitor();

  logger.info("STARTUP", "Aplicação inicializada com sucesso");
}
