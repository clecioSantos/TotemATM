import { logger } from "./logger";

let isShuttingDown = false;

function formatError(error: unknown): { message: string; stack?: string; name?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
    };
  }
  return {
    message: String(error),
  };
}

export function setupGlobalErrorHandlers(): void {
  if (process.env.NEXT_RUNTIME === "nodejs" || !process.env.NEXT_RUNTIME) {
    process.on("uncaughtException", (error: Error) => {
      logger.error(
        "UNCAUGHT_EXCEPTION",
        `Exceção não capturada: ${error.message}`,
        error,
        {
          pid: process.pid,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          heapUsedMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        }
      );
    });

    process.on("unhandledRejection", (reason: unknown) => {
      const formatted = formatError(reason);
      logger.error(
        "UNHANDLED_REJECTION",
        `Promise rejeitada sem tratamento: ${formatted.message}`,
        reason instanceof Error ? reason : new Error(formatted.message),
        {
          pid: process.pid,
          uptime: process.uptime(),
          reasonType: typeof reason,
        }
      );
    });

    process.on("warning", (warning: Error) => {
      logger.warn("PROCESS_WARNING", warning.message, warning, {
        name: warning.name,
      });
    });

    process.on("SIGTERM", () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info("SHUTDOWN", "Sinal SIGTERM recebido, iniciando desligamento gracioso");
    });

    process.on("SIGINT", () => {
      if (isShuttingDown) return;
      isShuttingDown = true;
      logger.info("SHUTDOWN", "Sinal SIGINT recebido, iniciando desligamento gracioso");
    });

    logger.info("GLOBAL_ERROR_HANDLER", "Handlers globais de erro registrados");
  }
}

export function isShuttingDownProcess(): boolean {
  return isShuttingDown;
}
