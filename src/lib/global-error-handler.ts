import { logger } from "./logger";

const SHUTDOWN_DELAY_MS = 5000;

let isShuttingDown = false;

function gracefulShutdown(origin: string, error: Error): void {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.error(origin, `Process encerrando devido a erro não tratado`, error, {
    pid: process.pid,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  });

  setTimeout(() => {
    process.exit(1);
  }, SHUTDOWN_DELAY_MS);
}

export function setupGlobalErrorHandlers(): void {
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    process.on("uncaughtException", (error: Error, origin: string) => {
      logger.error(
        "UNCAUGHT_EXCEPTION",
        `Exceção não capturada (origin: ${origin})`,
        error,
        {
          pid: process.pid,
          memoryUsage: process.memoryUsage(),
        }
      );

      gracefulShutdown("UNCAUGHT_EXCEPTION", error);
    });

    process.on("unhandledRejection", (reason: unknown, promise: Promise<unknown>) => {
      const error =
        reason instanceof Error
          ? reason
          : new Error(`Promise rejeitada: ${String(reason)}`);

      logger.error(
        "UNHANDLED_REJECTION",
        "Promise rejeitada sem tratamento",
        error,
        {
          pid: process.pid,
          hasReason: reason !== null && reason !== undefined,
          reasonType: typeof reason,
        }
      );

      gracefulShutdown("UNHANDLED_REJECTION", error);
    });

    process.on("warning", (warning: Error) => {
      logger.warn("PROCESS_WARNING", warning.message, warning, {
        name: warning.name,
      });
    });

    logger.info("GLOBAL_ERROR_HANDLER", "Handlers globais de erro registrados");
  }
}
