import { logger } from "./logger";

const DEFAULT_TIMEOUT_MS = 15000;

interface FetchWithTimeoutOptions extends RequestInit {
  timeout?: number;
  context?: string;
}

export async function fetchWithTimeout(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT_MS, context = "HTTP_REQUEST", ...fetchOptions } = options;
  const timeoutContext = `${context} [${url}]`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.warn(timeoutContext, `Timeout de ${timeout}ms excedido`, undefined, { url, timeout });
  }, timeout);

  if (fetchOptions.signal) {
    fetchOptions.signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      controller.abort();
    });
  }

  fetchOptions.signal = controller.signal;

  const startTime = Date.now();

  try {
    const response = await fetch(url, fetchOptions);
    const elapsed = Date.now() - startTime;

    logger.debug(timeoutContext, `Resposta recebida em ${elapsed}ms`, {
      url,
      status: response.status,
      statusText: response.statusText,
      elapsed,
    });

    return response;
  } catch (error) {
    const elapsed = Date.now() - startTime;

    if (error instanceof DOMException && error.name === "AbortError") {
      const timeoutErr = new Error(`Timeout após ${timeout}ms: ${url}`);
      logger.error(timeoutContext, timeoutErr.message, timeoutErr, { url, timeout, elapsed });
      throw timeoutErr;
    }

    logger.error(
      timeoutContext,
      `Falha na requisição: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined,
      { url, elapsed }
    );

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchWithTimeoutOptions = {}
): Promise<T> {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: {
      ...options.headers,
      Accept: "application/json",
    },
  });

  const text = await response.text();

  if (!response.ok) {
    let responseData: unknown = undefined;
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = text.substring(0, 500);
    }

    const error = new Error(
      `HTTP ${response.status}: ${url}`
    ) as Error & { status: number; responseData: unknown };
    error.status = response.status;
    error.responseData = responseData;
    throw error;
  }

  if (!text || text.trim().length === 0) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`JSON inválido na resposta de ${url}: ${text.substring(0, 200)}`);
  }
}
