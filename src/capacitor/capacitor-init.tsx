"use client";

import { useEffect } from "react";
import { platform } from "./platform";
import { initBackButton } from "./back-button";
import { initNetworkMonitor } from "./network-monitor";
import { initDeepLinks } from "./deep-links";
import { notificationService } from "./notification.service";
import { logger } from "@/src/lib/logger";

let _globalPushToken: string | null = null;

export function getGlobalPushToken(): string | null {
  return _globalPushToken;
}

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
        if (!granted) {
          logger.info("CAPACITOR", "Permissão de notificação negada");
          return;
        }
        notificationService.register().then((token) => {
          if (token) {
            _globalPushToken = token;
            logger.info("CAPACITOR", "Push token obtido", { token: token.slice(0, 12) + "..." });
          }
        });
      });

      notificationService.onNotification((data) => {
        logger.info("CAPACITOR", "Notificação recebida", data);
      });
    }

    initNetworkMonitor();
  }, []);

  return <>{children}</>;
}
