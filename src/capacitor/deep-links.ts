import { App } from "@capacitor/app";

export interface DeepLinkData {
  path: string;
  params: Record<string, string>;
}

const listeners: Array<(data: DeepLinkData) => void> = [];

export function initDeepLinks(): void {
  if (typeof (window as any).Capacitor === "undefined") return;

  App.addListener("appUrlOpen", (data) => {
    const url = data.url;
    if (!url) return;

    // Parse boradelivery://path/to/page?param=value
    try {
      const parsed = new URL(url);
      const path = parsed.hostname + parsed.pathname;
      const params: Record<string, string> = {};
      parsed.searchParams.forEach((v, k) => { params[k] = v; });

      const deepLink: DeepLinkData = { path: path.replace(/\/$/, ""), params };
      listeners.forEach((cb) => cb(deepLink));
    } catch {
      // Invalid URL, ignore
    }
  });
}

export function onDeepLink(callback: (data: DeepLinkData) => void): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function buildDeepLink(path: string, params?: Record<string, string>): string {
  const base = "boradelivery://";
  const query = params ? "?" + new URLSearchParams(params).toString() : "";
  return `${base}${path}${query}`;
}
