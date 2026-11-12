/* TurboluApp PC — geliştirme yardımcıları.
   Yalnızca geliştirme modunda (TURBOLU_SHOT tanımlıysa) çalışır. */
'use strict';

(function () {
  if (!window.__TAURI__ || !window.__TAURI__.core) return;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  async function calistir() {
    let ayar;
    try {
      ayar = await window.__TAURI__.core.invoke('devshot_config');
    } catch (_) {
      return;
    }
    if (!ayar || !ayar.yol) return;

    if (ayar.sayfa && typeof window.navigate === 'function') {
      window.navigate(ayar.sayfa);
      await sleep(1200);
    }
    if (ayar.tema && typeof window.applyTheme === 'function') {
      window.applyTheme(ayar.tema);
      await sleep(400);
    }
    if (ayar.betik) {
      // Betik Rust tarafında çalıştırılır (CSP `script-src 'self'`).
      try {
        await window.__TAURI__.core.invoke('devshot_eval', { betik: ayar.betik });
      } catch (error) {
        console.error('Test betiği hatası:', error);
      }
      await sleep(2500);
    }

    try {
      await window.__TAURI__.core.invoke('dev_screenshot', { path: ayar.yol });
    } catch (error) {
      console.error('Ekran görüntüsü alınamadı:', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { setTimeout(calistir, 3000); });
  } else {
    setTimeout(calistir, 3000);
  }
})();
