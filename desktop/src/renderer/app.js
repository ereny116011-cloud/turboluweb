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
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>'
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

function paintAccountChip() {
  const user = state.user;
  const avatar = $('#accountChipAvatar');
  const nameEl = $('#accountChipName');
  const metaEl = $('#accountChipMeta');
  const action = $('#accountChipAction');
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
  settings: { title: 'Ayarlar', render: renderSettings }
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
