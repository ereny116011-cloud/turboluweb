'use strict';

/* TurboluApp PC — arayüz mantığı
   Tüm ağ çağrıları main süreçteki köprü üzerinden yapılır (window.turbolu).
   API'den gelen metinler her zaman esc() ile kaçırılır. */

/* ------------------------------------------------------------------ */
/* Sabitler                                                            */
/* ------------------------------------------------------------------ */

const JAVA_IP = 'turbolumc.aternos.me';
const BEDROCK_IP = 'turbolubedrock.mcsh.io';
const BEDROCK_ALT = '57.128.140.147:19132';

const STATUS_INTERVAL = 30000;
const FEED_LIMIT = 60;

const SVG = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/><path d="M9.5 20v-6h5v6"/></svg>',
  megaphone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 0 0 1 1h2l4.5 4V6L6 10H4a1 1 0 0 0-1 1Z"/><path d="M14.5 8.5a4.5 4.5 0 0 1 0 7"/><path d="M17.5 5.5a8.5 8.5 0 0 1 0 13"/></svg>',
  news: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h13v14H6a2 2 0 0 1-2-2V5Z"/><path d="M17 9h2a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2"/><path d="M7.5 8.5h6M7.5 12h6M7.5 15.5h4"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12.5 3.5H20v7.5l-8.2 8.2a1.5 1.5 0 0 1-2.1 0l-5.4-5.4a1.5 1.5 0 0 1 0-2.1Z"/><circle cx="16.3" cy="7.2" r="1.3"/></svg>',
  cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 10.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.3L20 7H6"/><circle cx="9.5" cy="19" r="1.3"/><circle cx="17.5" cy="19" r="1.3"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.5" r="3.6"/><path d="M4.8 20c.8-3.3 3.7-5.2 7.2-5.2s6.4 1.9 7.2 5.2"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 14.1a1.5 1.5 0 0 0 .3 1.7l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1.5 1.5 0 0 0-1.7-.3 1.5 1.5 0 0 0-.9 1.4v.2a1.8 1.8 0 1 1-3.6 0v-.1a1.5 1.5 0 0 0-1-1.4 1.5 1.5 0 0 0-1.7.3l-.1.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1.5 1.5 0 0 0 .3-1.7 1.5 1.5 0 0 0-1.4-.9H4a1.8 1.8 0 1 1 0-3.6h.1a1.5 1.5 0 0 0 1.4-1 1.5 1.5 0 0 0-.3-1.7l-.1-.1a1.8 1.8 0 1 1 2.6-2.6l.1.1a1.5 1.5 0 0 0 1.7.3h.1a1.5 1.5 0 0 0 .9-1.4V4a1.8 1.8 0 1 1 3.6 0v.1a1.5 1.5 0 0 0 .9 1.4 1.5 1.5 0 0 0 1.7-.3l.1-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1.5 1.5 0 0 0-.3 1.7v.1a1.5 1.5 0 0 0 1.4.9h.2a1.8 1.8 0 1 1 0 3.6h-.1a1.5 1.5 0 0 0-1.4.9Z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M15 5.5A2.5 2.5 0 0 0 12.5 3H6a2 2 0 0 0-2 2v8.5A2.5 2.5 0 0 0 6.5 16"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-13.6-4.7L4 8.5"/><path d="M4 4.5v4h4"/><path d="M4 13a8 8 0 0 0 13.6 4.7L20 15.5"/><path d="M20 19.5v-4h-4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 3 20h18L12 4Z"/><path d="M12 10v4.5"/><circle cx="12" cy="17.2" r=".7" fill="currentColor" stroke="none"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".7" fill="currentColor" stroke="none"/></svg>',
  external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5"/></svg>',
  package: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4v10l-8 4-8-4V7l8-4Z"/><path d="m4 7 8 4 8-4"/><path d="M12 11v10"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7"/><path d="M17 8.5 20.5 12 17 15.5"/><path d="M10.5 12h10"/></svg>',
  server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="6" rx="1.6"/><rect x="4" y="14" width="16" height="6" rx="1.6"/><path d="M7.5 7h.01M7.5 17h.01"/></svg>',
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 5 6v6c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M9 7V5h6v2"/><path d="m6.5 7 1 12a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1l1-12"/><path d="M10 11v5M14 11v5"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5Z"/></svg>',
  github: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.16-.02-2.1-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.39-5.25 5.68.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.67.8.56A11.52 11.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z"/></svg>',
  google: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.86c2.26-2.08 3.57-5.15 3.57-8.87Z"/><path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.86-3c-1.08.72-2.45 1.15-4.09 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.63H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.37l3.98-3.09Z"/><path fill="#EA4335" d="M12 4.76c1.76 0 3.35.61 4.6 1.8l3.42-3.42A11.9 11.9 0 0 0 12 0 12 12 0 0 0 1.29 6.63l3.98 3.09C6.22 6.87 8.87 4.76 12 4.76Z"/></svg>',
  microsoft: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F25022" d="M2 2h9.5v9.5H2z"/><path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z"/><path fill="#00A4EF" d="M2 12.5h9.5V22H2z"/><path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z"/></svg>',
  xbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M6.3 18.4c1.3-2.6 3.4-4.9 5.7-6.7M17.7 18.4c-1.3-2.6-3.4-4.9-5.7-6.7"/><path d="M6.5 5.9c2.1.4 4.3 2.2 5.5 4.1 1.2-1.9 3.4-3.7 5.5-4.1"/></svg>',
  gift: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8.5" width="18" height="4" rx="1"/><path d="M5 12.5V20h14v-7.5"/><path d="M12 8.5V20"/><path d="M12 8.5C10.4 5.4 6.7 5.4 6.7 7.8c0 1.6 2.6 1.5 5.3.7Z"/><path d="M12 8.5c1.6-3.1 5.3-3.1 5.3-.7 0 1.6-2.6 1.5-5.3.7Z"/></svg>',
  /* El çizimi manzara: kahraman kartının sağ altında durur. */
  doodle: `<svg viewBox="0 0 260 170" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
    <circle cx="196" cy="42" r="17" stroke="var(--ink-warm)" stroke-width="1.6" opacity=".85"/>
    <path d="M188 36c3 2 5 3 9 3M199 49c2-1 4-1 6-1" stroke="var(--ink-warm)" stroke-width="1.1" opacity=".5"/>
    <path d="M62 28v8M58 32h8" stroke="var(--accent)" stroke-width="1.2" opacity=".6"/>
    <path d="M124 18v6M121 21h6" stroke="var(--accent)" stroke-width="1.1" opacity=".45"/>
    <circle cx="160" cy="24" r="1.4" fill="var(--accent)" opacity=".6"/>
    <circle cx="88" cy="52" r="1.2" fill="var(--accent)" opacity=".5"/>
    <path d="M6 146c18-20 36-27 54-24 20 3 30 14 46 13 18-1 25-11 43-12 22-1 34 11 55 12 14 1 28-4 50-7" stroke="var(--accent)" stroke-width="1.8" opacity=".5"/>
    <path d="M24 146c6-14 16-22 30-23 12-1 21 5 29 13" stroke="var(--accent)" stroke-width="1.4" opacity=".32"/>
    <path d="M118 158c-4-14 2-24 12-31 8-6 16-10 24-18" stroke="var(--cyan)" stroke-width="1.4" stroke-dasharray="3 6" opacity=".5"/>
    <g stroke="var(--accent)" stroke-width="1.5" opacity=".78">
      <path d="M74 118l-9 16h18z"/><path d="M74 108l-7 13h14z"/><path d="M74 129v7"/>
    </g>
    <g stroke="var(--accent)" stroke-width="1.3" opacity=".6">
      <path d="M44 126l-7 13h14z"/><path d="M44 136v6"/>
    </g>
    <g stroke="var(--accent)" stroke-width="1.3" opacity=".55">
      <path d="M204 122l-7 13h14z"/><path d="M204 132v6"/>
    </g>
    <g stroke="var(--ink-warm)" stroke-width="1.4">
      <path d="M158 140v-20h30v20"/><path d="M154 121l19-13 19 13"/>
      <rect x="170" y="128" width="7" height="12" rx="1"/><path d="M166 131h-4M184 131h4"/>
    </g>
    <path d="M177 104c-4-5 2-7 0-11-2-3 2-4 2-7" stroke="var(--text-dim)" stroke-width="1.2" opacity=".4"/>
    <path d="M96 146v-7M104 147v-7M112 148v-7" stroke="var(--ink-warm)" stroke-width="1.2" opacity=".4"/>
  </svg>`
};

const state = {
  page: 'overview',
  token: '',
  user: null,
  platform: 'all',
  theme: 'system',
  info: null,
  servers: { java: null, bedrock: null },
  busy: false,
  welcomeOpen: false,
  oauthProviders: undefined,
  oauthLoading: false
};

/* ------------------------------------------------------------------ */
/* Yardımcılar                                                         */
/* ------------------------------------------------------------------ */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function esc(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

/* Görsel kaynakları: yerel yol, data:image veya izinli avatar sunucuları.
   Rastgele dış adresler kabul edilmez; aksi halde bir kullanıcı profiline
   koyduğu görselle diğer kullanıcıların IP adresini izleyebilirdi. */
const IMAGE_HOSTS = [
  'turboluweb.wasmer.app',
  'shrill-salad-a498.ereny116011.workers.dev',
  'avatars.githubusercontent.com',
  'lh3.googleusercontent.com',
  'graph.microsoft.com'
];

function safeImageSrc(value) {
  const url = String(value == null ? '' : value).trim();
  if (!url) return '';
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  if (/^[a-z0-9._\-/]+$/i.test(url) && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return '';
    if (!IMAGE_HOSTS.includes(parsed.hostname.toLowerCase())) return '';
    return parsed.href;
  } catch (_) {
    return '';
  }
}

function fmtDate(value, short) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  try {
    return date.toLocaleString('tr-TR', short
      ? { day: '2-digit', month: '2-digit', year: 'numeric' }
      : { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch (_) {
    return date.toISOString().slice(0, 10);
  }
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString('tr-TR');
}

function initial(name) {
  const text = String(name || '').trim();
  return text ? text.charAt(0).toUpperCase() : '?';
}

function platformLabel(value) {
  const platform = String(value || 'all');
  if (platform === 'java') return 'Java';
  if (platform === 'bedrock') return 'Bedrock';
  return 'Tüm platformlar';
}

function platformBadge(value) {
  const platform = String(value || 'all');
  if (platform === 'java' || platform === 'bedrock') {
    return `<span class="badge">${esc(platformLabel(platform))}</span>`;
  }
  return '<span class="badge">Tüm platformlar</span>';
}

function statusBadge(value) {
  const status = String(value || 'pending');
  if (status === 'completed') return '<span class="badge badge-green">Tamamlandı</span>';
  if (status === 'rejected') return '<span class="badge badge-red">Reddedildi</span>';
  return '<span class="badge badge-yellow">Beklemede</span>';
}

/* ------------------------------------------------------------------ */
/* Bildirim ve onay                                                    */
/* ------------------------------------------------------------------ */

function toast(message, type = 'info') {
  const host = $('#toasts');
  if (!host) return;
  const glyph = type === 'success' ? SVG.check : type === 'error' ? SVG.alert : SVG.info;
  const node = document.createElement('div');
  node.className = `toast toast-${type}`;
  node.innerHTML = `${glyph}<span>${esc(message)}</span>`;
  host.appendChild(node);
  setTimeout(() => {
    node.classList.add('is-leaving');
    setTimeout(() => node.remove(), 200);
  }, 3600);
}

function confirmDialog({ title, message, confirmText = 'Onayla', danger = false }) {
  return new Promise((resolve) => {
    const root = $('#modalRoot');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h3 id="modalTitle">${esc(title)}</h3>
        <p>${esc(message)}</p>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-modal="cancel">Vazgeç</button>
          <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'} btn-sm" data-modal="ok">${esc(confirmText)}</button>
        </div>
      </div>`;

    const finish = (result) => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve(result);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') finish(false);
      if (event.key === 'Enter') finish(true);
    };

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) finish(false);
      const action = event.target.closest('[data-modal]');
      if (!action) return;
      finish(action.dataset.modal === 'ok');
    });
    document.addEventListener('keydown', onKey);
    root.appendChild(backdrop);
    $('[data-modal="ok"]', backdrop).focus();
  });
}

/* ------------------------------------------------------------------ */
/* API erişimi                                                         */
/* ------------------------------------------------------------------ */

async function api(path, options = {}) {
  const payload = {
    path,
    method: options.method || 'GET',
    query: options.query,
    body: options.body
  };
  if (options.auth === false) payload.auth = false;

  const response = await window.turbolu.api(payload);
  if (response && response.status === 401 && state.token && options.auth !== false) {
    await clearSession();
    toast('Oturumun sona erdi, yeniden giriş yap.', 'error');
    if (state.page === 'account') renderAccount();
  }
  return response || { ok: false, status: 0, data: { error: 'Sunucuya ulaşılamadı.' } };
}

function apiError(response, fallback = 'İşlem tamamlanamadı.') {
  const data = response && response.data;
  if (data && typeof data.error === 'string' && data.error) return data.error;
  if (response && response.status === 0) return 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.';
  return fallback;
}

/* ------------------------------------------------------------------ */
/* Oturum                                                              */
/* ------------------------------------------------------------------ */

async function loadProfile() {
  if (!state.token) return null;
  const response = await api('/api/profile');
  if (response.ok && response.data && !response.data.error) {
    state.user = response.data;
    return state.user;
  }
  return null;
}

async function clearSession() {
  state.token = '';
  state.user = null;
  try { await window.turbolu.auth.clear(); } catch (_) { /* yoksay */ }
  paintAccountChip();
}

function paintAdminNav() {
  const item = $('#navAdmin');
  if (!item) return;
  const isAdmin = Boolean(state.user && state.user.isAdmin);
  item.hidden = !isAdmin;
}

function paintAccountChip() {
  const user = state.user;
  const avatar = $('#accountChipAvatar');
  const nameEl = $('#accountChipName');
  const metaEl = $('#accountChipMeta');
  const action = $('#accountChipAction');
  paintAdminNav();
  if (!avatar) return;

  if (user) {
    const icon = safeImageSrc(user.icon);
    avatar.innerHTML = icon
      ? `<img src="${esc(icon)}" alt="" referrerpolicy="no-referrer">`
      : esc(initial(user.username));
    nameEl.textContent = user.username || 'Hesap';
    metaEl.textContent = `${fmtNumber(user.balance)} puan${user.isAdmin ? ' · Yönetici' : ''}`;
    action.textContent = 'Hesap';
  } else {
    avatar.innerHTML = '?';
    nameEl.textContent = 'Misafir';
    metaEl.textContent = 'Giriş yapılmadı';
    action.textContent = 'Giriş';
  }
}

/* ------------------------------------------------------------------ */
/* Tema                                                                */
/* ------------------------------------------------------------------ */

function readTheme() {
  try {
    const saved = localStorage.getItem('turbolu.theme');
    return ['system', 'dark', 'light'].includes(saved) ? saved : 'system';
  } catch (_) {
    return 'system';
  }
}

function resolveTheme(mode) {
  if (mode === 'dark' || mode === 'light') return mode;
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch (_) {
    return 'dark';
  }
}

function applyTheme(mode) {
  state.theme = ['system', 'dark', 'light'].includes(mode) ? mode : 'system';
  document.documentElement.dataset.theme = resolveTheme(state.theme);
  try { localStorage.setItem('turbolu.theme', state.theme); } catch (_) { /* yoksay */ }
  if (window.turbolu && window.turbolu.setTheme) {
    window.turbolu.setTheme(state.theme).catch(() => {});
  }
  $$('[data-theme-choice]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themeChoice === state.theme);
  });
  const welcomeTheme = $('#welcomeTheme');
  if (welcomeTheme) welcomeTheme.innerHTML = welcomeThemeIcon();
}

/* ------------------------------------------------------------------ */
/* Sunucu durumu                                                       */
/* ------------------------------------------------------------------ */

const SERVER_META = {
  java: {
    label: 'TurboluMC Java',
    edition: 'Java Edition',
    ip: JAVA_IP,
    note: ''
  },
  bedrock: {
    label: 'Turbolu Bedrock',
    edition: 'Bedrock Edition',
    ip: BEDROCK_IP,
    note: BEDROCK_ALT
  }
};

function serverCard(kind, status) {
  const meta = SERVER_META[kind];
  const online = Boolean(status && status.ok && status.online);
  const pending = !status;
  const players = status && status.ok ? status.players : { online: 0, max: 0 };
  const max = Number(players.max) || 0;
  const pct = max > 0 ? Math.min(100, Math.round((Number(players.online) / max) * 100)) : 0;

  const dotClass = pending ? 'dot dot-loading' : online ? 'dot dot-online' : 'dot dot-offline';
  const stateText = pending ? 'Kontrol ediliyor…' : online ? 'Çevrimiçi' : 'Çevrimdışı';

  return `
    <div class="card server-card">
      <div class="server-card-head">
        <div class="server-name">
          <span class="${dotClass}" aria-hidden="true"></span>
          <span>${esc(meta.label)} <small>${esc(meta.edition)}</small></span>
        </div>
        <span class="server-state">${esc(stateText)}</span>
      </div>
      <div class="server-ip" role="button" tabindex="0" data-copy="${esc(meta.ip)}" title="Sunucu adresini kopyala">
        ${SVG.copy}
        <span>${esc(meta.ip)}</span>
      </div>
      <div class="server-meta">
        <span><b>${fmtNumber(players.online)}</b> / ${fmtNumber(max)} oyuncu</span>
        <span>${online && status.version ? 'Sürüm ' + esc(status.version) : online ? 'Sürüm bilinmiyor' : 'Sunucu kapalı'}</span>
      </div>
      <div class="player-bar"><span style="width:${pct}%"></span></div>
      ${meta.note ? `<p class="card-note" style="margin-top:12px">Alternatif adres: <b>${esc(meta.note)}</b></p>` : ''}
      ${kind === 'bedrock' ? `<p class="card-note" style="margin-top:4px">Port: <b>19132</b></p>` : ''}
    </div>`;
}

function paintServerGrid() {
  const grid = $('#serverGrid');
  if (!grid) return;
  grid.innerHTML = serverCard('java', state.servers.java) + serverCard('bedrock', state.servers.bedrock);
}

function paintServerMini() {
  Object.keys(SERVER_META).forEach((kind) => {
    const row = $(`[data-mini="${kind}"]`);
    if (!row) return;
    const status = state.servers[kind];
    const dot = $('.dot', row);
    const meta = $(`[data-mini-meta="${kind}"]`);
    if (!dot || !meta) return;
    dot.className = 'dot ' + (!status ? 'dot-loading' : status.ok && status.online ? 'dot-online' : 'dot-offline');
    if (!status) meta.textContent = '…';
    else if (!status.ok) meta.textContent = 'bilinmiyor';
    else if (!status.online) meta.textContent = 'kapalı';
    else meta.textContent = `${status.players.online} / ${status.players.max}`;
  });
}

function paintNet(online) {
  const dot = $('#netDot');
  const label = $('#netLabel');
  if (!dot || !label) return;
  dot.className = 'dot ' + (online ? 'dot-online' : 'dot-offline');
  label.textContent = online ? 'Çevrimiçi' : 'Bağlantı yok';
}

async function refreshServers() {
  const kinds = ['java', 'bedrock'];
  const results = await Promise.all(kinds.map(async (kind) => {
    try {
      return await window.turbolu.status(kind);
    } catch (_) {
      return { ok: false, error: 'Durum bilgisi alınamadı.' };
    }
  }));

  kinds.forEach((kind, index) => { state.servers[kind] = results[index]; });
  paintServerMini();
  paintServerGrid();
  paintHeroPlayers();

  const reachable = results.some((result) => result && result.ok);
  paintNet(reachable);
}

function startServerLoop() {
  refreshServers();
  setInterval(() => {
    if (document.hidden) return;
    refreshServers();
  }, STATUS_INTERVAL);
}

/* ------------------------------------------------------------------ */
/* Gezinme                                                             */
/* ------------------------------------------------------------------ */

const PAGES = {
  overview: { title: 'Genel Bakış', render: renderOverview },
  announcements: { title: 'Duyurular', render: () => renderFeed('announcements') },
  news: { title: 'Haberler', render: () => renderFeed('news') },
  campaigns: { title: 'Kampanyalar', render: () => renderFeed('campaigns') },
  market: { title: 'Market', render: renderMarket },
  account: { title: 'Hesabım', render: renderAccount },
  settings: { title: 'Ayarlar', render: renderSettings },
  admin: { title: 'Yönetim', render: renderAdmin }
};

function navigate(page) {
  const target = PAGES[page] ? page : 'overview';
  state.page = target;
  $$('.nav-item').forEach((item) => {
    item.classList.toggle('is-active', item.dataset.page === target);
    if (item.dataset.page === target) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  });
  const view = $('#view');
  view.innerHTML = '';
  view.style.animation = 'none';
  // Yeniden giriş animasyonunu tetikle.
  void view.offsetWidth;
  view.style.animation = '';
  $('#main').scrollTop = 0;
  PAGES[target].render();
}

/* ------------------------------------------------------------------ */
/* Sayfa: Genel Bakış                                                  */
/* ------------------------------------------------------------------ */

function pageHead(kicker, title, subtitle, action) {
  return `
    <div class="page-head">
      <div>
        <p class="page-kicker">${esc(kicker)}<span class="page-dateline">${esc(dayLabel())}</span></p>
        <h1 class="page-title">${esc(title)}</h1>
        <svg class="title-underline" viewBox="0 0 160 10" fill="none" aria-hidden="true" preserveAspectRatio="none">
          <path d="M2 6.2C28 3.1 55 7.4 84 4.8c26-2.3 46 .8 74-1.6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
          <path d="M14 8.6c22-1.2 44 .6 66-.4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity=".45"/>
        </svg>
        ${subtitle ? `<p class="page-sub">${esc(subtitle)}</p>` : ''}
      </div>
      ${action || ''}
    </div>`;
}

/* Her sayfanın başında görünen tarih; ajanda hissi verir. */
function dayLabel() {
  const now = new Date();
  try {
    const day = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
    const weekday = now.toLocaleDateString('tr-TR', { weekday: 'long' });
    return `${day} · ${weekday}`;
  } catch (_) {
    return now.toISOString().slice(0, 10);
  }
}

function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 6) return 'İyi geceler';
  if (hour < 12) return 'Günaydın';
  if (hour < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

function renderOverview() {
  const user = state.user;
  const greeting = user
    ? `${greetingForNow()}, <span class="marker">${esc(user.username)}</span>!`
    : `${greetingForNow()}! <span class="marker">Turbolu</span> dünyasına hoş geldin.`;
  const balance = user ? `${fmtNumber(user.balance)} puan` : 'Misafir';

  $('#view').innerHTML = `
    ${pageHead('Turbolu Studios', 'Genel Bakış', 'Sunucu durumu, duyurular ve hesabın tek ekranda.')}
    <section class="hero">
      <span class="hero-stamp" aria-hidden="true">El emeği<small>PC sürümü</small></span>
      <span class="hero-tape" aria-hidden="true"></span>
      <div class="hero-art" aria-hidden="true">${SVG.doodle}</div>
      <p class="hero-eyebrow">${SVG.spark} TurboluApp PC</p>
      <h2>${greeting}</h2>
      <p>Sunucuların canlı durumu, son duyurular ve market tek pencerede. Aşağıdaki kartlardan başlayabilirsin.</p>
      <div class="hero-actions">
        <button class="btn btn-primary" type="button" data-copy="${esc(JAVA_IP)}">${SVG.copy} Sunucu adresini kopyala</button>
        <button class="btn" type="button" data-goto="market">${SVG.cart} Market</button>
        <button class="btn btn-ghost" type="button" data-goto="account">${SVG.user} ${user ? 'Hesabım' : 'Giriş yap'}</button>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><strong id="heroJavaPlayers">—</strong><span>Java oyuncu</span></div>
        <div class="hero-stat"><strong id="heroBedrockPlayers">—</strong><span>Bedrock oyuncu</span></div>
        <div class="hero-stat"><strong>${esc(balance)}</strong><span>${user ? 'Bakiyen' : 'Hesap durumu'}</span></div>
      </div>
    </section>

    <div class="section-head">
      <h3>Sunucular</h3>
      <button class="link" type="button" id="refreshServers">${SVG.refresh} Yenile</button>
    </div>
    <div class="grid grid-2" id="serverGrid"></div>

    ${user && user.isChild ? `
    <div class="section-head">
      <h3>${SVG.gift} Sana özel hediyeler</h3>
    </div>
    <div id="childGiftHost" class="gift-grid"><div class="skeleton" style="height:120px"></div></div>` : ''}

    <div class="section-head">
      <h3>Son duyurular</h3>
      <button class="link" type="button" data-goto="announcements">Tümünü gör</button>
    </div>
    <div id="overviewFeed" class="feed"><div class="skeleton" style="height:86px"></div><div class="skeleton" style="height:86px"></div></div>
    <p class="overview-signoff"><span class="handwritten">iyi oyunlar!</span><span>— Turbolu Studios, ${esc(dayLabel())}</span></p>`;

  paintServerGrid();
  paintHeroPlayers();
  loadOverviewFeed();
  loadChildGifts();
}

/* Çocuk hesaplarına özel hediyeler. */
async function loadChildGifts() {
  const host = $('#childGiftHost');
  if (!host) return;
  const response = await api('/api/child-gifts', { query: { platform: state.platform }, auth: false });
  const target = $('#childGiftHost');
  if (!target) return;

  if (!response.ok || !Array.isArray(response.data)) {
    target.innerHTML = emptyState('Hediyeler yüklenemedi', apiError(response, 'Hediyeler şu an görüntülenemiyor.'), true);
    return;
  }
  if (!response.data.length) {
    target.innerHTML = `<div class="card gift-empty">${SVG.gift}<div><strong>Şimdilik hediye yok</strong><p>Yeni hediyeler eklendiğinde burada görünecek.</p></div></div>`;
    return;
  }

  target.innerHTML = response.data.map((gift) => `
    <article class="card gift-card">
      <span class="gift-ribbon" aria-hidden="true">${SVG.gift}</span>
      <h4>${esc(gift.title || 'Hediye')}</h4>
      <p>${esc(gift.description || '')}</p>
      ${gift.reward ? `<span class="gift-reward">${esc(gift.reward)}</span>` : ''}
    </article>`).join('');
}

function paintHeroPlayers() {
  const java = state.servers.java;
  const bedrock = state.servers.bedrock;
  const javaEl = $('#heroJavaPlayers');
  const bedrockEl = $('#heroBedrockPlayers');
  if (javaEl) {
    javaEl.textContent = !java ? '—' : java.ok && java.online ? fmtNumber(java.players.online) : '0';
  }
  if (bedrockEl) {
    bedrockEl.textContent = !bedrock ? '—' : bedrock.ok && bedrock.online ? fmtNumber(bedrock.players.online) : '0';
  }
}

async function loadOverviewFeed() {
  const host = $('#overviewFeed');
  if (!host) return;
  const response = await api('/api/announcements', { query: { platform: state.platform }, auth: false });
  const current = $('#overviewFeed');
  if (!current) return;

  if (!response.ok || !Array.isArray(response.data)) {
    current.innerHTML = emptyState('Duyurular yüklenemedi', apiError(response, 'Duyurular şu an görüntülenemiyor.'), true);
    return;
  }
  const list = response.data.slice(0, 3);
  if (list.length === 0) {
    current.innerHTML = emptyState('Henüz duyuru yok', 'Yeni duyurular yayınlandığında burada görünecek.');
    return;
  }
  current.innerHTML = list.map(feedItem).join('');
}

/* ------------------------------------------------------------------ */
/* Sayfa: İçerik akışları                                              */
/* ------------------------------------------------------------------ */

const FEED_PAGES = {
  announcements: {
    endpoint: '/api/announcements',
    kicker: 'Duyurular',
    title: 'Duyurular',
    subtitle: 'Sunucu ve toplulukla ilgili son gelişmeler.',
    emptyTitle: 'Henüz duyuru yok',
    emptyText: 'Yeni bir duyuru yayınlandığında burada listelenecek.'
  },
  news: {
    endpoint: '/api/news',
    kicker: 'Haberler',
    title: 'Haberler',
    subtitle: 'Turbolu Studios ve sunuculardan haberler.',
    emptyTitle: 'Henüz haber yok',
    emptyText: 'Yeni haberler yayınlandığında burada listelenecek.'
  },
  campaigns: {
    endpoint: '/api/campaigns',
    kicker: 'Kampanyalar',
    title: 'Kampanyalar',
    subtitle: 'Devam eden etkinlikler ve ödüllü kampanyalar.',
    emptyTitle: 'Henüz kampanya yok',
    emptyText: 'Yeni kampanyalar başladığında burada listelenecek.'
  }
};

function feedItem(entry) {
  const isCampaign = Object.prototype.hasOwnProperty.call(entry, 'description') && !entry.content;
  const body = isCampaign ? entry.description : entry.content;
  return `
    <article class="feed-item">
      <h4>${esc(entry.title || 'Başlıksız')}</h4>
      <p>${esc(body || '')}</p>
      <div class="feed-meta">
        <span>${esc(fmtDate(entry.date))}</span>
        ${platformBadge(entry.platform)}
        ${entry.reward ? `<span class="badge badge-green">Ödül: ${esc(entry.reward)}</span>` : ''}
        ${entry.endDate ? `<span class="badge">Bitiş: ${esc(fmtDate(entry.endDate, true))}</span>` : ''}
      </div>
    </article>`;
}

async function renderFeed(page) {
  const config = FEED_PAGES[page];
  if (!config) return;

  $('#view').innerHTML = `
    ${pageHead(config.kicker, config.title, config.subtitle,
      `<button class="btn btn-ghost btn-sm" type="button" id="refreshFeed">${SVG.refresh} Yenile</button>`)}
    <div id="feedHost" class="feed">
      <div class="skeleton" style="height:96px"></div>
      <div class="skeleton" style="height:96px"></div>
    </div>`;

  const load = async () => {
    const host = $('#feedHost');
    if (!host) return;
    host.innerHTML = '<div class="skeleton" style="height:96px"></div>';
    const response = await api(config.endpoint, { query: { platform: state.platform }, auth: false });
    const target = $('#feedHost');
    if (!target) return;
    if (!response.ok || !Array.isArray(response.data)) {
      target.innerHTML = emptyState('İçerik yüklenemedi', apiError(response, 'İçerik şu an görüntülenemiyor.'), true);
      return;
    }
    const list = response.data.slice(0, FEED_LIMIT);
    target.innerHTML = list.length === 0
      ? emptyState(config.emptyTitle, config.emptyText)
      : list.map(feedItem).join('');
  };

  $('#refreshFeed')?.addEventListener('click', load);
  load();
}

/* ------------------------------------------------------------------ */
/* Sayfa: Market                                                       */
/* ------------------------------------------------------------------ */

function itemCard(item) {
  const price = Number(item.price) || 0;
  return `
    <article class="item-card">
      <div class="item-glyph">${SVG.package}</div>
      <div>
        <h4 class="item-name">${esc(item.name || 'Ürün')}</h4>
        <p class="item-price"><span class="price-tag"><b>${fmtNumber(price)}</b> puan</span></p>
      </div>
      ${platformBadge(item.platform)}
      <button class="btn btn-primary btn-sm btn-block" type="button"
              data-buy="${esc(item.id || '')}" data-name="${esc(item.name || '')}" data-price="${price}">
        Satın al
      </button>
    </article>`;
}

async function renderMarket() {
  const user = state.user;
  $('#view').innerHTML = `
    ${pageHead('Market', 'Market', 'Puanlarınla sunucu içi ayrıcalıklar al. Talebin yöneticiler tarafından onaylandığında uygulanır.',
      `<div style="display:flex;align-items:center;gap:12px">
        <span class="badge ${user ? 'badge-green' : ''}">${user ? 'Bakiye: ' + fmtNumber(user.balance) + ' puan' : 'Giriş yapılmadı'}</span>
        <button class="btn btn-ghost btn-sm" type="button" id="refreshMarket">${SVG.refresh} Yenile</button>
      </div>`)}
    <div id="marketHost" class="market-grid">
      <div class="skeleton" style="height:190px"></div>
      <div class="skeleton" style="height:190px"></div>
      <div class="skeleton" style="height:190px"></div>
    </div>`;

  const load = async () => {
    const host = $('#marketHost');
    if (!host) return;
    const response = await api('/api/items', { query: { platform: state.platform }, auth: false });
    const target = $('#marketHost');
    if (!target) return;
    if (!response.ok || !Array.isArray(response.data)) {
      target.innerHTML = emptyState('Market yüklenemedi', apiError(response, 'Ürünler şu an görüntülenemiyor.'), true);
      return;
    }
    const items = response.data;
    target.innerHTML = items.length === 0
      ? emptyState('Market boş', 'Bu platform için henüz ürün eklenmemiş.')
      : items.map(itemCard).join('');
  };

  $('#refreshMarket')?.addEventListener('click', load);
  load();
}

async function buyItem(itemId, name, price) {
  if (!state.user) {
    toast('Satın almak için önce giriş yapmalısın.', 'error');
    navigate('account');
    return;
  }
  if (!itemId) return;

  const balance = Number(state.user.balance) || 0;
  if (balance < price) {
    toast(`Yetersiz bakiye. Bu ürün için ${fmtNumber(price - balance)} puan daha gerekiyor.`, 'error');
    return;
  }

  const approved = await confirmDialog({
    title: 'Satın alma onayı',
    message: `"${name}" ürününü ${fmtNumber(price)} puan karşılığında satın almak istiyor musun? Talebin yönetici onayına düşecek.`,
    confirmText: 'Satın al'
  });
  if (!approved) return;

  const response = await api('/api/buy', { method: 'POST', body: { itemId } });
  if (!response.ok) {
    toast(apiError(response, 'Satın alma tamamlanamadı.'), 'error');
    return;
  }

  toast('Talebin alındı. Yönetici onayından sonra uygulanacak.', 'success');
  await loadProfile();
  paintAccountChip();
  if (state.page === 'market') renderMarket();
}

/* ------------------------------------------------------------------ */
/* Karşılama ekranı ve sosyal giriş                                    */
/* ------------------------------------------------------------------ */

const OAUTH_META = {
  github: { label: 'GitHub', icon: SVG.github },
  google: { label: 'Google', icon: SVG.google },
  microsoft: { label: 'Microsoft', icon: SVG.microsoft },
  xbox: { label: 'Xbox', icon: SVG.xbox }
};

/* Sağlayıcı listesi bir kez alınır. `undefined` henüz sorulmadı,
   `false` istek başarısız, dizi ise sunucunun döndürdüğü liste. */
async function loadOAuthProviders() {
  if (state.oauthProviders !== undefined && state.oauthProviders !== false) {
    return state.oauthProviders;
  }
  if (state.oauthLoading) return null;
  state.oauthLoading = true;
  try {
    const response = await api('/api/auth/oauth/providers', { auth: false });
    if (response.ok && response.data && Array.isArray(response.data.providers)) {
      state.oauthProviders = response.data.providers.filter((name) => OAUTH_META[name]);
    } else {
      state.oauthProviders = false;
    }
  } catch (_) {
    state.oauthProviders = false;
  } finally {
    state.oauthLoading = false;
  }
  return state.oauthProviders;
}

function socialButtonsMarkup(providers) {
  return providers.map((provider) => {
    const meta = OAUTH_META[provider];
    if (!meta) return '';
    return `
      <button class="social-btn" type="button" data-oauth="${esc(provider)}">
        <span class="social-icon" aria-hidden="true">${meta.icon}</span>
        <span>${esc(meta.label)}</span>
      </button>`;
  }).join('');
}

async function refreshSocial(host) {
  if (!host) return;
  host.setAttribute('aria-busy', 'true');
  host.innerHTML = '<span class="social-loading"><span class="spinner" aria-hidden="true"></span> Giriş yöntemleri yükleniyor…</span>';
  const providers = await loadOAuthProviders();
  if (!host.isConnected) return;
  host.setAttribute('aria-busy', 'false');
  if (providers === false) {
    host.innerHTML = `<p class="social-note">${SVG.alert} Sosyal giriş şu an kullanılamıyor. Kullanıcı adınla giriş yapabilirsin.</p>`;
    return;
  }
  if (!providers.length) {
    host.innerHTML = '<p class="social-note">Sosyal giriş henüz etkin değil. Kullanıcı adınla giriş yapabilirsin.</p>';
    return;
  }
  host.innerHTML = `<div class="social-row">${socialButtonsMarkup(providers)}</div>`;
}

async function startSocialLogin(provider, scope) {
  if (!window.turbolu.oauth || state.busy) return;
  if (!OAUTH_META[provider]) return;

  const buttons = $$('[data-oauth]', scope || document);
  const active = scope ? $(`[data-oauth="${provider}"]`, scope) : null;
  const previous = active ? active.innerHTML : '';
  const errorEl = $('#welcomeError') || $('#loginError');

  if (errorEl) errorEl.textContent = '';
  state.busy = true;
  buttons.forEach((button) => { button.disabled = true; });
  if (active) {
    active.innerHTML = '<span class="spinner" aria-hidden="true"></span> Tarayıcı açılıyor…';
  }

  try {
    const result = await window.turbolu.oauth.login(provider);
    if (!result || !result.ok) {
      throw new Error((result && result.error) || 'Sosyal giriş tamamlanamadı.');
    }

    const exchange = await api('/api/auth/oauth/exchange', {
      method: 'POST',
      body: { code: result.code },
      auth: false
    });
    if (!exchange.ok || !exchange.data || !exchange.data.token) {
      throw new Error(apiError(exchange, 'Sosyal giriş tamamlanamadı.'));
    }

    await finishLogin(exchange.data, (OAUTH_META[provider] || {}).label || 'oyuncu');
  } catch (error) {
    const message = error && error.message ? error.message : 'Sosyal giriş tamamlanamadı.';
    if (errorEl) errorEl.textContent = message;
    else toast(message, 'error');
  } finally {
    state.busy = false;
    buttons.forEach((button) => { button.disabled = false; });
    if (active) active.innerHTML = previous;
  }
}

function bindSocialButtons(scope) {
  if (!scope) return;
  scope.addEventListener('click', (event) => {
    const button = event.target.closest('[data-oauth]');
    if (!button) return;
    event.preventDefault();
    startSocialLogin(button.dataset.oauth, scope);
  });
}

async function finishLogin(data, fallbackName, options = {}) {
  state.token = data.token;
  await window.turbolu.auth.save(state.token);
  await loadProfile();

  if (!state.user) {
    // Profil isteği aksasa bile giriş başarılı; temel bilgilerle devam et.
    state.user = {
      username: data.username || fallbackName || 'oyuncu',
      balance: Number(data.balance) || 0,
      isAdmin: Boolean(data.isAdmin)
    };
  }

  paintAccountChip();

  // Yeni kayıt veya yarım kalmış kurulum: önce hesap kurulumu sorulur.
  const needsSetup = options.setup === true || state.user.setupCompleted === false;
  if (needsSetup) {
    toast(`Hoş geldin, ${state.user.username || fallbackName || 'oyuncu'}!`, 'success');
    showSetup();
    return;
  }

  hideWelcome();
  toast(`Hoş geldin, ${state.user.username || fallbackName || 'oyuncu'}!`, 'success');

  if (state.page === 'account') renderAccount();
  else navigate(state.page || 'overview');
}

function welcomeThemeIcon() {
  const light = document.documentElement.dataset.theme === 'light';
  return light ? SVG.moon : SVG.sun;
}

function welcomeMarkup() {
  return `
    <div class="welcome-panel" role="dialog" aria-modal="true" aria-labelledby="welcomeTitle">
      <aside class="welcome-aside">
        <div class="welcome-brand">
          <img src="asset/logo.png" alt="" width="34" height="34">
          <span>Turbolu Studios<small>TurboluApp PC</small></span>
        </div>
        <div class="welcome-story">
          <p class="welcome-kicker">Sunucular, market, duyurular</p>
          <h1>Kaldığın yerden<br>devam et.</h1>
          <p class="welcome-lede">Hesabına giriş yap; bakiyen, taleplerin ve market tek yerde seni bekliyor.</p>
        </div>
        <div class="welcome-art" aria-hidden="true">${SVG.doodle}</div>
        <p class="welcome-foot"><span class="handwritten">iyi oyunlar</span><span>Turbolu Studios</span></p>
      </aside>

      <section class="welcome-main">
        <div class="welcome-top">
          <span class="welcome-step">Hoş geldin</span>
          <button class="icon-ghost welcome-theme" type="button" id="welcomeTheme" aria-label="Temayı değiştir" title="Temayı değiştir">${welcomeThemeIcon()}</button>
        </div>

        <h2 id="welcomeTitle">Giriş yap</h2>
        <p class="welcome-sub" id="welcomeSub">Turbolu hesabınla devam et.</p>

        <div class="social-host" id="welcomeSocial" aria-busy="true"></div>
        <div class="welcome-divider"><span>veya</span></div>

        <form class="welcome-form" id="welcomeLoginForm" novalidate>
          <div class="welcome-field">
            <label for="welcomeUsername">Kullanıcı adı</label>
            <input class="input" id="welcomeUsername" name="username" autocomplete="username" placeholder="Kullanıcı adın" required>
          </div>
          <div class="welcome-field">
            <label for="welcomePassword">Parola</label>
            <input class="input" id="welcomePassword" name="password" type="password" autocomplete="current-password" placeholder="Parolan" required>
          </div>
          <p class="form-error" id="welcomeError" role="alert"></p>
          <button class="btn btn-primary btn-block welcome-submit" type="submit" id="welcomeLoginSubmit">Giriş yap</button>
          <button class="welcome-forgot" type="button" id="welcomeForgot">Parolanı mı unuttun?</button>
        </form>

        <form class="welcome-form" id="welcomeRegisterForm" novalidate hidden>
          <div class="welcome-field">
            <label for="welcomeRegUsername">Kullanıcı adı</label>
            <input class="input" id="welcomeRegUsername" name="username" autocomplete="username" placeholder="En az 3 karakter" required>
          </div>
          <div class="welcome-field">
            <label for="welcomeRegEmail">E-posta</label>
            <input class="input" id="welcomeRegEmail" name="email" type="email" autocomplete="email" placeholder="ornek@eposta.com" required>
          </div>
          <div class="welcome-field">
            <label for="welcomeRegPassword">Parola</label>
            <input class="input" id="welcomeRegPassword" name="password" type="password" autocomplete="new-password" placeholder="En az 6 karakter" required>
          </div>
          <div class="welcome-field">
            <label for="welcomeRegPlatform">Platform</label>
            <select class="input" id="welcomeRegPlatform" name="platform">
              <option value="all">İkisi de</option>
              <option value="java">Java</option>
              <option value="bedrock">Bedrock</option>
            </select>
          </div>
          <p class="form-error" id="welcomeRegError" role="alert"></p>
          <button class="btn btn-primary btn-block welcome-submit" type="submit" id="welcomeRegisterSubmit">Hesap oluştur</button>
        </form>

        <button class="welcome-switch" type="button" id="welcomeSwitch">Hesabın yok mu? <b>Kayıt ol</b></button>
        <button class="welcome-guest" type="button" id="welcomeGuest">Şimdi değil, misafir olarak devam et</button>
      </section>
    </div>`;
}

function showWelcome() {
  const host = $('#welcome');
  if (!host || state.welcomeOpen) return;
  host.innerHTML = welcomeMarkup();
  host.hidden = false;
  state.welcomeOpen = true;
  document.body.classList.add('welcome-open');
  bindWelcome();
  refreshSocial($('#welcomeSocial'));
  setTimeout(() => { $('#welcomeUsername')?.focus(); }, 320);
}

function hideWelcome() {
  const host = $('#welcome');
  if (!host) return;
  host.hidden = true;
  host.innerHTML = '';
  state.welcomeOpen = false;
  document.body.classList.remove('welcome-open');
}

function bindWelcome() {
  const host = $('#welcome');
  if (!host) return;

  const loginForm = $('#welcomeLoginForm');
  const registerForm = $('#welcomeRegisterForm');
  const title = $('#welcomeTitle');
  const subtitle = $('#welcomeSub');
  const switchButton = $('#welcomeSwitch');

  const setMode = (mode) => {
    const register = mode === 'register';
    loginForm.hidden = register;
    registerForm.hidden = !register;
    title.textContent = register ? 'Aramıza katıl' : 'Giriş yap';
    subtitle.textContent = register
      ? 'Birkaç saniyede hesabını oluştur.'
      : 'Turbolu hesabınla devam et.';
    switchButton.innerHTML = register
      ? 'Zaten hesabın var mı? <b>Giriş yap</b>'
      : 'Hesabın yok mu? <b>Kayıt ol</b>';
    $('#welcomeError').textContent = '';
    $('#welcomeRegError').textContent = '';
    setTimeout(() => {
      (register ? $('#welcomeRegUsername') : $('#welcomeUsername'))?.focus();
    }, 30);
  };

  switchButton.addEventListener('click', () => {
    setMode(registerForm.hidden ? 'register' : 'login');
  });

  $('#welcomeGuest')?.addEventListener('click', hideWelcome);

  $('#welcomeTheme')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    const button = $('#welcomeTheme');
    if (button) button.innerHTML = welcomeThemeIcon();
  });

  $('#welcomeForgot')?.addEventListener('click', () => {
    window.turbolu.open('https://turboluweb.wasmer.app/sifremi-unuttum.html');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;

    const errorEl = $('#welcomeError');
    errorEl.textContent = '';
    const username = $('#welcomeUsername').value.trim();
    const password = $('#welcomePassword').value;
    if (!username || !password) {
      errorEl.textContent = 'Kullanıcı adı ve parola gerekli.';
      return;
    }

    state.busy = true;
    const submit = $('#welcomeLoginSubmit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Giriş yapılıyor…';

    const response = await api('/api/login', { method: 'POST', body: { username, password }, auth: false });

    state.busy = false;
    submit.disabled = false;
    submit.textContent = 'Giriş yap';

    if (!response.ok || !response.data || !response.data.token) {
      errorEl.textContent = apiError(response, 'Giriş yapılamadı. Bilgilerini kontrol et.');
      return;
    }

    await finishLogin(response.data, username);
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;

    const errorEl = $('#welcomeRegError');
    errorEl.textContent = '';
    const username = $('#welcomeRegUsername').value.trim();
    const email = $('#welcomeRegEmail').value.trim();
    const password = $('#welcomeRegPassword').value;
    const platform = $('#welcomeRegPlatform').value;

    if (username.length < 3) {
      errorEl.textContent = 'Kullanıcı adı en az 3 karakter olmalı.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Geçerli bir e-posta adresi gir.';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'Parola en az 6 karakter olmalı.';
      return;
    }

    state.busy = true;
    const submit = $('#welcomeRegisterSubmit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Hesap oluşturuluyor…';

    const response = await api('/api/register', {
      method: 'POST',
      body: { username, password, email, platform },
      auth: false
    });

    state.busy = false;
    submit.disabled = false;
    submit.textContent = 'Hesap oluştur';

    if (!response.ok || !response.data || !response.data.token) {
      errorEl.textContent = apiError(response, 'Kayıt tamamlanamadı.');
      return;
    }

    await finishLogin(response.data, username, { setup: true });
  });

  bindSocialButtons($('#welcomeSocial'));

  // Klavye odağı pencere içinde kalsın.
  host.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = $$('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]', host)
      .filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* ------------------------------------------------------------------ */
/* Hesap kurulumu (kayıttan sonra)                                     */
/* ------------------------------------------------------------------ */

const MINECRAFT_JAVA_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
const MINECRAFT_BEDROCK_PATTERN = /^[\p{L}\p{N} _.-]{2,20}$/u;

function todayValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function setupMarkup() {
  const user = state.user || {};
  return `
    <div class="welcome-panel setup-panel" role="dialog" aria-modal="true" aria-labelledby="setupTitle">
      <aside class="welcome-aside">
        <div class="welcome-brand">
          <img src="asset/logo.png" alt="" width="34" height="34">
          <span>Turbolu Studios<small>TurboluApp PC</small></span>
        </div>
        <div class="welcome-story">
          <p class="welcome-kicker">Son bir adım</p>
          <h1>Seni sunucuda<br>tanıyalım.</h1>
          <p class="welcome-lede">Minecraft adlarını ve doğum tarihini ekle; taleplerin doğru oyuncuya ulaşsın. Doğum tarihin başka kimseye gösterilmez.</p>
        </div>
        <ol class="setup-list">
          <li><span>1</span> Minecraft kullanıcı adları</li>
          <li><span>2</span> Doğum tarihi</li>
          <li><span>3</span> Hediyeler ve market</li>
        </ol>
        <p class="welcome-foot"><span class="handwritten">iyi oyunlar</span><span>${esc(user.username || 'Turbolu Studios')}</span></p>
      </aside>

      <section class="welcome-main">
        <div class="welcome-top">
          <span class="welcome-step">Hesap kurulumu</span>
          <button class="icon-ghost welcome-theme" type="button" id="setupTheme" aria-label="Temayı değiştir" title="Temayı değiştir">${welcomeThemeIcon()}</button>
        </div>

        <h2 id="setupTitle">Kurulumu tamamla</h2>
        <p class="welcome-sub">Hoş geldin${user.username ? ', ' + esc(user.username) : ''}! Birkaç bilgi daha ekleyelim.</p>

        <form class="welcome-form setup-form" id="setupForm" novalidate>
          <div class="setup-group">
            <p class="setup-group-title">Minecraft hesapların</p>
            <div class="welcome-field">
              <label for="setupJava">Java sürümü kullanıcı adı</label>
              <input class="input" id="setupJava" name="minecraftJava" autocomplete="off" spellcheck="false"
                     placeholder="Örn. TurboluMC" value="${esc(user.minecraftJava || '')}">
            </div>
            <div class="welcome-field">
              <label for="setupBedrock">Bedrock sürümü oyuncu adı</label>
              <input class="input" id="setupBedrock" name="minecraftBedrock" autocomplete="off" spellcheck="false"
                     placeholder="Örn. TurboluMC" value="${esc(user.minecraftBedrock || '')}">
            </div>
            <p class="setup-hint">En az birini doldur. Yalnızca tek sürümde oynuyorsan diğerini boş bırakabilirsin.</p>
          </div>

          <div class="welcome-field">
            <label for="setupBirth">Doğum tarihi</label>
            <input class="input" id="setupBirth" name="birthDate" type="date" max="${todayValue()}"
                   value="${esc(user.birthDate || '')}" required>
          </div>

          <p class="form-error" id="setupError" role="alert"></p>
          <button class="btn btn-primary btn-block welcome-submit" type="submit" id="setupSubmit">Kurulumu tamamla</button>
          <button class="welcome-guest" type="button" id="setupSkip">Şimdilik atla, sonra tamamlarım</button>
        </form>
      </section>
    </div>`;
}

function showSetup() {
  const host = $('#welcome');
  if (!host) return;
  host.innerHTML = setupMarkup();
  host.hidden = false;
  state.welcomeOpen = true;
  document.body.classList.add('welcome-open');
  bindSetup();
  setTimeout(() => { $('#setupJava')?.focus(); }, 260);
}

function bindSetup() {
  const host = $('#welcome');
  if (!host) return;

  $('#setupTheme')?.addEventListener('click', () => {
    applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
    const button = $('#setupTheme');
    if (button) button.innerHTML = welcomeThemeIcon();
  });

  $('#setupSkip')?.addEventListener('click', () => {
    hideWelcome();
    toast('Kurulumu daha sonra Hesabım sayfasından tamamlayabilirsin.', 'info');
    if (state.page === 'account') renderAccount();
    else navigate(state.page || 'overview');
  });

  $('#setupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;

    const errorEl = $('#setupError');
    errorEl.textContent = '';

    const minecraftJava = $('#setupJava').value.trim();
    const minecraftBedrock = $('#setupBedrock').value.trim();
    const birthDate = $('#setupBirth').value;

    if (!minecraftJava && !minecraftBedrock) {
      errorEl.textContent = 'En az bir Minecraft kullanıcı adı gir.';
      return;
    }
    if (minecraftJava && !MINECRAFT_JAVA_PATTERN.test(minecraftJava)) {
      errorEl.textContent = 'Java adı 3-16 karakter olmalı (harf, rakam, alt çizgi).';
      return;
    }
    if (minecraftBedrock && !MINECRAFT_BEDROCK_PATTERN.test(minecraftBedrock)) {
      errorEl.textContent = 'Bedrock adı 2-20 karakter olabilir.';
      return;
    }
    if (!birthDate) {
      errorEl.textContent = 'Doğum tarihini seç.';
      return;
    }
    if (birthDate > todayValue()) {
      errorEl.textContent = 'Doğum tarihi gelecekte olamaz.';
      return;
    }

    state.busy = true;
    const submit = $('#setupSubmit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner" aria-hidden="true"></span> Kaydediliyor…';

    const response = await api('/api/profile', {
      method: 'PUT',
      body: { minecraftJava, minecraftBedrock, birthDate, setupCompleted: true }
    });

    state.busy = false;
    submit.disabled = false;
    submit.textContent = 'Kurulumu tamamla';

    if (!response.ok) {
      errorEl.textContent = apiError(response, 'Kurulum kaydedilemedi.');
      return;
    }

    await loadProfile();
    paintAccountChip();
    hideWelcome();
    toast('Kurulum tamamlandı. İyi oyunlar!', 'success');
    if (state.user && state.user.isChild) {
      toast('Sana özel hediyeler Genel Bakış sayfasında seni bekliyor.', 'info');
    }

    if (state.page === 'account') renderAccount();
    else navigate(state.page || 'overview');
  });
}

/* ------------------------------------------------------------------ */
/* Sayfa: Hesabım                                                      */
/* ------------------------------------------------------------------ */

function authCard() {
  return `
    <div class="auth-shell">
      <p class="auth-note handwritten">küçük not: parolanı kimseyle paylaşma.</p>
      <div class="card auth-card">
        <span class="card-tape" aria-hidden="true"></span>
        <div class="social-host auth-social" data-social-host></div>
        <div class="welcome-divider"><span>veya</span></div>
        <div class="auth-tabs" role="tablist">
          <button class="auth-tab is-active" type="button" data-auth-tab="login" role="tab" aria-selected="true">Giriş yap</button>
          <button class="auth-tab" type="button" data-auth-tab="register" role="tab" aria-selected="false">Kayıt ol</button>
        </div>

        <form id="loginForm" novalidate>
          <div class="field">
            <label for="loginUsername">Kullanıcı adı</label>
            <input class="input" id="loginUsername" name="username" autocomplete="username" placeholder="Kullanıcı adın" required>
          </div>
          <div class="field">
            <label for="loginPassword">Parola</label>
            <input class="input" id="loginPassword" name="password" type="password" autocomplete="current-password" placeholder="Parolan" required>
          </div>
          <p class="form-error" id="loginError" role="alert"></p>
          <button class="btn btn-primary btn-block" type="submit" id="loginSubmit">Giriş yap</button>
          <p class="form-hint">Şifreni mi unuttun? Sıfırlama bağlantısını web sitesinden isteyebilirsin.</p>
        </form>

        <form id="registerForm" novalidate hidden>
          <div class="field">
            <label for="regUsername">Kullanıcı adı</label>
            <input class="input" id="regUsername" name="username" autocomplete="username" placeholder="En az 3 karakter" required>
          </div>
          <div class="field">
            <label for="regEmail">E-posta</label>
            <input class="input" id="regEmail" name="email" type="email" autocomplete="email" placeholder="ornek@eposta.com" required>
          </div>
          <div class="field">
            <label for="regPassword">Parola</label>
            <input class="input" id="regPassword" name="password" type="password" autocomplete="new-password" placeholder="En az 6 karakter" required>
          </div>
          <div class="field">
            <label for="regPlatform">Platform</label>
            <select class="input" id="regPlatform" name="platform">
              <option value="all">İkisi de</option>
              <option value="java">Java</option>
              <option value="bedrock">Bedrock</option>
            </select>
          </div>
          <p class="form-error" id="registerError" role="alert"></p>
          <button class="btn btn-primary btn-block" type="submit" id="registerSubmit">Hesap oluştur</button>
          <p class="form-hint">Kayıt olarak Turbolu Studios kurallarını kabul etmiş olursun.</p>
        </form>
      </div>
    </div>`;
}

function bindAuthCard() {
  const tabs = $$('[data-auth-tab]');
  const loginForm = $('#loginForm');
  const registerForm = $('#registerForm');

  const socialHost = $('[data-social-host]', $('.auth-card'));
  bindSocialButtons(socialHost);
  refreshSocial(socialHost);

  const selectTab = (tab) => {
    tabs.forEach((button) => {
      const active = button.dataset.authTab === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    loginForm.hidden = tab !== 'login';
    registerForm.hidden = tab !== 'register';
    $('.form-error', loginForm).textContent = '';
    $('.form-error', registerForm).textContent = '';
  };

  tabs.forEach((button) => button.addEventListener('click', () => selectTab(button.dataset.authTab)));

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;
    const errorEl = $('#loginError');
    errorEl.textContent = '';
    const username = $('#loginUsername').value.trim();
    const password = $('#loginPassword').value;
    if (!username || !password) {
      errorEl.textContent = 'Kullanıcı adı ve parola gerekli.';
      return;
    }

    state.busy = true;
    const submit = $('#loginSubmit');
    submit.disabled = true;
    submit.textContent = 'Giriş yapılıyor…';

    const response = await api('/api/login', { method: 'POST', body: { username, password }, auth: false });

    state.busy = false;
    submit.disabled = false;
    submit.textContent = 'Giriş yap';

    if (!response.ok || !response.data || !response.data.token) {
      errorEl.textContent = apiError(response, 'Giriş yapılamadı. Bilgilerini kontrol et.');
      return;
    }

    await finishLogin(response.data, username);
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (state.busy) return;
    const errorEl = $('#registerError');
    errorEl.textContent = '';

    const username = $('#regUsername').value.trim();
    const email = $('#regEmail').value.trim();
    const password = $('#regPassword').value;
    const platform = $('#regPlatform').value;

    if (username.length < 3) {
      errorEl.textContent = 'Kullanıcı adı en az 3 karakter olmalı.';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Geçerli bir e-posta adresi gir.';
      return;
    }
    if (password.length < 6) {
      errorEl.textContent = 'Parola en az 6 karakter olmalı.';
      return;
    }

    state.busy = true;
    const submit = $('#registerSubmit');
    submit.disabled = true;
    submit.textContent = 'Hesap oluşturuluyor…';

    const response = await api('/api/register', {
      method: 'POST',
      body: { username, password, email, platform },
      auth: false
    });

    state.busy = false;
    submit.disabled = false;
    submit.textContent = 'Hesap oluştur';

    if (!response.ok || !response.data || !response.data.token) {
      errorEl.textContent = apiError(response, 'Kayıt tamamlanamadı.');
      return;
    }

    await finishLogin(response.data, username, { setup: true });
  });
}

function profileView(user) {
  const icon = safeImageSrc(user.icon);
  return `
    <div class="card">
      <div class="profile-head">
        <div class="profile-avatar">${icon ? `<img src="${esc(icon)}" alt="" referrerpolicy="no-referrer">` : esc(initial(user.username))}</div>
        <div>
          <h2 class="profile-name">${esc(user.username || 'Hesap')}</h2>
          <p class="profile-meta">${esc(user.email || 'E-posta yok')}${user.isAdmin ? ' · Yönetici' : ''}</p>
        </div>
      </div>
      <div class="stat-row">
        <div class="stat-box"><span>Bakiye</span><strong>${fmtNumber(user.balance)}</strong></div>
        <div class="stat-box"><span>Platform</span><strong style="font-size:15px">${esc(platformLabel(user.platform))}</strong></div>
        <div class="stat-box"><span>Kayıt</span><strong style="font-size:15px">${esc(fmtDate(user.createdAt, true))}</strong></div>
      </div>

      <div class="mc-list">
        <div class="mc-row"><span>Java adı</span><strong>${user.minecraftJava ? esc(user.minecraftJava) : '—'}</strong></div>
        <div class="mc-row"><span>Bedrock adı</span><strong>${user.minecraftBedrock ? esc(user.minecraftBedrock) : '—'}</strong></div>
        <div class="mc-row"><span>Doğum tarihi</span><strong>${user.birthDate ? esc(fmtDate(user.birthDate, true)) : '—'}</strong></div>
        <div class="mc-row"><span>Hesap</span><strong>${user.isChild ? 'Çocuk hesabı' : 'Yetişkin hesabı'}</strong></div>
      </div>

      ${user.setupCompleted === false ? `
      <p class="mc-note">Hesabın henüz tamamlanmadı. Minecraft adlarını ve doğum tarihini ekleyerek başlayabilirsin.</p>` : ''}

      <div style="display:flex;gap:9px;margin-top:20px;flex-wrap:wrap">
        <button class="btn btn-sm" type="button" id="refreshAccount">${SVG.refresh} Yenile</button>
        <button class="btn btn-sm ${user.setupCompleted === false ? 'btn-primary' : ''}" type="button" id="editSetupBtn">${SVG.user} ${user.setupCompleted === false ? 'Kurulumu tamamla' : 'Bilgileri düzenle'}</button>
        <button class="btn btn-sm btn-ghost" type="button" data-goto="market">${SVG.cart} Market</button>
        <button class="btn btn-sm btn-danger" type="button" id="logoutBtn" style="margin-left:auto">${SVG.logout} Çıkış yap</button>
      </div>
    </div>

    <div class="section-head"><h3>Taleplerim</h3></div>
    <div id="inventoryHost" class="feed"><div class="skeleton" style="height:70px"></div></div>`;
}

async function renderAccount() {
  const user = state.user;

  if (!user) {
    $('#view').innerHTML = `
      ${pageHead('Hesabım', 'Giriş yap', 'Turbolu hesabınla giriş yap veya yeni bir hesap oluştur.')}
      ${authCard()}`;
    bindAuthCard();
    return;
  }

  $('#view').innerHTML = `
    ${pageHead('Hesabım', 'Hesabım', 'Bakiyen, taleplerin ve hesap bilgilerin.')}
    ${profileView(user)}`;

  $('#logoutBtn')?.addEventListener('click', async () => {
    const approved = await confirmDialog({
      title: 'Çıkış yap',
      message: 'Oturumunu kapatmak istediğine emin misin?',
      confirmText: 'Çıkış yap',
      danger: true
    });
    if (!approved) return;
    await clearSession();
    toast('Çıkış yapıldı.', 'info');
    renderAccount();
  });

  $('#refreshAccount')?.addEventListener('click', async () => {
    await loadProfile();
    paintAccountChip();
    renderAccount();
    toast('Hesap bilgileri güncellendi.', 'success');
  });

  $('#editSetupBtn')?.addEventListener('click', () => {
    showSetup();
  });

  loadInventory();
}

async function loadInventory() {
  const host = $('#inventoryHost');
  if (!host) return;
  const response = await api('/api/inventory');
  const target = $('#inventoryHost');
  if (!target) return;

  if (!response.ok || !Array.isArray(response.data)) {
    target.innerHTML = emptyState('Talepler yüklenemedi', apiError(response, 'Taleplerin şu an görüntülenemiyor.'), true);
    return;
  }
  if (response.data.length === 0) {
    target.innerHTML = emptyState('Henüz talebin yok', 'Marketten bir ürün aldığında talebin burada görünecek.', false);
    return;
  }

  target.innerHTML = response.data.map((entry) => `
    <article class="feed-item">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:14px">
        <div>
          <h4>${esc(entry.item || 'Ürün')}</h4>
          <p>${fmtNumber(entry.price)} puan · ${esc(fmtDate(entry.date))}</p>
        </div>
        ${statusBadge(entry.status)}
      </div>
    </article>`).join('');
}

/* ------------------------------------------------------------------ */
/* Sayfa: Ayarlar                                                      */
/* ------------------------------------------------------------------ */

async function renderSettings() {
  const info = state.info || {};
  const platform = state.platform;

  $('#view').innerHTML = `
    ${pageHead('Ayarlar', 'Ayarlar', 'Görünüm, içerik filtresi ve uygulama bilgileri.')}

    <div class="card">
      <div class="card-head"><h3 class="card-title">Görünüm</h3><p class="card-note">Tema tüm uygulamaya uygulanır.</p></div>
      <div class="settings-row">
        <div class="settings-label">
          <strong>Tema</strong>
          <small>Sistem seçeneği işletim sisteminin açık/koyu tercihini izler.</small>
        </div>
        <div class="segmented" id="themeChoices">
          <button type="button" data-theme-choice="system" class="${state.theme === 'system' ? 'is-active' : ''}">Sistem</button>
          <button type="button" data-theme-choice="dark" class="${state.theme === 'dark' ? 'is-active' : ''}">Koyu</button>
          <button type="button" data-theme-choice="light" class="${state.theme === 'light' ? 'is-active' : ''}">Açık</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3 class="card-title">İçerik filtresi</h3><p class="card-note">Duyuru, haber, kampanya ve market listelerini filtreler.</p></div>
      <div class="settings-row">
        <div class="settings-label">
          <strong>Platform</strong>
          <small>Yalnızca seçtiğin platforma ait içerikler gösterilir.</small>
        </div>
        <div class="segmented" id="platformChoices">
          <button type="button" data-platform-choice="all" class="${platform === 'all' ? 'is-active' : ''}">Tümü</button>
          <button type="button" data-platform-choice="java" class="${platform === 'java' ? 'is-active' : ''}">Java</button>
          <button type="button" data-platform-choice="bedrock" class="${platform === 'bedrock' ? 'is-active' : ''}">Bedrock</button>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3 class="card-title">Uygulama bilgileri</h3></div>
      <div class="kv"><span>Sürüm</span><b>${esc(info.version || '—')}</b></div>
      <div class="kv"><span>Platform</span><b>${esc((info.platform || '') + ' · ' + (info.arch || ''))}</b></div>
      <div class="kv"><span>Electron</span><b>${esc(info.electron || '—')}</b></div>
      <div class="kv"><span>Chromium</span><b>${esc(info.chrome || '—')}</b></div>
      <div class="kv"><span>Node.js</span><b>${esc(info.node || '—')}</b></div>
      <div class="kv"><span>API</span><b style="max-width:60%">${esc(info.api || '—')}</b></div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3 class="card-title">Bağlantılar</h3></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-sm" type="button" id="openSite">${SVG.external} Web sitesi</button>
        <button class="btn btn-sm" type="button" id="openGithub">${SVG.external} GitHub</button>
        <button class="btn btn-sm btn-ghost" type="button" data-copy="${esc(JAVA_IP)}">${SVG.copy} Java adresi</button>
        <button class="btn btn-sm btn-ghost" type="button" data-copy="${esc(BEDROCK_IP)}">${SVG.copy} Bedrock adresi</button>
      </div>
    </div>

    <div class="card" style="margin-top:14px">
      <div class="card-head"><h3 class="card-title">Oturum</h3><p class="card-note">${state.user ? 'Giriş yapıldı: ' + esc(state.user.username) : 'Giriş yapılmadı.'}</p></div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-sm" type="button" data-goto="account">${SVG.user} ${state.user ? 'Hesabım' : 'Giriş yap'}</button>
        ${state.user ? `<button class="btn btn-sm btn-danger" type="button" id="settingsLogout">${SVG.logout} Oturumu kapat</button>` : ''}
      </div>
    </div>

    <div class="signature">
      <img src="asset/logo.png" alt="">
      <div class="signature-text">
        <em>Severek yapıldı.</em>
        Turbolu Studios · TurboluApp PC
      </div>
    </div>`;

  $$('[data-theme-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.themeChoice);
      toast('Tema güncellendi.', 'success');
    });
  });

  $$('[data-platform-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      state.platform = button.dataset.platformChoice;
      $$('[data-platform-choice]').forEach((element) => {
        element.classList.toggle('is-active', element.dataset.platformChoice === state.platform);
      });
      toast('İçerik filtresi güncellendi.', 'success');
    });
  });

  $('#openSite')?.addEventListener('click', () => window.turbolu.open(info.website || 'https://turboluweb.wasmer.app/'));
  $('#openGithub')?.addEventListener('click', () => window.turbolu.open(info.github || 'https://github.com/ereny116011-cloud/turboluweb'));
  $('#settingsLogout')?.addEventListener('click', async () => {
    await clearSession();
    toast('Oturum kapatıldı.', 'info');
    navigate('overview');
  });
}

/* ------------------------------------------------------------------ */
/* Sayfa: Yönetim                                                      */
/* ------------------------------------------------------------------ */

let adminTab = 'requests';
let adminContentType = 'announcements';
let adminUsers = [];
let adminUserQuery = '';

const ADMIN_CONTENT = {
  announcements: {
    label: 'Duyurular',
    endpoint: '/api/announcements',
    create: '/api/admin/announcement',
    remove: '/api/admin/announcement'
  },
  news: {
    label: 'Haberler',
    endpoint: '/api/news',
    create: '/api/admin/news',
    remove: '/api/admin/news'
  },
  campaigns: {
    label: 'Kampanyalar',
    endpoint: '/api/campaigns',
    create: '/api/admin/campaign',
    remove: '/api/admin/campaign'
  },
  items: {
    label: 'Market ürünleri',
    endpoint: '/api/items',
    create: '/api/admin/item',
    remove: ''
  },
  childgifts: {
    label: 'Çocuk hediyeleri',
    endpoint: '/api/admin/child-gifts',
    create: '/api/admin/child-gift',
    remove: '/api/admin/child-gift'
  }
};

function isAdminUser() {
  return Boolean(state.user && state.user.isAdmin);
}

function adminTabButton(tab, label) {
  return `<button type="button" role="tab" aria-selected="${adminTab === tab}" data-admin="admin-tab" data-tab="${tab}" class="${adminTab === tab ? 'is-active' : ''}">${esc(label)}</button>`;
}

function renderAdmin() {
  if (!isAdminUser()) {
    $('#view').innerHTML = `
      ${pageHead('Yönetim', 'Yetkisiz', 'Bu sayfa yalnızca yönetici hesapları için açıktır.')}
      <div class="empty">
        ${SVG.ban}
        <strong>Yönetici yetkisi gerekli</strong>
        <p>Yönetim araçlarını görmek için yönetici bir hesapla giriş yap.</p>
      </div>`;
    return;
  }

  $('#view').innerHTML = `
    ${pageHead('Yönetim', 'Yönetim', 'Talepleri sonuçlandır, hesapları yönet ve içerik ekle.')}
    <div class="segmented admin-tabs" role="tablist" aria-label="Yönetim bölümleri">
      ${adminTabButton('requests', 'Talepler')}
      ${adminTabButton('users', 'Kullanıcılar')}
      ${adminTabButton('content', 'İçerik')}
    </div>
    <div id="adminBody" style="margin-top:16px"></div>`;

  paintAdminBody();
}

function paintAdminBody() {
  if (adminTab === 'users') { paintAdminUsers(); return; }
  if (adminTab === 'content') { paintAdminContent(); return; }
  paintAdminRequests();
}

/* ---------------- Talepler ---------------- */

async function paintAdminRequests() {
  const host = $('#adminBody');
  if (!host) return;
  host.innerHTML = '<div class="skeleton" style="height:92px"></div><div class="skeleton" style="height:92px;margin-top:10px"></div>';

  const response = await api('/api/admin/requests');
  const target = $('#adminBody');
  if (!target || target !== host) return;

  if (!response.ok || !Array.isArray(response.data)) {
    target.innerHTML = emptyState('Talepler yüklenemedi', apiError(response, 'Talepler şu an görüntülenemiyor.'), true);
    return;
  }

  const list = response.data.slice().sort((a, b) => {
    const aPending = (a.status || 'pending') === 'pending' ? 0 : 1;
    const bPending = (b.status || 'pending') === 'pending' ? 0 : 1;
    if (aPending !== bPending) return aPending - bPending;
    return String(b.date || '').localeCompare(String(a.date || ''));
  });
  const pending = list.filter((entry) => (entry.status || 'pending') === 'pending').length;

  target.innerHTML = `
    <div class="admin-toolbar">
      <span class="card-note">${list.length} talep · <b>${pending}</b> bekliyor</span>
      <button class="btn btn-sm btn-ghost" type="button" data-admin="refresh-requests" style="margin-left:auto">${SVG.refresh} Yenile</button>
    </div>
    ${list.length
      ? `<div class="feed">${list.map(adminRequestCard).join('')}</div>`
      : emptyState('Henüz talep yok', 'Bir kullanıcı marketten ürün aldığında talep burada görünür.')}`;
}

function adminRequestCard(req) {
  const status = String(req.status || 'pending');
  const pending = status === 'pending';
  return `
    <article class="feed-item">
      <div class="admin-item-head">
        <div style="min-width:0">
          <h4>${esc(req.item || 'Ürün')}</h4>
          <p>${esc(req.user || '—')} · ${fmtNumber(req.price)} puan · ${esc(fmtDate(req.date))}</p>
        </div>
        ${statusBadge(status)}
      </div>
      <div class="feed-meta">
        ${platformBadge(req.platform)}
        ${req.command ? `<code class="admin-code">${esc(req.command)}</code>` : ''}
        ${pending ? `<span class="admin-actions">
          <button class="btn btn-sm btn-primary" type="button" data-admin="complete-request" data-id="${esc(req.id)}">${SVG.check} Onayla</button>
          <button class="btn btn-sm btn-danger" type="button" data-admin="reject-request" data-id="${esc(req.id)}">Reddet</button>
        </span>` : ''}
      </div>
    </article>`;
}

/* ---------------- Kullanıcılar ---------------- */

async function paintAdminUsers() {
  const host = $('#adminBody');
  if (!host) return;
  host.innerHTML = '<div class="skeleton" style="height:64px"></div><div class="skeleton" style="height:64px;margin-top:8px"></div>';

  const response = await api('/api/admin/users');
  const target = $('#adminBody');
  if (!target || target !== host) return;

  if (!response.ok || !Array.isArray(response.data)) {
    target.innerHTML = emptyState('Hesaplar yüklenemedi', apiError(response, 'Hesap listesi şu an görüntülenemiyor.'), true);
    return;
  }

  adminUsers = response.data;
  target.innerHTML = `
    <div class="admin-toolbar">
      <label class="admin-search">
        ${SVG.search}
        <input class="input" id="adminUserSearch" type="search" placeholder="Kullanıcı adı veya e-posta ara" value="${esc(adminUserQuery)}">
      </label>
      <span class="card-note">${adminUsers.length} hesap</span>
      <button class="btn btn-sm btn-ghost" type="button" data-admin="refresh-users">${SVG.refresh} Yenile</button>
    </div>
    <div id="adminUserList"></div>`;

  paintAdminUserList();
  $('#adminUserSearch')?.addEventListener('input', (event) => {
    adminUserQuery = event.target.value;
    paintAdminUserList();
  });
}

function paintAdminUserList() {
  const host = $('#adminUserList');
  if (!host) return;
  const query = adminUserQuery.trim().toLowerCase();
  const list = query
    ? adminUsers.filter((user) =>
      String(user.username || '').toLowerCase().includes(query) ||
      String(user.email || '').toLowerCase().includes(query))
    : adminUsers;

  if (!list.length) {
    host.innerHTML = emptyState('Eşleşen hesap yok', 'Arama ifadesini değiştirip tekrar dene.');
    return;
  }
  host.innerHTML = list.map(adminUserRow).join('');
}

function adminUserRow(user) {
  const icon = safeImageSrc(user.icon);
  const badges = [
    user.isAdmin ? '<span class="badge badge-green">Yönetici</span>' : '',
    user.banned ? '<span class="badge badge-red">Yasaklı</span>' : ''
  ].filter(Boolean).join(' ');
  const banNote = user.banned
    ? `<small class="admin-note">${user.banType === 'permanent' ? 'Kalıcı yasak' : 'Yasak bitişi: ' + esc(fmtDate(user.banUntil))}${user.banReason ? ' · ' + esc(user.banReason) : ''}</small>`
    : '';

  const actions = user.isAdmin
    ? '<span class="badge">Korunan hesap</span>'
    : `
      ${user.banned
        ? `<button class="btn btn-sm" type="button" data-admin="unban" data-user="${esc(user.username)}">Yasağı kaldır</button>`
        : `<button class="btn btn-sm btn-danger" type="button" data-admin="ban" data-user="${esc(user.username)}">${SVG.ban} Yasakla</button>`}
      <button class="btn btn-sm btn-ghost" type="button" data-admin="delete-user" data-user="${esc(user.username)}">${SVG.trash} Sil</button>`;

  return `
    <div class="user-row">
      <div class="user-avatar">${icon ? `<img src="${esc(icon)}" alt="" referrerpolicy="no-referrer">` : esc(initial(user.username))}</div>
      <div class="user-main">
        <strong>${esc(user.username)} ${badges}</strong>
        <small>${esc(user.email || 'e-posta yok')} · ${fmtNumber(user.balance)} puan${user.lastLogin ? ' · son giriş ' + esc(fmtDate(user.lastLogin, true)) : ''}</small>
        ${banNote}
      </div>
      <div class="user-actions">${actions}</div>
    </div>`;
}

function banDialog(username) {
  return new Promise((resolve) => {
    const root = $('#modalRoot');
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="banTitle">
        <h3 id="banTitle">Hesabı yasakla</h3>
        <p><b>${esc(username)}</b> için yasak türünü ve sebebini belirle.</p>
        <div class="field">
          <label for="banType">Tür</label>
          <select class="input" id="banType">
            <option value="temporary">Süreli</option>
            <option value="permanent">Kalıcı</option>
          </select>
        </div>
        <div class="field" id="banHoursField">
          <label for="banHours">Süre (saat)</label>
          <input class="input" id="banHours" type="number" min="1" max="87600" step="1" value="24">
        </div>
        <div class="field">
          <label for="banReason">Sebep (isteğe bağlı)</label>
          <input class="input" id="banReason" maxlength="300" placeholder="Örn. küfür, spam">
        </div>
        <p class="form-error" id="banError"></p>
        <div class="modal-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-ban="cancel">Vazgeç</button>
          <button class="btn btn-danger btn-sm" type="button" data-ban="ok">${SVG.ban} Yasakla</button>
        </div>
      </div>`;

    const finish = (value) => {
      document.removeEventListener('keydown', onKey);
      backdrop.remove();
      resolve(value);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') finish(null);
    };

    const type = $('#banType', backdrop);
    const hoursField = $('#banHoursField', backdrop);
    type.addEventListener('change', () => {
      hoursField.style.display = type.value === 'permanent' ? 'none' : '';
    });

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) { finish(null); return; }
      const action = event.target.closest('[data-ban]');
      if (!action) return;
      if (action.dataset.ban === 'cancel') { finish(null); return; }

      const hours = Number($('#banHours', backdrop).value);
      if (type.value === 'temporary' && (!Number.isFinite(hours) || hours <= 0)) {
        $('#banError', backdrop).textContent = 'Geçerli bir süre gir.';
        return;
      }
      finish({
        type: type.value,
        durationHours: hours,
        reason: $('#banReason', backdrop).value.trim()
      });
    });

    document.addEventListener('keydown', onKey);
    root.appendChild(backdrop);
    type.focus();
  });
}

/* ---------------- İçerik ---------------- */

function paintAdminContent() {
  const host = $('#adminBody');
  if (!host) return;

  const tabs = Object.entries(ADMIN_CONTENT).map(([key, meta]) =>
    `<button type="button" role="tab" aria-selected="${adminContentType === key}" data-admin="content-tab" data-type="${key}" class="${adminContentType === key ? 'is-active' : ''}">${esc(meta.label)}</button>`
  ).join('');

  host.innerHTML = `
    <div class="segmented admin-tabs admin-tabs-sub" role="tablist" aria-label="İçerik türleri">${tabs}</div>
    <div class="admin-content-grid">
      <div>${adminContentForm(adminContentType)}</div>
      <div id="adminContentList" class="feed">
        <div class="skeleton" style="height:92px"></div>
        <div class="skeleton" style="height:92px"></div>
      </div>
    </div>`;

  paintAdminContentList();
}

function adminContentForm(type) {
  const meta = ADMIN_CONTENT[type];
  let fields = '';

  if (type === 'announcements' || type === 'news') {
    fields = `
      <div class="field"><label for="contentTitle">Başlık</label><input class="input" id="contentTitle" name="title" required maxlength="120"></div>
      <div class="field"><label for="contentBody">İçerik</label><textarea class="input" id="contentBody" name="content" rows="6" required></textarea></div>`;
  } else if (type === 'campaigns') {
    fields = `
      <div class="field"><label for="contentTitle">Başlık</label><input class="input" id="contentTitle" name="title" required maxlength="120"></div>
      <div class="field"><label for="contentBody">Açıklama</label><textarea class="input" id="contentBody" name="description" rows="4" required></textarea></div>
      <div class="field"><label for="contentReward">Ödül</label><input class="input" id="contentReward" name="reward" maxlength="80" placeholder="Örn. 500 puan"></div>
      <div class="field"><label for="contentEnd">Bitiş tarihi</label><input class="input" id="contentEnd" name="endDate" type="date"></div>`;
  } else if (type === 'childgifts') {
    fields = `
      <div class="field"><label for="contentTitle">Başlık</label><input class="input" id="contentTitle" name="title" required maxlength="120" placeholder="Ücretsiz elmas kılıç"></div>
      <div class="field"><label for="contentBody">Açıklama</label><textarea class="input" id="contentBody" name="description" rows="4" required placeholder="Hediyenin detayı..."></textarea></div>
      <div class="field"><label for="contentReward">Ödül</label><input class="input" id="contentReward" name="reward" maxlength="80" placeholder="1 elmas, özel rol..."></div>`;
  } else {
    fields = `
      <div class="field"><label for="contentName">Ürün adı</label><input class="input" id="contentName" name="name" required maxlength="120"></div>
      <div class="field"><label for="contentPrice">Fiyat (puan)</label><input class="input" id="contentPrice" name="price" type="number" min="1" step="1" required></div>
      <div class="field"><label for="contentCommand">Komut</label><input class="input" id="contentCommand" name="command" maxlength="200" placeholder="give {oyuncu} diamond 1"></div>`;
  }

  return `
    <form class="card admin-form" data-admin-form="${type}">
      <div class="card-head"><h3 class="card-title">${esc(meta.label)} · yeni kayıt</h3></div>
      ${fields}
      <div class="field">
        <label for="contentPlatform">Platform</label>
        <select class="input" id="contentPlatform" name="platform">
          <option value="all">İkisi de</option>
          <option value="java">Java</option>
          <option value="bedrock">Bedrock</option>
        </select>
      </div>
      <button class="btn btn-primary btn-block" type="submit">${SVG.plus} Ekle</button>
    </form>`;
}

async function paintAdminContentList() {
  const host = $('#adminContentList');
  if (!host) return;
  const meta = ADMIN_CONTENT[adminContentType];
  const response = await api(meta.endpoint);
  const target = $('#adminContentList');
  if (!target || target !== host) return;

  if (!response.ok || !Array.isArray(response.data)) {
    target.innerHTML = emptyState('İçerik yüklenemedi', apiError(response, 'Liste şu an görüntülenemiyor.'), true);
    return;
  }
  if (!response.data.length) {
    target.innerHTML = emptyState('Henüz içerik yok', 'Soldaki formdan ilk kaydı ekleyebilirsin.');
    return;
  }
  target.innerHTML = response.data.map((entry) => adminContentRow(adminContentType, entry)).join('');
}

function adminContentRow(type, entry) {
  const meta = ADMIN_CONTENT[type];
  const deleteButton = meta.remove
    ? `<button class="btn btn-sm btn-ghost" type="button" data-admin="delete-content" data-type="${esc(type)}" data-id="${esc(entry.id)}">${SVG.trash} Sil</button>`
    : '';

  let title = entry.title;
  let body = entry.content;
  if (type === 'campaigns') body = entry.description;
  if (type === 'items') {
    title = entry.name;
    body = `${fmtNumber(entry.price)} puan${entry.command ? ' · ' + entry.command : ''}`;
  }
  if (type === 'childgifts') {
    body = entry.description;
    // Hediyenin yayın durumu ayrı bir düğmeyle değiştirilir.
  }

  const publishButton = type === 'childgifts'
    ? `<button class="btn btn-sm ${entry.active === false ? 'btn-primary' : 'btn-ghost'}" type="button" data-admin="publish-child-gift" data-id="${esc(entry.id)}" data-active="${entry.active === false ? '1' : '0'}">${entry.active === false ? 'Yayınla' : 'Durdur'}</button>`
    : '';

  return `
    <article class="feed-item">
      <div class="admin-item-head">
        <div style="min-width:0">
          <h4>${esc(title || 'Başlıksız')}</h4>
          <p>${esc(body || '')}</p>
        </div>
        <span class="admin-actions">
          ${publishButton}
          ${deleteButton}
        </span>
      </div>
      <div class="feed-meta">
        ${platformBadge(entry.platform)}
        ${entry.date ? `<span>${esc(fmtDate(entry.date))}</span>` : ''}
        ${entry.endDate ? `<span class="badge">Bitiş: ${esc(fmtDate(entry.endDate, true))}</span>` : ''}
        ${entry.reward ? `<span class="badge badge-green">Ödül: ${esc(entry.reward)}</span>` : ''}
        ${type === 'childgifts' ? `<span class="badge ${entry.active === false ? '' : 'badge-green'}">${entry.active === false ? 'Yayında değil' : 'Yayında'}</span>` : ''}
      </div>
    </article>`;
}

async function submitAdminForm(form) {
  const type = form.dataset.adminForm;
  const meta = ADMIN_CONTENT[type];
  if (!meta) return;

  const values = Object.fromEntries(new FormData(form).entries());
  let body;
  if (type === 'campaigns') {
    body = {
      title: values.title,
      description: values.description,
      reward: values.reward || '',
      endDate: values.endDate || null,
      platform: values.platform
    };
  } else if (type === 'items') {
    body = {
      name: values.name,
      price: Number(values.price) || 0,
      command: values.command || '',
      platform: values.platform
    };
  } else if (type === 'childgifts') {
    body = {
      title: values.title,
      description: values.description,
      reward: values.reward || '',
      platform: values.platform,
      active: true
    };
  } else {
    body = { title: values.title, content: values.content, platform: values.platform };
  }

  const button = form.querySelector('button[type="submit"]');
  if (button) button.disabled = true;
  const response = await api(meta.create, { method: 'POST', body });
  if (button) button.disabled = false;

  if (!response.ok) {
    toast(apiError(response, 'Kayıt eklenemedi.'), 'error');
    return;
  }
  form.reset();
  toast('Kayıt eklendi.', 'success');
  paintAdminContentList();
}

async function deleteAdminContent(type, id) {
  const meta = ADMIN_CONTENT[type];
  if (!meta || !meta.remove) return;
  const approved = await confirmDialog({
    title: 'Kaydı sil',
    message: 'Bu kayıt kalıcı olarak silinsin mi?',
    confirmText: 'Sil',
    danger: true
  });
  if (!approved) return;

  const response = await api(meta.remove, { method: 'DELETE', body: { id } });
  if (!response.ok) {
    toast(apiError(response, 'Kayıt silinemedi.'), 'error');
    return;
  }
  toast('Kayıt silindi.', 'success');
  paintAdminContentList();
}

async function handleAdminAction(action, element) {
  switch (action) {
    case 'admin-tab':
      adminTab = element.dataset.tab;
      renderAdmin();
      break;
    case 'content-tab':
      adminContentType = element.dataset.type;
      paintAdminContent();
      break;
    case 'refresh-requests':
      paintAdminRequests();
      break;
    case 'refresh-users':
      paintAdminUsers();
      break;
    case 'publish-child-gift': {
      const active = element.dataset.active === '1';
      const response = await api('/api/admin/child-gift/publish', {
        method: 'POST',
        body: { id: element.dataset.id, active }
      });
      if (!response.ok) { toast(apiError(response, 'Hediye güncellenemedi.'), 'error'); return; }
      toast(active ? 'Hediye yayınlandı.' : 'Hediye yayından kaldırıldı.', 'success');
      paintAdminContentList();
      break;
    }
    case 'complete-request': {
      const response = await api('/api/admin/complete-request', {
        method: 'POST',
        body: { requestId: element.dataset.id }
      });
      if (!response.ok) { toast(apiError(response, 'Talep tamamlanamadı.'), 'error'); return; }
      toast('Talep tamamlandı.', 'success');
      paintAdminRequests();
      break;
    }
    case 'reject-request': {
      const approved = await confirmDialog({
        title: 'Talebi reddet',
        message: 'Talep reddedilsin mi? Ücret kullanıcıya iade edilir.',
        confirmText: 'Reddet',
        danger: true
      });
      if (!approved) return;
      const response = await api('/api/admin/reject-request', {
        method: 'POST',
        body: { requestId: element.dataset.id }
      });
      if (!response.ok) { toast(apiError(response, 'Talep reddedilemedi.'), 'error'); return; }
      toast('Talep reddedildi, bakiye iade edildi.', 'success');
      paintAdminRequests();
      break;
    }
    case 'ban': {
      const username = element.dataset.user;
      const choice = await banDialog(username);
      if (!choice) return;
      const response = await api('/api/admin/ban-user', {
        method: 'POST',
        body: { username, type: choice.type, durationHours: choice.durationHours, reason: choice.reason }
      });
      if (!response.ok) { toast(apiError(response, 'Hesap yasaklanamadı.'), 'error'); return; }
      toast((response.data && response.data.message) || 'Hesap yasaklandı.', 'success');
      paintAdminUsers();
      break;
    }
    case 'unban': {
      const username = element.dataset.user;
      const approved = await confirmDialog({
        title: 'Yasağı kaldır',
        message: `${username} hesabının yasağı kaldırılsın mı?`,
        confirmText: 'Kaldır'
      });
      if (!approved) return;
      const response = await api('/api/admin/unban-user', { method: 'POST', body: { username } });
      if (!response.ok) { toast(apiError(response, 'Yasak kaldırılamadı.'), 'error'); return; }
      toast('Yasak kaldırıldı.', 'success');
      paintAdminUsers();
      break;
    }
    case 'delete-user': {
      const username = element.dataset.user;
      const approved = await confirmDialog({
        title: 'Hesabı sil',
        message: `${username} hesabı ve tüm bağlantıları kalıcı olarak silinecek. Bu işlem geri alınamaz.`,
        confirmText: 'Kalıcı olarak sil',
        danger: true
      });
      if (!approved) return;
      const response = await api('/api/admin/delete-user', { method: 'POST', body: { username } });
      if (!response.ok) { toast(apiError(response, 'Hesap silinemedi.'), 'error'); return; }
      toast((response.data && response.data.message) || 'Hesap silindi.', 'success');
      paintAdminUsers();
      break;
    }
    case 'delete-content':
      await deleteAdminContent(element.dataset.type, element.dataset.id);
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Boş durum                                                           */
/* ------------------------------------------------------------------ */

function emptyState(title, text, isError) {
  return `
    <div class="empty">
      ${isError ? SVG.alert : SVG.info}
      <strong>${esc(title)}</strong>
      <p>${esc(text)}</p>
      ${isError ? '<button class="btn btn-sm" type="button" id="emptyRetry">Tekrar dene</button>' : ''}
    </div>`;
}

/* ------------------------------------------------------------------ */
/* Olaylar                                                             */
/* ------------------------------------------------------------------ */

function bindGlobalEvents() {
  const view = $('#view');

  view.addEventListener('click', async (event) => {
    const adminAction = event.target.closest('[data-admin]');
    if (adminAction) {
      await handleAdminAction(adminAction.dataset.admin, adminAction);
      return;
    }

    const copyTarget = event.target.closest('[data-copy]');
    if (copyTarget) {
      await window.turbolu.clipboard(copyTarget.dataset.copy);
      toast(`Kopyalandı: ${copyTarget.dataset.copy}`, 'success');
      return;
    }

    const goto = event.target.closest('[data-goto]');
    if (goto) {
      navigate(goto.dataset.goto);
      return;
    }

    const buy = event.target.closest('[data-buy]');
    if (buy) {
      await buyItem(buy.dataset.buy, buy.dataset.name, Number(buy.dataset.price) || 0);
      return;
    }

    if (event.target.closest('#refreshServers')) {
      await refreshServers();
      paintHeroPlayers();
      toast('Sunucu durumu yenilendi.', 'info');
      return;
    }

    if (event.target.closest('#emptyRetry')) {
      navigate(state.page);
    }
  });

  view.addEventListener('keydown', (event) => {
    const copyTarget = event.target.closest('[data-copy]');
    if (copyTarget && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      copyTarget.click();
    }
  });

  view.addEventListener('submit', async (event) => {
    const form = event.target.closest('[data-admin-form]');
    if (!form) return;
    event.preventDefault();
    await submitAdminForm(form);
  });

  $$('.nav-item').forEach((item) => {
    item.addEventListener('click', () => navigate(item.dataset.page));
  });

  $('#accountChipAction')?.addEventListener('click', () => navigate('account'));
  $('#accountChip')?.addEventListener('click', (event) => {
    if (event.target.closest('#accountChipAction')) return;
    navigate('account');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'F5') {
      event.preventDefault();
      navigate(state.page);
    }
  });
}

function bindWindowControls() {
  $('#btnMin')?.addEventListener('click', () => window.turbolu.window.minimize());
  $('#btnMax')?.addEventListener('click', () => window.turbolu.window.toggleMaximize());
  $('#btnClose')?.addEventListener('click', () => window.turbolu.window.close());

  window.turbolu.window.onState((payload) => {
    const button = $('#btnMax');
    if (!button) return;
    if (payload && payload.maximized) {
      button.setAttribute('aria-label', 'Geri yükle');
      button.setAttribute('title', 'Geri yükle');
    } else {
      button.setAttribute('aria-label', 'Büyüt');
      button.setAttribute('title', 'Büyüt');
    }
  });
}

function buildNavIcons() {
  $$('.nav-icon[data-icon]').forEach((span) => {
    const icon = SVG[span.dataset.icon];
    if (icon) span.innerHTML = icon;
  });
}

/* ------------------------------------------------------------------ */
/* Başlangıç                                                           */
/* ------------------------------------------------------------------ */

async function boot() {
  buildNavIcons();
  applyTheme(readTheme());

  try {
    state.info = await window.turbolu.info();
    document.body.dataset.platform = state.info.platform || '';
  } catch (_) {
    state.info = {};
  }

  bindGlobalEvents();
  bindWindowControls();

  try {
    state.token = await window.turbolu.auth.load();
  } catch (_) {
    state.token = '';
  }

  if (state.token) await loadProfile();
  paintAccountChip();
  navigate('overview');
  startServerLoop();

  // İlk açılışta giriş ekranı: oturum yoksa karşılama katmanı görünür.
  // "Misafir olarak devam et" seçeneğiyle kapatılabilir.
  if (!state.user) showWelcome();

  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (state.theme === 'system') applyTheme('system');
    });
  } catch (_) { /* yoksay */ }
}

document.addEventListener('DOMContentLoaded', boot);
