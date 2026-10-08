import { registerSW } from 'virtual:pwa-register';

let updateSWFn: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function setupPWA() {
  if ('serviceWorker' in navigator) {
    updateSWFn = registerSW({
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

/**
 * Force check service worker update, clear CacheStorage, and invoke updateSW
 */
export async function forceCheckAndRefreshPWA(): Promise<{ swFound: boolean; cacheCleared: boolean }> {
  let swFound = false;
  let cacheCleared = false;

  // 1. Service Worker registration check & update
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        swFound = true;
        await reg.update();
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (e) {
      console.warn('Service Worker check error:', e);
    }
  }

  // 2. Clear browser Cache Storage so stale hashed files / assets are purged
  if ('caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
      cacheCleared = true;
    } catch (e) {
      console.warn('Cache clearing error:', e);
    }
  }

  // 3. Trigger vite-plugin-pwa reload if updateSW function is registered
  if (updateSWFn) {
    try {
      await updateSWFn(true);
    } catch (e) {
      console.warn('updateSW error:', e);
    }
  }

  return { swFound, cacheCleared };
}
