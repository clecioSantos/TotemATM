import { NextResponse } from "next/server";
import { logger } from "./logger";

type RouteHandler = (...args: unknown[]) => Promise<NextResponse> | NextResponse;

interface SafeApiResponse {
  success: boolean;
  error?: string;
}

export function wrapApiHandler(
  handler: RouteHandler,
  context: string,
  options?: {
    showErrorDetails?: boolean;
  }
): RouteHandler {
  return async (...args: unknown[]): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      logger.error(
        `API:${context}`,
        `Erro na rota: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined,
        { handler: context }
      );

      const showDetails = options?.showErrorDetails && process.env.NODE_ENV === "development";

      const body: SafeApiResponse = {
        success: false,
        error: showDetails
          ? (error instanceof Error ? error.message : "Erro interno do servidor")
          : "Erro interno",
      };

      return NextResponse.json(body, { status: 500 });
    }
  };
}

export function createSafeResponse(data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, ...(data as Record<string, unknown>) },
    { status }
  );
}

export function createErrorResponse(error: string, status = 400): NextResponse {
  logger.warn("API_RESPONSE", `Resposta de erro enviada: ${error}`, undefined, { status });
  return NextResponse.json({ success: false, error }, { status });
}
