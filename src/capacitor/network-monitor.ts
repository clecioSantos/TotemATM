import { Network } from "@capacitor/network";

type StatusCallback = (isConnected: boolean) => void;

const watchers: StatusCallback[] = [];

let onlineStatus = true;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, isError: boolean): void {
  const existing = document.getElementById("cap-network-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "cap-network-toast";
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "80px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "99999",
    padding: "12px 24px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#fff",
    background: isError ? "#dc2626" : "#16a34a",
    boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
    maxWidth: "90%",
    textAlign: "center",
    transition: "opacity 0.3s ease",
    animation: "fadeIn 0.3s ease",
  });

  document.body.appendChild(toast);

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function initNetworkMonitor(): void {
  if (typeof window === "undefined") return;

  onlineStatus = navigator.onLine;

  // If Capacitor, use native network plugin
  if (typeof (window as any).Capacitor !== "undefined") {
    Network.addListener("networkStatusChange", (status) => {
      const wasOnline = onlineStatus;
      onlineStatus = status.connected;

      if (wasOnline && !onlineStatus) {
        showToast("Sem conexão com a internet", true);
      } else if (!wasOnline && onlineStatus) {
        showToast("Conexão restabelecida", false);
      }

      watchers.forEach((cb) => cb(onlineStatus));
    });
  }

  // Also listen to browser events for web fallback
  window.addEventListener("online", () => {
    if (!onlineStatus) {
      onlineStatus = true;
      showToast("Conexão restabelecida", false);
      watchers.forEach((cb) => cb(true));
    }
  });

  window.addEventListener("offline", () => {
    if (onlineStatus) {
      onlineStatus = false;
      showToast("Sem conexão com a internet", true);
      watchers.forEach((cb) => cb(false));
    }
  });
}

export function isOnline(): boolean {
  return onlineStatus;
}

export function onNetworkChange(callback: StatusCallback): () => void {
  watchers.push(callback);
  return () => {
    const idx = watchers.indexOf(callback);
    if (idx >= 0) watchers.splice(idx, 1);
  };
}
