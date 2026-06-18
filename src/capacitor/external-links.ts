import { Browser } from "@capacitor/browser";

const ALLOWED_DOMAINS = [
  "www.boradedelivery.com",
  "boradedelivery.com",
  "firestore.googleapis.com",
  "firebasestorage.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "api.mercadopago.com",
  "auth.mercadopago.com.br",
  "www.mercadopago.com.br",
  "api.pagseguro.com",
  "sandbox.api.pagseguro.com",
  "res.cloudinary.com",
  "api.abacatepay.com",
  "viacep.com.br",
  "maps.googleapis.com",
  "wa.me",
  "api.whatsapp.com",
  "instagram.com",
  "www.instagram.com",
  "facebook.com",
  "www.facebook.com",
  "google.com",
  "www.google.com",
];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some((d) => parsed.hostname === d || parsed.hostname.endsWith("." + d));
  } catch {
    return false;
  }
}

export const linkHandler = {
  isCapacitor(): boolean {
    return typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  },

  async open(url: string): Promise<void> {
    if (!this.isCapacitor()) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    const lower = url.toLowerCase();

    // Native apps for known protocols
    if (lower.startsWith("whatsapp://") || lower.includes("wa.me") || lower.includes("api.whatsapp.com")) {
      window.open(url, "_system");
      return;
    }

    if (lower.startsWith("tel:")) {
      window.open(url, "_system");
      return;
    }

    if (lower.startsWith("mailto:")) {
      window.open(url, "_system");
      return;
    }

    // Open allowed URLs in-app, others in system browser
    try {
      await Browser.open({ url, presentationStyle: "popover" });
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  },

  isDomainAllowed(url: string): boolean {
    return isAllowed(url);
  },
};
