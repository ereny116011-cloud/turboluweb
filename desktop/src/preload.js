'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('turbolu', {
  info: () => ipcRenderer.invoke('app:info'),

  window: {
    minimize: () => ipcRenderer.invoke('win:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('win:toggleMaximize'),
    close: () => ipcRenderer.invoke('win:close'),
    isMaximized: () => ipcRenderer.invoke('win:isMaximized'),
    onState: (callback) => {
      const listener = (_event, payload) => callback(payload);
      ipcRenderer.on('win:state', listener);
      return () => ipcRenderer.removeListener('win:state', listener);
    }
  },

  api: (payload) => ipcRenderer.invoke('api:call', payload),
  status: (kind) => ipcRenderer.invoke('server:status', kind),

  auth: {
    load: () => ipcRenderer.invoke('auth:load'),
    save: (token) => ipcRenderer.invoke('auth:save', token),
    clear: () => ipcRenderer.invoke('auth:clear')
  },

  clipboard: (text) => ipcRenderer.invoke('clipboard:write', text),
  open: (url) => ipcRenderer.invoke('shell:open', url),
  setTheme: (mode) => ipcRenderer.invoke('theme:set', mode)
});
