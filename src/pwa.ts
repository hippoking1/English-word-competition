import { registerSW } from 'virtual:pwa-register';

export function setupPWA() {
  if ('serviceWorker' in navigator) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('New content available, reload to update.');
      },
      onOfflineReady() {
        console.log('App ready to work offline.');
      }
    });
  }
}
