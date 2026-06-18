import { Camera, CameraResultType } from "@capacitor/camera";

function webFileInput(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}

export const imageService = {
  isCapacitor(): boolean {
    return typeof window !== "undefined" && typeof (window as any).Capacitor !== "undefined";
  },

  async pickFromGallery(): Promise<string | null> {
    if (this.isCapacitor()) {
      try {
        const image = await Camera.pickImages({ limit: 1 });
        if (image.photos.length > 0) {
          return image.photos[0].path || image.photos[0].webPath || null;
        }
        return null;
      } catch {
        return null;
      }
    }

    return webFileInput();
  },

  async takePhoto(): Promise<string | null> {
    if (this.isCapacitor()) {
      try {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
        });
        return image.dataUrl || null;
      } catch {
        return null;
      }
    }

    return webFileInput();
  },
};
