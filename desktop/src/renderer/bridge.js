/* TurboluApp PC — Rust/Tauri köprüsü.
   Electron'daki preload.js yerine geçer. window.turbolu API'sinin şekli
   aynen korunur; arayüz kodunda değişiklik gerekmez. */
'use strict';

const invoke = (cmd, args) => window.__TAURI__.core.invoke(cmd, args);
const listen = (event, handler) => window.__TAURI__.event.listen(event, handler);

window.turbolu = {
  info: () => invoke('app_info'),

  window: {
    minimize: () => invoke('win_minimize'),
    toggleMaximize: () => invoke('win_toggle_maximize'),
    close: () => invoke('win_close'),
    isMaximized: () => invoke('win_is_maximized'),
    onState: (callback) => {
      // Dinleyici sözü döndürülür (iptal fonksiyonu).
      let unlisten = null;
      let cancelled = false;
      listen('win:state', (event) => callback(event.payload)).then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });
      return () => {
        cancelled = true;
        if (unlisten) unlisten();
      };
    }
  },

  api: (payload) => invoke('api_call', { payload }),
  status: (kind) => invoke('server_status', { kind }),

  oauth: {
    login: (provider) => invoke('oauth_login', { provider })
  },

  auth: {
    load: () => invoke('auth_load'),
    save: (token) => invoke('auth_save', { token }),
    clear: () => invoke('auth_clear')
  },

  clipboard: (text) => invoke('clipboard_write', { text }),
  open: (url) => invoke('shell_open', { url }),
  setTheme: (mode) => invoke('theme_set', { mode })
};
