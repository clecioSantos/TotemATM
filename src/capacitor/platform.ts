import { Device } from "@capacitor/device";

let cachedIsCapacitor: boolean | null = null;
let cachedPlatform: string | null = null;

function detectCapacitor(): boolean {
  if (cachedIsCapacitor !== null) return cachedIsCapacitor;
  cachedIsCapacitor = typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  return cachedIsCapacitor;
}

export const platform = {
  async init(): Promise<void> {
    if (!detectCapacitor()) return;
    try {
      const info = await Device.getInfo();
      cachedPlatform = info.platform;
    } catch {
      cachedPlatform = "web";
    }
  },

  isCapacitor(): boolean {
    return detectCapacitor();
  },

  isAndroid(): boolean {
    if (!detectCapacitor()) return false;
    if (cachedPlatform) return cachedPlatform === "android";
    try {
      const ua = navigator.userAgent.toLowerCase();
      return ua.includes("android") && ua.includes("capacitor");
    } catch {
      return false;
    }
  },

  isIOS(): boolean {
    if (!detectCapacitor()) return false;
    if (cachedPlatform) return cachedPlatform === "ios";
    return false;
  },

  isMobile(): boolean {
    return this.isAndroid() || this.isIOS();
  },

  isWeb(): boolean {
    return !detectCapacitor();
  },

  async getDeviceInfo() {
    if (!detectCapacitor()) return null;
    try {
      return await Device.getInfo();
    } catch {
      return null;
    }
  },
};
