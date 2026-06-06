import { logger } from "./logger";

let isShuttingDown = false;

function handleFatalError(origin: string, error: Error): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.error(origin, `Erro fatal não tratado`, error, {
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });
}

export function setupGlobalErrorHandlers(): void {
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    process.on("uncaughtException", (error: Error, origin: string) => {
      handleFatalError("UNCAUGHT_EXCEPTION", error);
    });

    process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
      const error =
        reason instanceof Error
          ? reason
          : new Error(`Promise rejeitada: ${String(reason)}`);

      handleFatalError("UNHANDLED_REJECTION", error);
    });

    process.on("warning", (warning: Error) => {
      logger.warn("PROCESS_WARNING", warning.message, warning, {
        name: warning.name,
      });
    });

    logger.info("GLOBAL_ERROR_HANDLER", "Handlers globais de erro registrados");
  }
}
