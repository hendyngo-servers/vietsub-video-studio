import { STUDIO_CONFIG } from './src/studio.config';

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    cleartext?: boolean;
    url?: string;
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: STUDIO_CONFIG.app.id,
  appName: STUDIO_CONFIG.app.name,
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: STUDIO_CONFIG.app.splashBackgroundColor,
      showSpinner: false,
    },
  },
};

export default config;
