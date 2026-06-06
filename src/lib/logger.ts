type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  stack?: string;
  payload?: unknown;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function sanitizePayload(payload: unknown): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const seen = new WeakSet();
  return JSON.parse(
    JSON.stringify(payload, (key, value) => {
      if (typeof value === "string" && value.length > 2000) {
        return value.substring(0, 2000) + "... [truncated]";
      }
      if (key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("key") || key.toLowerCase().includes("password") || key.toLowerCase().includes("credential") || key.toLowerCase().includes("private_key")) {
        return "[REDACTED]";
      }
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    })
  );
}

function buildLogEntry(level: LogLevel, context: string, message: string, error?: unknown, payload?: unknown): LogEntry {
  const entry: LogEntry = {
    timestamp: formatTimestamp(),
    level,
    context,
    message,
  };

  if (error instanceof Error) {
    entry.stack = error.stack;
    if (!entry.message) entry.message = error.message;
  } else if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    entry.message = (errObj.message as string) || entry.message;
    entry.stack = (errObj.stack as string) || (errObj.stackTrace as string);
  } else if (error !== undefined && error !== null) {
    entry.message = String(error);
  }

  if (payload !== undefined) {
    entry.payload = sanitizePayload(payload);
  }

  return entry;
}

function writeToConsole(entry: LogEntry): void {
  const { timestamp, level, context, message, stack, payload } = entry;
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${context}]`;

  switch (level) {
    case "error":
      console.error(prefix, message);
      if (stack) console.error(stack);
      if (payload !== undefined) console.error("Payload:", payload);
      break;
    case "warn":
      console.warn(prefix, message);
      if (payload !== undefined) console.warn("Payload:", payload);
      break;
    case "debug":
      console.debug(prefix, message);
      if (payload !== undefined) console.debug("Payload:", payload);
      break;
    default:
      console.log(prefix, message);
      if (payload !== undefined) console.log("Payload:", payload);
  }
}

export const logger = {
  info(context: string, message: string, payload?: unknown): void {
    const entry = buildLogEntry("info", context, message, undefined, payload);
    writeToConsole(entry);
  },

  warn(context: string, message: string, error?: unknown, payload?: unknown): void {
    const entry = buildLogEntry("warn", context, message, error, payload);
    writeToConsole(entry);
  },

  error(context: string, message: string, error?: unknown, payload?: unknown): void {
    const entry = buildLogEntry("error", context, message, error, payload);
    writeToConsole(entry);
  },

  debug(context: string, message: string, payload?: unknown): void {
    if (process.env.NODE_ENV !== "production") {
      const entry = buildLogEntry("debug", context, message, undefined, payload);
      writeToConsole(entry);
    }
  },
};
