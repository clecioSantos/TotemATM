"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "@/src/services/firebase";
import { pushTokenService } from "@/src/services/push-token.service";
import { logger } from "@/src/lib/logger";

export default function PushTokenRegistrar() {
  const registeredRef = useRef(false);
  const pendingUserRef = useRef<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        registeredRef.current = false;
        pendingUserRef.current = null;
        return;
      }
      if (registeredRef.current) return;

      const Capacitor = (window as any)?.Capacitor;
      const isCapacitor = Capacitor && (Capacitor.getPlatform() === "android" || Capacitor.getPlatform() === "ios");

      if (isCapacitor) {
        await registerCapacitor(firebaseUser);
        registeredRef.current = true;
      } else {
        if (Notification.permission === "granted") {
          await registerBrowser(firebaseUser);
          registeredRef.current = true;
        } else if (Notification.permission === "default") {
          pendingUserRef.current = firebaseUser;
        }
      }
    });

    const onInteraction = () => {
      const user = pendingUserRef.current;
      if (!user || registeredRef.current) return;
      pendingUserRef.current = null;
      registerBrowser(user).then(() => {
        registeredRef.current = true;
      });
    };

    window.addEventListener("click", onInteraction, { once: true });

    return () => {
      unsub();
      window.removeEventListener("click", onInteraction);
    };
  }, []);

  return null;
}

async function registerCapacitor(firebaseUser: any) {
  const { PushNotifications } = await import("@capacitor/push-notifications");

  logger.info("PUSH_TOKEN", "Solicitando permissão de notificação (Capacitor)...");
  const permResult = await PushNotifications.requestPermissions();
  logger.info("PUSH_TOKEN", "Permissão: " + permResult.receive);

  if (permResult.receive !== "granted") {
    logger.warn("PUSH_TOKEN", "Permissão de notificação negada");
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

    PushNotifications.register().catch((err: any) => {
      logger.error("PUSH_TOKEN", "Falha ao chamar register()", String(err));
      if (!resolved) { resolved = true; resolve(null); }
    });

    setTimeout(() => {
      if (!resolved) { resolved = true; resolve(null); }
    }, 15000);
  });

  if (!token) {
    logger.warn("PUSH_TOKEN", "Token não obtido em 15s (Capacitor)");
    return;
  }

  const userSnap = await getDoc(doc(firestore, "users", firebaseUser.uid));
  const role = userSnap.exists() ? userSnap.data().role || "client" : "client";

  await pushTokenService.saveToken(firebaseUser.uid, role, token, "android");
  logger.info("PUSH_TOKEN", "Token Capacitor salvo: " + token.slice(0, 16) + "...");
}

async function registerBrowser(firebaseUser: any) {
  try {
    if (!("serviceWorker" in navigator)) return;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      logger.warn("PUSH_TOKEN", "VAPID_KEY ausente");
      return;
    }

    const swParams = new URLSearchParams({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    });

    const swUrl = `/firebase-messaging-sw.js?${swParams.toString()}`;

    let registration = await navigator.serviceWorker.getRegistration("/");
    if (!registration?.active) {
      registration = await navigator.serviceWorker.register(swUrl);
      await navigator.serviceWorker.ready;
    }

    if (!registration?.active) {
      logger.warn("PUSH_TOKEN", "SW não ativo");
      return;
    }

    logger.info("PUSH_TOKEN", "SW ativo, obtendo token FCM...");

    const { getMessaging, getToken, onMessage } = await import("firebase/messaging");
    const messaging = getMessaging();

    // Handler para notificações em foreground (aba ativa)
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || "Novo pedido";
      const body = payload.notification?.body || "";
      const orderId = payload.data?.orderId;

      if (Notification.permission === "granted") {
        const notif = new Notification(title, {
          body,
          icon: "/Icon.png",
          data: { orderId, url: orderId ? `/admin/orders?orderId=${orderId}` : "/admin/orders" },
        });

        notif.onclick = () => {
          notif.close();
          window.open(notif.data.url, "_blank");
        };
      }
    });

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) {
      logger.warn("PUSH_TOKEN", "getToken retornou vazio");
      return;
    }

    logger.info("PUSH_TOKEN", "Token FCM obtido: " + token.slice(0, 24) + "...");

    const userSnap = await getDoc(doc(firestore, "users", firebaseUser.uid));
    if (!userSnap.exists()) {
      logger.warn("PUSH_TOKEN", "Usuário não encontrado no Firestore");
      return;
    }

    const role = userSnap.data().role || "client";
    logger.info("PUSH_TOKEN", "Salvando token para uid=" + firebaseUser.uid + " role=" + role);

    await pushTokenService.saveToken(firebaseUser.uid, role, token, "web");

    // Verifica se o token foi realmente salvo
    try {
      const { collection, query, where, getDocs } = await import("firebase/firestore");
      const verifyQ = query(collection(firestore, "push_tokens"), where("uid", "==", firebaseUser.uid));
      const verifySnap = await getDocs(verifyQ);
      logger.info("PUSH_TOKEN", "Verificação pós-salvamento:", {
        uid: firebaseUser.uid,
        tokensEncontrados: verifySnap.docs.length,
        docs: verifySnap.docs.map((d) => ({ id: d.id, active: d.data().active, token: d.data().token?.slice(0, 24) })),
      });
    } catch (verifyErr) {
      logger.error("PUSH_TOKEN", "Erro na verificação pós-salvamento", verifyErr);
    }

    logger.info("PUSH_TOKEN", "Token browser salvo com sucesso!");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("PUSH_TOKEN", "Erro ao registrar push no browser: " + msg, err);
  }
}
