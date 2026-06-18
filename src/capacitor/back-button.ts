import { App } from "@capacitor/app";
import { Dialog } from "@capacitor/dialog";

let initialized = false;

export function initBackButton(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (typeof (window as any).Capacitor === "undefined") return;

  initialized = true;

  App.addListener("backButton", async ({ canGoBack }) => {
    if (canGoBack) {
      window.history.back();
    } else {
      const result = await Dialog.confirm({
        title: "Sair",
        message: "Deseja sair do Bora Delivery?",
        okButtonTitle: "Sim",
        cancelButtonTitle: "Não",
      });

      if (result.value) {
        App.exitApp();
      }
    }
  });
}
