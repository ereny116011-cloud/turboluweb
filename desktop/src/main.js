'use strict';

const { app, BrowserWindow, ipcMain, shell, clipboard, nativeTheme, safeStorage, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { pathToFileURL } = require('node:url');

const API_BASE = 'https://shrill-salad-a498.ereny116011.workers.dev';
const WEBSITE = 'https://turboluweb.wasmer.app/';
const GITHUB = 'https://github.com/ereny116011-cloud/turboluweb';

const STATUS_SOURCES = {
  java: 'https://api.mcsrvstat.us/2/turbolumc.aternos.me',
  bedrock: 'https://api.mcsrvstat.us/bedrock/2/turbolubedrock.mcsh.io'
};

/* Yalnızca bilinen uçlara istek yapılabilir. Renderer'dan gelen yol ve
   yöntem bu listeye karşı doğrulanır; keyfî adres çağrısı mümkün değildir. */
const API_ROUTES = {
  '/api/login': ['POST'],
  '/api/register': ['POST'],
  '/api/profile': ['GET', 'PUT'],
  '/api/items': ['GET'],
  '/api/buy': ['POST'],
  '/api/inventory': ['GET'],
  '/api/announcements': ['GET'],
  '/api/news': ['GET'],
  '/api/campaigns': ['GET'],
  '/api/admin/users': ['GET'],
  '/api/admin/requests': ['GET'],
  '/api/admin/ban-user': ['POST'],
  '/api/admin/unban-user': ['POST'],
  '/api/admin/delete-user': ['POST'],
  '/api/admin/complete-request': ['POST'],
  '/api/admin/reject-request': ['POST'],
  '/api/admin/announcement': ['POST', 'DELETE'],
  '/api/admin/news': ['POST', 'DELETE'],
  '/api/admin/campaign': ['POST', 'DELETE'],
  '/api/admin/item': ['POST']
};

const SESSION_FILE = 'session.json';
const isDev = !app.isPackaged;

/* Güvenlik sınırları */
const MAX_API_BYTES = 4 * 1024 * 1024;   // API yanıtı üst sınırı
const MAX_REQUEST_BYTES = 3 * 1024 * 1024; // Gönderilen gövde üst sınırı
const MAX_TOKEN_LENGTH = 200;
const TOKEN_PATTERN = /^[A-Za-z0-9._-]+$/;

/* Sadece bu dosya renderer'da açılabilir; diğer adresler tarayıcıya gider. */
const APP_FILE = path.join(__dirname, 'renderer', 'index.html');
const APP_URL = pathToFileURL(APP_FILE).href;

let mainWindow = null;
let sessionToken = '';

/* ------------------------------------------------------------------ */
/* Oturum saklama                                                      */
/* ------------------------------------------------------------------ */

const sessionPath = () => path.join(app.getPath('userData'), SESSION_FILE);

async function encryptionAvailable() {
  if (typeof safeStorage.isAsyncEncryptionAvailable === 'function') {
    try {
      return await safeStorage.isAsyncEncryptionAvailable();
    } catch (_) {
      return false;
    }
  }
  return safeStorage.isEncryptionAvailable();
}

async function decryptToken(encoded) {
  const buffer = Buffer.from(encoded, 'base64');
  if (typeof safeStorage.decryptStringAsync !== 'function') {
    return safeStorage.decryptString(buffer);
  }
  const value = await safeStorage.decryptStringAsync(buffer);
  // Electron 45 bu çağrıda { result, shouldReEncrypt } döndürür; eski sürümler
  // doğrudan metin döndürür.
  if (value && typeof value === 'object') return String(value.result || '');
  return String(value || '');
}

async function encryptToken(token) {
  if (typeof safeStorage.encryptStringAsync === 'function') {
    return safeStorage.encryptStringAsync(token);
  }
  return safeStorage.encryptString(token);
}

async function readSession() {
  try {
    const raw = await fs.readFile(sessionPath(), 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed) return '';
    if (parsed.enc) return await decryptToken(parsed.enc);
    if (parsed.plain) return String(parsed.plain);
    return '';
  } catch (_) {
    return '';
  }
}

async function writeSession(token) {
  sessionToken = token || '';
  try {
    const target = sessionPath();
    if (!token) {
      await fs.rm(target, { force: true });
      return;
    }
    let payload;
    if (await encryptionAvailable()) {
      payload = { enc: (await encryptToken(token)).toString('base64') };
    } else {
      // Linux'ta anahtar zinciri yoksa düz metin saklanır; dosya izni kısıtlıdır.
      payload = { plain: token };
    }
    await fs.writeFile(target, JSON.stringify(payload), { mode: 0o600 });
  } catch (error) {
    // Oturum yazılamazsa uygulama çalışmaya devam eder; nedeni günlüğe yazılır.
    console.error('Oturum dosyası yazılamadı:', error && error.message);
  }
}

/* ------------------------------------------------------------------ */
/* Ağ istekleri                                                        */
/* ------------------------------------------------------------------ */

async function fetchWithTimeout(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function sanitizeQuery(query) {
  const params = new URLSearchParams();
  if (!query || typeof query !== 'object') return params;
  for (const [key, value] of Object.entries(query)) {
    if (key === 'platform' && ['java', 'bedrock', 'all', 'portal'].includes(String(value))) {
      params.set(key, String(value));
    }
  }
  return params;
}

async function callApi(payload = {}) {
  const route = String(payload.path || '');
  const method = String(payload.method || 'GET').toUpperCase();
  const allowed = API_ROUTES[route];
  if (!allowed || !allowed.includes(method)) {
    return { ok: false, status: 400, data: { error: 'Geçersiz istek.' } };
  }

  const url = new URL(API_BASE + route);
  sanitizeQuery(payload.query).forEach((value, key) => url.searchParams.set(key, value));

  const headers = { Accept: 'application/json' };
  const token = payload.auth === false ? '' : sessionToken;
  if (token) headers.Authorization = `Bearer ${token}`;

  let body;
  if (payload.body !== undefined && payload.body !== null) {
    try {
      body = JSON.stringify(payload.body);
    } catch (_) {
      return { ok: false, status: 400, data: { error: 'Geçersiz istek gövdesi.' } };
    }
    if (Buffer.byteLength(body, 'utf8') > MAX_REQUEST_BYTES) {
      return { ok: false, status: 400, data: { error: 'İstek gövdesi çok büyük.' } };
    }
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method,
      headers,
      body
    });

    // Büyük/yanıltıcı yanıtlarla belleği tüketmeyi engelle.
    const declared = Number(response.headers.get('content-length') || 0);
    if (declared > MAX_API_BYTES) {
      return { ok: false, status: 0, data: { error: 'Sunucu yanıtı çok büyük.' } };
    }
    const text = await response.text();
    if (Buffer.byteLength(text, 'utf8') > MAX_API_BYTES) {
      return { ok: false, status: 0, data: { error: 'Sunucu yanıtı çok büyük.' } };
    }
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch (_) {
      data = {};
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    const aborted = error && error.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      data: { error: aborted ? 'Sunucu yanıt vermedi. Bağlantını kontrol et.' : 'Sunucuya ulaşılamadı.' }
    };
  }
}

async function serverStatus(kind) {
  const source = STATUS_SOURCES[kind];
  if (!source) return { ok: false, error: 'Bilinmeyen sunucu.' };
  try {
    const response = await fetchWithTimeout(source, {
      headers: { Accept: 'application/json', 'User-Agent': 'TurboluApp/' + app.getVersion() }
    }, 9000);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (typeof data.online !== 'boolean') throw new Error('Geçersiz yanıt');
    return {
      ok: true,
      online: data.online,
      players: {
        online: Number(data.players && data.players.online) || 0,
        max: Number(data.players && data.players.max) || 0
      },
      version: data.version || '',
      hostname: data.hostname || '',
      ip: data.ip || '',
      cached: Boolean(data.debug && data.debug.cachehit)
    };
  } catch (error) {
    return { ok: false, error: 'Durum bilgisi alınamadı.' };
  }
}

/* ------------------------------------------------------------------ */
/* Pencere                                                             */
/* ------------------------------------------------------------------ */

function createWindow() {
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 940,
    minHeight: 620,
    show: false,
    backgroundColor: '#080b16',
    frame: isMac,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 18, y: 18 } : undefined,
    icon: path.join(__dirname, 'renderer', 'asset', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: isDev
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Uygulama hiçbir medya, bildirim veya konum izni istemez; hepsini reddet.
  const appSession = mainWindow.webContents.session;
  appSession.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  appSession.setPermissionCheckHandler(() => false);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev && process.env.TURBOLU_DEVTOOLS === '1') mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  // Geliştirme kolaylığı: TURBOLU_SHOT=yol verilirse ekran görüntüsü alıp kapanır.
  if (isDev && process.env.TURBOLU_SHOT) {
    mainWindow.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          if (process.env.TURBOLU_SHOT_PAGE) {
            await mainWindow.webContents.executeJavaScript(
              `navigate(${JSON.stringify(process.env.TURBOLU_SHOT_PAGE)})`
            );
            await new Promise((resolve) => setTimeout(resolve, 1200));
          }
          if (process.env.TURBOLU_SHOT_THEME) {
            await mainWindow.webContents.executeJavaScript(
              `applyTheme(${JSON.stringify(process.env.TURBOLU_SHOT_THEME)})`
            );
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
          // Arayüz testleri için: TURBOLU_SHOT_EVAL ile renderer'da betik çalıştır.
          if (process.env.TURBOLU_SHOT_EVAL) {
            await mainWindow.webContents.executeJavaScript(process.env.TURBOLU_SHOT_EVAL);
            await new Promise((resolve) => setTimeout(resolve, 2500));
          }
          const image = await mainWindow.webContents.capturePage();
          await fs.writeFile(path.resolve(process.env.TURBOLU_SHOT), image.toPNG());
        } finally {
          app.quit();
        }
      }, Number(process.env.TURBOLU_SHOT_DELAY) || 3500);
    });
  }

  mainWindow.on('maximize', () => mainWindow?.webContents.send('win:state', { maximized: true }));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('win:state', { maximized: false }));
  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Yalnızca uygulamanın kendi dosyası yüklenebilir (hash yeniden yüklemesi dâhil).
    if (String(url || '').split('#')[0] === APP_URL) return;
    event.preventDefault();
    openExternal(url);
  });

  mainWindow.webContents.on('will-redirect', (event, url) => {
    event.preventDefault();
    openExternal(url);
  });

  mainWindow.webContents.on('will-attach-webview', (event) => event.preventDefault());
}

function openExternal(rawUrl) {
  try {
    const url = new URL(String(rawUrl));
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    // Kimlik bilgisi içeren adresler (https://site@kotu-host) kabul edilmez.
    if (url.username || url.password) return false;
    const allowed = [WEBSITE, GITHUB, 'https://shrill-salad-a498.ereny116011.workers.dev'];
    const hostAllowed = allowed.some(base => url.origin === new URL(base).origin);
    if (!hostAllowed) return false;
    shell.openExternal(url.toString());
    return true;
  } catch (_) {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* IPC                                                                 */
/* ------------------------------------------------------------------ */

function registerIpc() {
  ipcMain.handle('app:info', () => ({
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node,
    website: WEBSITE,
    github: GITHUB,
    api: API_BASE
  }));

  ipcMain.handle('win:minimize', () => mainWindow?.minimize());
  ipcMain.handle('win:toggleMaximize', () => {
    if (!mainWindow) return false;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
    return mainWindow.isMaximized();
  });
  ipcMain.handle('win:close', () => mainWindow?.close());
  ipcMain.handle('win:isMaximized', () => Boolean(mainWindow && mainWindow.isMaximized()));

  ipcMain.handle('api:call', (_event, payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      return { ok: false, status: 400, data: { error: 'Geçersiz istek.' } };
    }
    return callApi(payload);
  });
  ipcMain.handle('server:status', (_event, kind) => serverStatus(kind));

  ipcMain.handle('auth:load', async () => {
    if (!sessionToken) sessionToken = await readSession();
    return sessionToken || '';
  });
  ipcMain.handle('auth:save', async (_event, token) => {
    const value = typeof token === 'string' ? token.trim() : '';
    if (!value || value.length > MAX_TOKEN_LENGTH || !TOKEN_PATTERN.test(value)) {
      return false;
    }
    await writeSession(value);
    return true;
  });
  ipcMain.handle('auth:clear', async () => {
    await writeSession('');
    return true;
  });

  ipcMain.handle('clipboard:write', (_event, text) => {
    const value = String(text == null ? '' : text).slice(0, 4096);
    clipboard.writeText(value);
    return true;
  });

  ipcMain.handle('shell:open', (_event, url) => openExternal(url));

  ipcMain.handle('theme:set', (_event, mode) => {
    const value = ['system', 'dark', 'light'].includes(mode) ? mode : 'system';
    nativeTheme.themeSource = value;
    return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
  });
}

/* ------------------------------------------------------------------ */
/* Yaşam döngüsü                                                       */
/* ------------------------------------------------------------------ */

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId('app.turbolu.desktop');
    Menu.setApplicationMenu(null);
    sessionToken = await readSession();
    registerIpc();
    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
