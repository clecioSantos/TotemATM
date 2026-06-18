import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.boradelivery.app",
  appName: "Bora Delivery",
  webDir: "out",
  server: {
    url: "https://www.boradedelivery.com",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "www.boradedelivery.com",
      "boradedelivery.com",
      "firestore.googleapis.com",
      "firebasestorage.googleapis.com",
      "identitytoolkit.googleapis.com",
      "securetoken.googleapis.com",
      "api.mercadopago.com",
      "auth.mercadopago.com.br",
      "api.pagseguro.com",
      "sandbox.api.pagseguro.com",
      "res.cloudinary.com",
      "api.abacatepay.com",
      "viacep.com.br",
      "maps.googleapis.com",
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: false,
    webContentsDebuggingEnabled: process.env.NODE_ENV === "development",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FF6B00",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
