"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { platform } from "./platform";
import { initBackButton } from "./back-button";
import { initNetworkMonitor } from "./network-monitor";
import { initDeepLinks, onDeepLink } from "./deep-links";
import { notificationService } from "./notification.service";
import { logger } from "@/src/lib/logger";

export function CapacitorInit({ children }: { children: React.ReactNode }) {
  const router = useRouter();

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

    // Deep link handler - navega para a URL recebida
    const unsubDeepLink = onDeepLink((data) => {
      const fullPath = data.params && Object.keys(data.params).length > 0
        ? `${data.path}?${new URLSearchParams(data.params).toString()}`
        : data.path;
      logger.info("CAPACITOR", "Deep link recebido", { path: fullPath });
      router.push(fullPath);
    });

    initNetworkMonitor();
    return () => unsubDeepLink();
  }, [router]);

  return <>{children}</>;
}
