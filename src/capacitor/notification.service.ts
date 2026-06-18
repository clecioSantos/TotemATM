import { PushNotifications } from "@capacitor/push-notifications";

type NotificationCallback = (data: any) => void;

const listeners: NotificationCallback[] = [];

export const notificationService = {
  isCapacitor(): boolean {
    return typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isCapacitor()) {
      // Web Notification API fallback
      if (!("Notification" in window)) return false;
      const result = await Notification.requestPermission();
      return result === "granted";
    }

    try {
      const perm = await PushNotifications.requestPermissions();
      return perm.receive === "granted";
    } catch {
      return false;
    }
  },

  async register(): Promise<string | null> {
    if (!this.isCapacitor()) return null;

    try {
      await PushNotifications.register();
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token) => {
          resolve(token.value);
        });
        PushNotifications.addListener("registrationError", () => {
          resolve(null);
        });
      });
    } catch {
      return null;
    }
  },

  onNotification(callback: NotificationCallback): void {
    listeners.push(callback);

    if (this.isCapacitor()) {
      PushNotifications.addListener("pushNotificationReceived", (notification) => {
        callback(notification.data);
      });

      PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
        callback(action.notification.data);
      });
    } else {
      // Web fallback
      try {
        navigator.serviceWorker?.addEventListener("message", (event) => {
          if (event.data?.type === "push") callback(event.data);
        });
      } catch {}
    }
  },

  removeAllListeners(): void {
    listeners.length = 0;
  },
};
