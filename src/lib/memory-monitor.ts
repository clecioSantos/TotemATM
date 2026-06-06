import { logger } from "./logger";

const MEMORY_LOG_INTERVAL_MS = 5 * 60 * 1000;

const MEMORY_WARN_HEAP_USAGE_MB = 500;

let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startMemoryMonitor(): void {
  if (typeof process === "undefined" || !process.memoryUsage) {
    return;
  }

  if (intervalHandle) {
    return;
  }

  logMemoryUsage();

  intervalHandle = setInterval(() => {
    logMemoryUsage();
  }, MEMORY_LOG_INTERVAL_MS);

  if (typeof intervalHandle === "object" && "unref" in intervalHandle) {
    intervalHandle.unref();
  }

  logger.info("MEMORY_MONITOR", `Monitoramento de memória iniciado (intervalo: ${MEMORY_LOG_INTERVAL_MS / 1000}s)`);
}

export function stopMemoryMonitor(): void {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    logger.info("MEMORY_MONITOR", "Monitoramento de memória interrompido");
  }
}

export function logMemoryUsage(): void {
  try {
    const usage = process.memoryUsage();
    const heapUsedMB = Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100;
    const heapTotalMB = Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100;
    const rssMB = Math.round((usage.rss / 1024 / 1024) * 100) / 100;
    const externalMB = Math.round((usage.external / 1024 / 1024) * 100) / 100;

    let cpuUser = 0;
    let cpuSystem = 0;
    try {
      const cpu = process.cpuUsage();
      cpuUser = Math.round(cpu.user / 1000);
      cpuSystem = Math.round(cpu.system / 1000);
    } catch {
    }

    const payload: Record<string, unknown> = {
      heapUsedMB,
      heapTotalMB,
      rssMB,
      externalMB,
      heapUsagePercent: heapTotalMB > 0
        ? Math.round((heapUsedMB / heapTotalMB) * 10000) / 100
        : 0,
    };

    if (cpuUser > 0 || cpuSystem > 0) {
      payload.cpuUserMs = cpuUser;
      payload.cpuSystemMs = cpuSystem;
    }

    if (heapUsedMB > MEMORY_WARN_HEAP_USAGE_MB) {
      logger.warn("MEMORY_MONITOR", `Uso de memória elevado: ${heapUsedMB}MB`, undefined, payload);
    } else {
      logger.info("MEMORY_MONITOR", `Uso de memória: ${heapUsedMB}MB / ${heapTotalMB}MB (RSS: ${rssMB}MB)`, payload);
    }
  } catch (error) {
    logger.error("MEMORY_MONITOR", "Falha ao ler uso de memória", error instanceof Error ? error : undefined);
  }
}
