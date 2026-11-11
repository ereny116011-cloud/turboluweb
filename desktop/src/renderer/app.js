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
  ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/></svg>'
};

const state = {
  page: 'overview',
  token: '',
  user: null,
  platform: 'all',
  theme: 'system',
  info: null,
  servers: { java: null, bedrock: null },
  busy: false
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

/* Yalnızca yerel yol, http(s) veya data:image kabul edilir. */
function safeImageSrc(value) {
  const url = String(value == null ? '' : value).trim();
  if (!url) return '';
  if (/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(url)) return url;
  if (/^(https?:)?\/\//i.test(url)) return url;
  if (/^[a-z0-9._\-/]+$/i.test(url)) return url;
  return '';
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
      ? `<img src="${esc(icon)}" alt="">`
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
        <p class="page-kicker">${esc(kicker)}</p>
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
    ? `${greetingForNow()}, ${esc(user.username)}!`
    : `${greetingForNow()}! Turbolu dünyasına hoş geldin.`;
  const balance = user ? `${fmtNumber(user.balance)} puan` : 'Misafir';

  $('#view').innerHTML = `
    ${pageHead('Turbolu Studios', 'Genel Bakış', 'Sunucu durumu, duyurular ve hesabın tek ekranda.')}
    <section class="hero">
      <span class="hero-stamp" aria-hidden="true">El emeği<small>PC sürümü</small></span>
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

    <div class="section-head">
      <h3>Son duyurular</h3>
      <button class="link" type="button" data-goto="announcements">Tümünü gör</button>
    </div>
    <div id="overviewFeed" class="feed"><div class="skeleton" style="height:86px"></div><div class="skeleton" style="height:86px"></div></div>`;

  paintServerGrid();
  paintHeroPlayers();
  loadOverviewFeed();
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
        <p class="item-price"><b>${fmtNumber(price)}</b> puan</p>
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
/* Sayfa: Hesabım                                                      */
/* ------------------------------------------------------------------ */

function authCard() {
  return `
    <div class="auth-shell">
      <div class="card auth-card">
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

    state.token = response.data.token;
    await window.turbolu.auth.save(state.token);
    await loadProfile();
    if (!state.user) {
      // Profil isteği aksasa bile giriş başarılı; temel bilgilerle devam et.
      state.user = {
        username: response.data.username || username,
        balance: Number(response.data.balance) || 0,
        isAdmin: Boolean(response.data.isAdmin)
      };
    }
    paintAccountChip();
    toast(`Hoş geldin, ${response.data.username || username}!`, 'success');
    renderAccount();
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

    state.token = response.data.token;
    await window.turbolu.auth.save(state.token);
    await loadProfile();
    paintAccountChip();
    toast('Hesabın hazır. Hoş geldin!', 'success');
    renderAccount();
  });
}

function profileView(user) {
  const icon = safeImageSrc(user.icon);
  return `
    <div class="card">
      <div class="profile-head">
        <div class="profile-avatar">${icon ? `<img src="${esc(icon)}" alt="">` : esc(initial(user.username))}</div>
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
      <div style="display:flex;gap:9px;margin-top:20px;flex-wrap:wrap">
        <button class="btn btn-sm" type="button" id="refreshAccount">${SVG.refresh} Yenile</button>
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
      <div class="user-avatar">${icon ? `<img src="${esc(icon)}" alt="">` : esc(initial(user.username))}</div>
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

  return `
    <article class="feed-item">
      <div class="admin-item-head">
        <div style="min-width:0">
          <h4>${esc(title || 'Başlıksız')}</h4>
          <p>${esc(body || '')}</p>
        </div>
        ${deleteButton}
      </div>
      <div class="feed-meta">
        ${platformBadge(entry.platform)}
        ${entry.date ? `<span>${esc(fmtDate(entry.date))}</span>` : ''}
        ${entry.endDate ? `<span class="badge">Bitiş: ${esc(fmtDate(entry.endDate, true))}</span>` : ''}
        ${entry.reward ? `<span class="badge badge-green">Ödül: ${esc(entry.reward)}</span>` : ''}
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

  try {
    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
      if (state.theme === 'system') applyTheme('system');
    });
  } catch (_) { /* yoksay */ }
}

document.addEventListener('DOMContentLoaded', boot);
