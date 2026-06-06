"use client";

import React, { Component, ErrorInfo } from "react";
import { logger } from "../lib/logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  context?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const context = this.props.context || "ErrorBoundary";
    logger.error(
      context,
      `Erro de renderização capturado: ${error.message}`,
      error,
      {
        componentStack: errorInfo.componentStack,
        context: this.props.context,
      }
    );

    if (typeof window !== "undefined") {
      try {
        const event = new CustomEvent("app:error", {
          detail: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack,
            timestamp: new Date().toISOString(),
          },
        });
        window.dispatchEvent(event);
      } catch {
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          padding: "24px",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          backgroundColor: "#f8f9fa",
        }}>
          <div style={{
            maxWidth: "480px",
            padding: "32px",
            backgroundColor: "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "28px",
            }}>
              ⚠️
            </div>
            <h2 style={{
              fontSize: "20px",
              fontWeight: "700",
              color: "#1a1a1a",
              marginBottom: "8px",
            }}>
              Algo deu errado
            </h2>
            <p style={{
              fontSize: "14px",
              color: "#666",
              marginBottom: "24px",
              lineHeight: "1.5",
            }}>
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            <button
              onClick={() => {
                this.handleReset();
                window.location.reload();
              }}
              style={{
                padding: "12px 32px",
                backgroundColor: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#b91c1c")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc2626")}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
