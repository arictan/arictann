import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Change this to a reverse-domain ID you own BEFORE the first store upload.
  // It can never be changed for a published app.
  appId: 'com.arictan.sushistack',
  appName: 'Sushi Stack',
  webDir: 'dist',
  backgroundColor: '#2a1a33',
  ios: { contentInset: 'never' },
  android: { backgroundColor: '#2a1a33' },
};

export default config;
