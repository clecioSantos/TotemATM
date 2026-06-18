"use client";

import { useEffect } from "react";
import { platform } from "./platform";
import { initBackButton } from "./back-button";
import { initNetworkMonitor } from "./network-monitor";
import { initDeepLinks } from "./deep-links";

export function CapacitorInit({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isCapacitor = typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";

    if (isCapacitor) {
      platform.init().then(() => {
        initBackButton();
        initDeepLinks();
        initNetworkMonitor();
      });
    }

    // Web network monitor (always)
    initNetworkMonitor();
  }, []);

  return <>{children}</>;
}
