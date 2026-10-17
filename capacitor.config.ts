import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Change this to a reverse-domain ID you own BEFORE the first store upload.
  // It can never be changed for a published app.
  appId: 'com.arictan.orbithop',
  appName: 'Orbit Hop',
  webDir: 'dist',
  backgroundColor: '#070b1a',
  ios: { contentInset: 'never' },
  android: { backgroundColor: '#070b1a' },
};

export default config;
