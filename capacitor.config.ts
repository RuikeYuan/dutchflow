import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.humao.dutchfrequency",
  appName: "Dutch Frequency",
  webDir: "dist",
  bundledWebRuntime: false,
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

export default config;
