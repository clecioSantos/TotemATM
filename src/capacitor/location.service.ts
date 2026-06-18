import { Geolocation } from "@capacitor/geolocation";

export const locationService = {
  isCapacitor(): boolean {
    return typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  },

  async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    if (this.isCapacitor()) {
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000,
        });
        return {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
      } catch {
        return null;
      }
    }

    // Web fallback
    if (!navigator.geolocation) return null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
    } catch {
      return null;
    }
  },

  async requestPermissions(): Promise<boolean> {
    if (this.isCapacitor()) {
      try {
        const perm = await Geolocation.requestPermissions();
        return perm.location === "granted";
      } catch {
        return false;
      }
    }

    if (!navigator.permissions) return true;
    try {
      const result = await navigator.permissions.query({ name: "geolocation" });
      return result.state === "granted" || result.state === "prompt";
    } catch {
      return true;
    }
  },
};
