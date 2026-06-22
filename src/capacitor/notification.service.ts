type NotificationCallback = (data: any) => void;

const listeners: NotificationCallback[] = [];

async function getPushNotifications() {
  try {
    const mod = await import("@capacitor/push-notifications");
    return mod.PushNotifications;
  } catch {
    return null;
  }
}

export const notificationService = {
  isCapacitor(): boolean {
    return typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isCapacitor()) {
      if (!("Notification" in window)) return false;
      const result = await Notification.requestPermission();
      return result === "granted";
    }

    try {
      const PushNotifications = await getPushNotifications();
      if (!PushNotifications) return false;
      const perm = await PushNotifications.requestPermissions();
      return perm.receive === "granted";
    } catch {
      return false;
    }
  },

  async register(): Promise<string | null> {
    if (!this.isCapacitor()) return null;
    try {
      const PushNotifications = await getPushNotifications();
      if (!PushNotifications) return null;
      await PushNotifications.register();
      return new Promise((resolve) => {
        PushNotifications.addListener("registration", (token: any) => {
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
      getPushNotifications().then((PushNotifications) => {
        if (!PushNotifications) return;
        PushNotifications.addListener("pushNotificationReceived", (notification: any) => {
          callback(notification.data);
        });
        PushNotifications.addListener("pushNotificationActionPerformed", (action: any) => {
          callback(action.notification.data);
        });
      });
    } else {
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
