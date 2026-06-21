"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/src/services/firebase";
import { pushTokenService } from "@/src/services/push-token.service";
import { PushNotifications } from "@capacitor/push-notifications";
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
      registeredRef.current = true;

      try {
        const userSnap = await getDoc(doc(firestore, "users", firebaseUser.uid));
        if (!userSnap.exists()) return;
        const userData = userSnap.data();
        const role = userData.role || "client";

        const isCapacitor = typeof (window as any)?.Capacitor !== "undefined";

        if (isCapacitor) {
          const perm = await PushNotifications.requestPermissions();
          if (perm.receive !== "granted") {
            logger.info("PUSH_TOKEN", "Permissão negada no PushTokenRegistrar");
            return;
          }
          await PushNotifications.register();

          PushNotifications.addListener("registration", async (tokenResult) => {
            const token = tokenResult.value;
            if (!token) return;
            await pushTokenService.saveToken(firebaseUser.uid, role, token, "android");
          });

          PushNotifications.addListener("registrationError", (err) => {
            logger.error("PUSH_TOKEN", "Erro no registro push", err);
          });
        }
      } catch (error) {
        logger.error("PUSH_TOKEN", "Erro ao registrar push token", error);
      }
    });

    return () => unsub();
  }, []);

  return null;
}
