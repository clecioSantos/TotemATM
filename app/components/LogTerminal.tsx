"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Terminal, X, Minus, Trash2 } from "lucide-react";

interface LogLine {
  id: number;
  timestamp: string;
  text: string;
  type: "log" | "warn" | "error" | "info" | "fetch";
}

let logId = 0;
const maxLogs = 500;
let logs: LogLine[] = [];

if (typeof window !== "undefined") {
  try {
    const saved = localStorage.getItem("__sandbox_logs");
    if (saved) logs = JSON.parse(saved);
  } catch {}
}

const origLog = console.log.bind(console);
const origWarn = console.warn.bind(console);
const origError = console.error.bind(console);

function addLog(text: string, type: LogLine["type"]) {
  const line: LogLine = {
    id: ++logId,
    timestamp: new Date().toLocaleTimeString("pt-BR"),
    text,
    type,
  };
  logs = [...logs.slice(-maxLogs + 1), line];
  try {
    localStorage.setItem("__sandbox_logs", JSON.stringify(logs.slice(-200)));
  } catch {}
  return line;
}

export function initLogCapture() {
  if (typeof window === "undefined" || (console.log as any).__sandboxPatched) return;
  (console.log as any).__sandboxPatched = true;

  console.log = (...args: any[]) => {
    origLog(...args);
    addLog(args.map(a => typeof a === "object" ? safeStringify(a) : String(a)).join(" "), "log");
  };
  console.warn = (...args: any[]) => {
    origWarn(...args);
    addLog(args.map(a => typeof a === "object" ? safeStringify(a) : String(a)).join(" "), "warn");
  };
  console.error = (...args: any[]) => {
    origError(...args);
    addLog(args.map(a => typeof a === "object" ? safeStringify(a) : String(a)).join(" "), "error");
  };
}

function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj, (key, val) => {
      if (typeof val === "string" && val.length > 500) return val.slice(0, 500) + "...";
      return val;
    }, 2);
  } catch {
    return String(obj);
  }
}

const origFetch = typeof window !== "undefined" ? window.fetch.bind(window) : null;

export function initFetchCapture() {
  if (typeof window === "undefined" || (window.fetch as any).__sandboxPatched) return;
  (window.fetch as any).__sandboxPatched = true;

  const orig = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || "GET";

    const start = performance.now();
    try {
      const response = await orig(input, init);
      const ms = (performance.now() - start).toFixed(0);
      const status = response.status;
      const statusIcon = status >= 200 && status < 300 ? "✓" : status >= 400 ? "✗" : "?";
      addLog(`${method} ${url} → ${statusIcon} ${status} (${ms}ms)`, status >= 400 ? "error" : "fetch");
      return response;
    } catch (err: any) {
      const ms = (performance.now() - start).toFixed(0);
      addLog(`${method} ${url} → ✗ ERRO ${err?.message || String(err)} (${ms}ms)`, "error");
      throw err;
    }
  };
}

export default function LogTerminal() {
  const [isOpen, setIsOpen] = useState(false);
  const [logLines, setLogLines] = useState<LogLine[]>(logs);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isSandbox = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_MERCADOPAGO_ENVIRONMENT?.toLowerCase() === "sandbox";

  const refresh = useCallback(() => {
    setLogLines([...logs]);
  }, []);

  useEffect(() => {
    if (!isSandbox) return;
    initLogCapture();
    initFetchCapture();
    const interval = setInterval(refresh, 300);
    refresh();
    return () => clearInterval(interval);
  }, [isSandbox, refresh]);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logLines, isOpen]);

  if (!isSandbox) return null;

  const clearLogs = () => {
    logs = [];
    try { localStorage.removeItem("__sandbox_logs"); } catch {}
    refresh();
  };

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 99999,
      fontFamily: "'Courier New', monospace",
      fontSize: 11,
      lineHeight: 1.4,
    }}>
      {/* Toggle button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "absolute",
            bottom: 8,
            right: 8,
            padding: "6px 12px",
            background: "#1e1e2e",
            color: "#a6e3a1",
            border: "1px solid #45475a",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 11,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: 0.85,
          }}
          title="Abrir terminal de logs"
        >
          <Terminal size={14} /> Logs {logLines.length > 0 && `(${logLines.length})`}
        </button>
      )}

      {/* Terminal panel */}
      {isOpen && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          height: 280,
          background: "#1e1e2e",
          borderTop: "2px solid #45475a",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.4)",
        }}>
          {/* Toolbar */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 10px",
            background: "#181825",
            borderBottom: "1px solid #313244",
          }}>
            <span style={{ color: "#a6e3a1", fontWeight: "bold", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
              <Terminal size={12} /> Terminal de Logs <span style={{ color: "#6c7086", fontWeight: "normal" }}>| Sandbox</span>
            </span>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={clearLogs} style={btnStyle} title="Limpar logs">
                <Trash2 size={12} />
              </button>
              <button onClick={() => setIsOpen(false)} style={btnStyle} title="Minimizar">
                <Minus size={12} />
              </button>
              <button onClick={() => { setIsOpen(false); logs = []; localStorage.removeItem("__sandbox_logs"); }} style={{ ...btnStyle, color: "#f38ba8" }} title="Fechar e limpar">
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Log content */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "4px 0",
          }}>
            {logLines.length === 0 && (
              <div style={{ padding: "16px", color: "#6c7086", textAlign: "center", fontStyle: "italic" }}>
                Nenhum log capturado ainda.
              </div>
            )}
            {logLines.map((line) => (
              <div
                key={line.id}
                style={{
                  padding: "1px 10px",
                  color: line.type === "error" ? "#f38ba8"
                       : line.type === "warn" ? "#fab387"
                       : line.type === "fetch" ? "#89b4fa"
                       : line.type === "info" ? "#a6e3a1"
                       : "#cdd6f4",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-all",
                  background: line.type === "error" ? "rgba(243,139,168,0.06)" : "transparent",
                }}
              >
                <span style={{ color: "#6c7086", marginRight: 6 }}>{line.timestamp}</span>
                <span>{line.text}</span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "#a6adc8",
  cursor: "pointer",
  padding: "4px 6px",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
};
