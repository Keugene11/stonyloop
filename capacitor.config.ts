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
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '372750643272-3ab0ptudlj2s8vofsbumj7n5jiaa060e.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
