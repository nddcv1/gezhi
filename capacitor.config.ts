import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.nddcv.gezhi',
  appName: '格致明理',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  plugins: {
    LocalNotifications: { smallIcon: 'ic_stat_gezhi', iconColor: '#8C2F28' },
  },
}

export default config
