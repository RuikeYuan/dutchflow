import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.humao.dutchfrequency",
  appName: "Dutch Flow",
  webDir: "dist",
  bundledWebRuntime: false,
  // The app is entirely backend-dependent (Vercel serverless functions for
  // AI translation, examples, podcast, etc.). Bundling static dist/ files
  // leaves those endpoints unreachable inside the native shell, so load the
  // live site over the network instead - the shell becomes a thin wrapper.
  server: {
    url: "https://dutchflow.banbar.online",
    cleartext: false
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

export default config;
