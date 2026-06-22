"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/src/services/firebase";
import { pushTokenService } from "@/src/services/push-token.service";
import { logger } from "@/src/lib/logger";

export default function PushTokenRegistrar() {
  const registeredRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        registeredRef.current = false;
        return;
      }
      if (registeredRef.current) return;

      const isCapacitor = typeof window !== "undefined" && typeof (window as any)?.Capacitor !== "undefined";
      if (!isCapacitor) return;

      logger.info("PUSH_TOKEN", "Iniciando registro push...");

      try {
        const userSnap = await getDoc(doc(firestore, "users", firebaseUser.uid));
        if (!userSnap.exists()) return;
        const role = userSnap.data().role || "client";

        const { PushNotifications } = await import("@capacitor/push-notifications");

        logger.info("PUSH_TOKEN", "Solicitando permissão de notificação...");
        const permResult = await PushNotifications.requestPermissions();
        logger.info("PUSH_TOKEN", "Permissão: " + permResult.receive);

        if (permResult.receive !== "granted") {
          logger.warn("PUSH_TOKEN", "Permissão de notificação negada pelo usuário");
          return;
        }

        const token = await new Promise<string | null>((resolve) => {
          let resolved = false;

          PushNotifications.addListener("registration", (data) => {
            if (!resolved) { resolved = true; resolve(data.value); }
          });

          PushNotifications.addListener("registrationError", (err) => {
            logger.error("PUSH_TOKEN", "Erro no registro Capacitor", JSON.stringify(err));
            if (!resolved) { resolved = true; resolve(null); }
          });

          logger.info("PUSH_TOKEN", "Chamando PushNotifications.register()...");
          PushNotifications.register().catch((err: any) => {
            logger.error("PUSH_TOKEN", "Falha ao chamar register()", String(err));
            if (!resolved) { resolved = true; resolve(null); }
          });

          setTimeout(() => {
            if (!resolved) { resolved = true; resolve(null); }
          }, 15000);
        });

        if (!token) {
          logger.warn("PUSH_TOKEN", "Token não obtido em 15s");
          return;
        }

        logger.info("PUSH_TOKEN", "Token obtido, salvando...");
        await pushTokenService.saveToken(firebaseUser.uid, role, token, "android");
        logger.info("PUSH_TOKEN", "Token salvo: " + token.slice(0, 16) + "...");
        registeredRef.current = true;
      } catch (err) {
        logger.error("PUSH_TOKEN", "Erro", err instanceof Error ? err.message : String(err));
      }
    });

    return () => unsub();
  }, []);

  return null;
}
