"use client";

import { useEffect } from "react";
import { platform } from "./platform";
import { initBackButton } from "./back-button";
import { initNetworkMonitor } from "./network-monitor";
import { initDeepLinks } from "./deep-links";
import { notificationService } from "./notification.service";
import { logger } from "@/src/lib/logger";

export function CapacitorInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";

    if (isCapacitor) {
      platform.init().then(() => {
        initBackButton();
        initDeepLinks();
        initNetworkMonitor();
      });

      notificationService.requestPermission().then((granted) => {
        if (granted) {
          logger.info("CAPACITOR", "Permissão de notificação concedida");
        } else {
          logger.info("CAPACITOR", "Permissão de notificação negada");
        }
      });

      notificationService.onNotification((data) => {
        logger.info("CAPACITOR", "Notificação recebida", data);
      });
    }

    initNetworkMonitor();
  }, []);

  return <>{children}</>;
}
