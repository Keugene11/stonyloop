import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.stonyloop.app',
  appName: 'StonyLoop',
  webDir: 'public',
  server: {
    url: 'https://stonyloop.vercel.app',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: false,
    scheme: 'StonyLoop',
  },
};

export default config;
