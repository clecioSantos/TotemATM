"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/src/services/firebase";
import { pushTokenService } from "@/src/services/push-token.service";
import { getGlobalPushToken } from "./capacitor-init";
import { logger } from "@/src/lib/logger";

export default function PushTokenRegistrar() {
  const registeredRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        registeredRef.current = false;
        logger.info("PUSH_TOKEN", "Usuário deslogado, resetando registro");
        return;
      }
      if (registeredRef.current) {
        logger.info("PUSH_TOKEN", "Push já registrado para este usuário");
        return;
      }

      logger.info("PUSH_TOKEN", "Usuário logado, iniciando registro push", { uid: firebaseUser.uid });

      try {
        const userSnap = await getDoc(doc(firestore, "users", firebaseUser.uid));
        if (!userSnap.exists()) {
          logger.warn("PUSH_TOKEN", "Documento do usuário não encontrado no Firestore");
          return;
        }
        const userData = userSnap.data();
        const role = userData.role || "client";
        logger.info("PUSH_TOKEN", "Perfil carregado", { role });

        const isCapacitor = typeof (window as any)?.Capacitor !== "undefined";
        if (!isCapacitor) {
          logger.info("PUSH_TOKEN", "Não está no Capacitor, pulando registro");
          return;
        }
        logger.info("PUSH_TOKEN", "Ambiente Capacitor detectado");

        const token = await new Promise<string | null>((resolve) => {
          let attempts = 0;
          const check = () => {
            const t = getGlobalPushToken();
            if (t) {
              logger.info("PUSH_TOKEN", "Token obtido após " + (attempts * 500) + "ms");
              resolve(t);
              return;
            }
            attempts++;
            if (attempts >= 40) {
              logger.warn("PUSH_TOKEN", "Timeout aguardando token (20s)");
              resolve(null);
              return;
            }
            setTimeout(check, 500);
          };
          logger.info("PUSH_TOKEN", "Aguardando token push...");
          check();
        });

        if (!token) {
          logger.warn("PUSH_TOKEN", "Token push não disponível após 20s de espera. Verifique: 1) Permissão de notificação concedida? 2) PushNotifications.register() foi chamado? 3) Evento 'registration' disparou?");
          return;
        }

        logger.info("PUSH_TOKEN", "Token obtido, salvando no Firestore", { token: token.slice(0, 16) + "..." });
        await pushTokenService.saveToken(firebaseUser.uid, role, token, "android");
        logger.info("PUSH_TOKEN", "Push token salvo com sucesso no Firestore");
        registeredRef.current = true;
      } catch (error) {
        logger.error("PUSH_TOKEN", "Erro ao registrar push token", error instanceof Error ? error.message : String(error));
      }
    });

    return () => unsub();
  }, []);

  return null;
}
