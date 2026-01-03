import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.banho.app',
  appName: 'Banho',
  webDir: 'dist',
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#064e3b',
      sound: 'default'
    }
  }
};

export default config;
