"use client";

import { useEffect } from "react";

export function PushNotificationInit() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = async () => {
      try {
        const params = new URLSearchParams({
          apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
          authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
          messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
          appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
        });

        await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?${params.toString()}`
        );
      } catch {}
    };

    register();
  }, []);

  return null;
}
