import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'HabitsTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    allowNavigation: ['194.87.208.246'] // Разрешаем доступ к этому IP
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000, // Отображать 3 секунды
      launchAutoHide: true,     // Автоматически скрывать после duration
      backgroundColor: "#ffffff", // Цвет фона заставки (если нужен белый)
      androidScaleType: "CENTER_CROP", // Как масштабировать splash.png
      showSpinner: false,       // Отключить встроенный спиннер
      splashFullScreen: true,   // Заставка на весь экран
      splashImmersive: true,    // Иммерсивный режим (скрывает системные бары)
    },
  },
};
export default config;
