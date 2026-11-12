const API = 'https://shrill-salad-a498.ereny116011.workers.dev';

// ========== GÜVENLİK: HTML KAÇIŞI ==========
// API'den gelen metinler (duyuru başlığı, ürün adı, kullanıcı adı, kampanya
// açıklaması...) innerHTML'e basılmadan önce buradan geçirilir. Aksi hâlde
// içeriğe HTML/script gömülebilir ve sayfayı açan herkese çalışır (XSS).
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// HTML niteliği içinde onclick="fn('...')" yazarken kullanılır. Kaçış tek
// başına yetmez: tarayıcı &#39; gibi varlıkları JS çalışmadan önce çözer.
// Bu yüzden id'yi yalnızca güvenli karakterlere indirgiyoruz.
function safeId(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[^a-zA-Z0-9_-]/g, '');
}
// Avatar adresi: sadece yerel yol veya http(s)/data:image kabul et.
function safeImageSrc(value) {
  const v = String(value || '').trim();
  if (!v) return DEFAULT_AVATAR;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v)) return v;
  if (/^(https?:\/\/|\/|\.{0,2}\/)/i.test(v)) return v;
  return DEFAULT_AVATAR;
}
const VAPID_PUBLIC_KEY = 'BD3kAyCW2OpZmM7SzNSEeANMtFNDXUiFP3ZDpgOfeRv78S3Igz4qOxZZubXBo1kXaj_9Q53lwKghx0PIIsRsaXk';
const DEFAULT_AVATAR = 'crpr.png';

const translations = {
  tr: { shop: 'Market', campaigns: 'Kampanyalar', announcements: 'Duyurular',
    news: 'Haberler', inventory: 'Taleplerim', profile: 'Profil',
    logout: 'Çıkış', register: 'Kaydol', login: 'Giriş Yap',
    requests: 'Talepler', addAnnouncement: 'Duyuru Ekle', manageAnnouncements: 'Duyuru Yönet',
    addCampaign: 'Kampanya Ekle', manageCampaigns: 'Kampanya Yönet',
    addNews: 'Haber Ekle', manageNews: 'Haber Yönet', addItem: 'Ürün Ekle' },
  en: { shop: 'Shop', campaigns: 'Campaigns', announcements: 'Announcements',
    news: 'News', inventory: 'My Requests', profile: 'Profile',
    logout: 'Logout', register: 'Register', login: 'Login',
    requests: 'Requests', addAnnouncement: 'Add Announcement', manageAnnouncements: 'Manage Announcements',
    addCampaign: 'Add Campaign', manageCampaigns: 'Manage Campaigns',
    addNews: 'Add News', manageNews: 'Manage News', addItem: 'Add Item' }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let statusInterval = null;
let aktifBolum = 'status';
let notificationPreferences;
try {
  const kayitliTercihler = JSON.parse(localStorage.getItem('notifyPrefs') || 'null');
  notificationPreferences = Object.assign(
    { announcements: true, news: true, campaigns: true, items: true },
    kayitliTercihler && typeof kayitliTercihler === 'object' ? kayitliTercihler : {}
  );
} catch (e) {
  notificationPreferences = { announcements: true, news: true, campaigns: true, items: true };
}

function t(key) { return (translations[currentLang] && translations[currentLang][key]) || key; }

// Global fonksiyonlar
window.showContent = showContent;
window.kopyalaIP = kopyalaIP;
window.buy = buy;
window.completeRequest = completeRequest;
window.rejectRequest = rejectRequest;
window.deleteAnnouncement = deleteAnnouncement;
window.deleteNews = deleteNews;
window.deleteCampaign = deleteCampaign;
window.openAuthModal = openAuthModal;
window.openForgotPasswordModal = openForgotPasswordModal;
window.logout = logout;
window.requestNotificationPermission = requestNotificationPermission;
window.toggleTheme = toggleTheme;
window.submitAdmin = submitAdmin;

// ========== TEMA: Koyu / Açık / Duvar kağıdı ==========
const TEMA_MODLAR = ['dark', 'light'];
const TEMA_ETIKET = { dark: 'Koyu', light: 'Açık' };
const TEMA_IKON = { dark: 'fa-moon', light: 'fa-sun' };

function aktifTema() {
  const root = document.documentElement;
  if (root.classList.contains('light')) return 'light';
  return 'dark';
}

function temaUygula(mod) {
  const root = document.documentElement;
  root.classList.remove('light', 'wallpaper');
  if (mod === 'light') root.classList.add('light');
  localStorage.setItem('theme', mod);
  updateThemeIcon();
}

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  let mod = 'light';
  if (saved === 'light' || saved === 'dark') mod = saved;
  const root = document.documentElement;
  root.classList.remove('light', 'wallpaper');
  if (mod === 'light') root.classList.add('light');
  updateThemeIcon();
}

function toggleTheme() {
  const i = TEMA_MODLAR.indexOf(aktifTema());
  temaUygula(TEMA_MODLAR[(i + 1) % TEMA_MODLAR.length]);
}

function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  const mod = aktifTema();
  btn.innerHTML = '<i class="fa-solid ' + TEMA_IKON[mod] + '"></i>';
  btn.title = 'Tema: ' + TEMA_ETIKET[mod] + ' (değiştirmek için tıkla)';
  btn.setAttribute('aria-label', btn.title);
}

// ========== MOUSE BUHAR İZİ (KÜÇÜK) ==========
const MAX_PARTICLES = 70;
const MAX_PARTICLES_POOL = 90;
let steamParticles = [];
let steamCanvas, steamCtx;
let steamRAF = null;
let steamLastTime = 0;
let steamLastMouseTime = 0;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!steamCtx) return;
  resizeSteamCanvas();

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - steamLastMouseTime < 16) return;
    steamLastMouseTime = now;

    if (steamParticles.length >= MAX_PARTICLES_POOL) steamParticles.shift();
    steamParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 10,
      y: e.clientY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 0.5,
      size: 6 + Math.random() * 10,
      life: 1.0,
      decay: 0.022 + Math.random() * 0.014
    });
    if (steamParticles.length > MAX_PARTICLES) {
      steamParticles.splice(0, steamParticles.length - MAX_PARTICLES);
    }
    startSteamLoop();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (steamRAF) { cancelAnimationFrame(steamRAF); steamRAF = null; }
    } else if (steamParticles.length > 0) {
      startSteamLoop();
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeSteamCanvas, 150);
  }, { passive: true });
}

function startSteamLoop() {
  if (steamRAF || document.hidden) return;
  steamLastTime = performance.now();
  steamRAF = requestAnimationFrame(animateSteam);
}

function resizeSteamCanvas() {
  if (!steamCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  steamCanvas.width = window.innerWidth * dpr;
  steamCanvas.height = window.innerHeight * dpr;
  steamCanvas.style.width = window.innerWidth + 'px';
  steamCanvas.style.height = window.innerHeight + 'px';
  steamCtx.setTransform(1, 0, 0, 1, 0, 0);
  steamCtx.scale(dpr, dpr);
}

function animateSteam(now) {
  if (!steamCtx) { steamRAF = null; return; }
  const dt = Math.min((now - steamLastTime) / 16.67, 3);
  steamLastTime = now;

  const w = window.innerWidth;
  const h = window.innerHeight;
  steamCtx.clearRect(0, 0, w, h);

  const isLight = document.documentElement.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.size += 0.7 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }

    const alpha = p.life * 0.32;
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${color}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }

  if (steamParticles.length === 0) { steamRAF = null; return; }
  steamRAF = requestAnimationFrame(animateSteam);
}

// ========== ARKA PLAN SERBEST BUHAR ==========
let bgSteamCanvas, bgSteamCtx;
let bgParticles = [];
let bgRAF = null;
let bgLastTime = 0;
let bgEmitAccumulator = 0;
const BG_MAX = 46;
const BG_EMIT_INTERVAL = 260;
const BG_TARGET_FPS = 30;

function initBgSteam() {
  bgSteamCanvas = document.getElementById('bgSteamCanvas');
  if (!bgSteamCanvas) return;
  bgSteamCtx = bgSteamCanvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!bgSteamCtx) return;
  resizeBgSteamCanvas();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeBgSteamCanvas, 200);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (bgRAF) { cancelAnimationFrame(bgRAF); bgRAF = null; }
    } else if (!bgRAF) {
      startBgLoop();
    }
  });

  /* Açılışta ekran boş görünmesin: bulutları ömürlerinin farklı
     evrelerinden başlat, böylece her yere dağılmış hâlde belirsinler. */
  for (let i = 0; i < BG_MAX; i++) {
    emitBgParticle();
    bgParticles[bgParticles.length - 1].life = Math.random();
  }

  startBgLoop();
}

function startBgLoop() {
  if (bgRAF || document.hidden) return;
  bgLastTime = performance.now();
  bgRAF = requestAnimationFrame(animateBgSteam);
}

function resizeBgSteamCanvas() {
  if (!bgSteamCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  bgSteamCanvas.width = window.innerWidth * dpr;
  bgSteamCanvas.height = window.innerHeight * dpr;
  bgSteamCanvas.style.width = window.innerWidth + 'px';
  bgSteamCanvas.style.height = window.innerHeight + 'px';
  bgSteamCtx.setTransform(1, 0, 0, 1, 0, 0);
  bgSteamCtx.scale(dpr, dpr);
}

/* Bulutlar artık sadece ekranın alt şeridinde birikmiyor; tüm alana
   dağılıyorlar. Ani belirmeyi önlemek için ömürlerinin başında ve
   sonunda saydamlaşıyorlar (aşağıdaki fade hesabı). */
function emitBgParticle() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  bgParticles.push({
    x: Math.random() * w,
    y: h * (0.02 + Math.random() * 1.06),
    vx: (Math.random() - 0.5) * 0.22,
    vy: -0.18 - Math.random() * 0.30,
    size: 34 + Math.random() * 58,
    life: 1.0,
    decay: 0.0016 + Math.random() * 0.0018,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.004 + Math.random() * 0.008
  });
}

function animateBgSteam(now) {
  if (!bgSteamCtx) { bgRAF = null; return; }
  const elapsed = now - bgLastTime;
  if (elapsed < 1000 / BG_TARGET_FPS) {
    bgRAF = requestAnimationFrame(animateBgSteam);
    return;
  }
  const dt = Math.min(elapsed / 16.67, 4);
  bgLastTime = now;

  bgEmitAccumulator += elapsed;
  while (bgEmitAccumulator > BG_EMIT_INTERVAL) {
    bgEmitAccumulator -= BG_EMIT_INTERVAL;
    if (bgParticles.length < BG_MAX) emitBgParticle();
  }

  const w = window.innerWidth;
  const h = window.innerHeight;
  bgSteamCtx.clearRect(0, 0, w, h);

  const isLight = document.documentElement.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = bgParticles.length - 1; i >= 0; i--) {
    const p = bgParticles[i];
    p.wobble += p.wobbleSpeed * dt;
    p.x += (p.vx + Math.sin(p.wobble) * 0.3) * dt;
    p.y += p.vy * dt;
    p.size += 0.25 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0 || p.y + p.size < -50) { bgParticles.splice(i, 1); continue; }

    /* 0 → 1 → 0: doğarken yumuşakça belirir, ölürken yumuşakça kaybolur */
    const fade = Math.sin(Math.PI * Math.min(Math.max(1 - p.life, 0), 1));
    const alpha = fade * 0.30;
    const gradient = bgSteamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.4, `rgba(${color}, ${alpha * 0.55})`);
    gradient.addColorStop(0.75, `rgba(${color}, ${alpha * 0.18})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    bgSteamCtx.fillStyle = gradient;
    bgSteamCtx.beginPath();
    bgSteamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    bgSteamCtx.fill();
  }

  bgRAF = requestAnimationFrame(animateBgSteam);
}

// ========== IP ==========
async function kopyalaIP() {
  try {
    await navigator.clipboard.writeText('turbolumc.aternos.me');
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = 'turbolumc.aternos.me';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const altInfo = document.getElementById('alt-ip-info');
  if (altInfo) {
    altInfo.innerHTML = `
      <p style="margin-top: 12px; font-size: 0.9rem; opacity: 0.9;">
        <i class="fa-solid fa-circle-check"></i> IP Kopyalandı!<br>
        <i class="fa-solid fa-triangle-exclamation"></i> Giremediyseniz alternatif IP: <strong style="color: var(--accent);">turbolu.aternos.me:13795</strong><br>
        <i class="fa-solid fa-circle-question"></i> Bağlantı sorunu yaşarsanız admin ile iletişime geçiniz.
      </p>`;
  }
}

// ========== BİLDİRİM ==========
async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Tarayıcınız bildirimleri desteklemiyor.'); return null;
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') { alert('Bildirim izni verilmedi.'); return null; }
  const registration = await navigator.serviceWorker.register('/mc/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  const subData = subscription.toJSON();
  await fetch(`${API}/api/notification/subscribe`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subData, preferences: notificationPreferences, isAdmin: currentUser?.isAdmin || false })
  });
  return subscription;
}
async function requestNotificationPermission() {
  if (!token) return alert('Önce giriş yapmalısınız.');
  const result = await subscribeToPush();
  if (result) { localStorage.setItem('notificationsEnabled', 'true'); alert('Bildirimler aktif edildi!'); }
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSteam();
  initBgSteam();

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('/mc/sw.js'); } catch (e) {}
  }

  // Profil önce yüklenir: içerik (çocuk hediyeleri, kurulum uyarısı) doğru
  // bilgiyle çizilsin.
  if (token) {
    try {
      const res = await fetch(`${API}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      currentUser = data;
    } catch (e) { logout(); }
  }

  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) setLang(tr ? 'tr' : 'en'); else setLang(currentLang);
  } catch { setLang(currentLang); }

  renderUI();
  if (currentUser && currentUser.setupCompleted === false) hesapKurulumAc(currentUser);

  // Kurulum penceresi kapanınca profil bilgileri tazelenir; hediyeler ve
  // profil alanları güncel veriyle çizilsin.
  window.addEventListener('turbolu:setup-complete', async () => {
    await profilYenile();
    renderUI();
    showContent(aktifBolum || 'status');
  });
});

// ========== HESAP KURULUMU ==========
// Minecraft kullanıcı adları ve doğum tarihi. Ortak bileşen site-account.js
// içindedir; burada yalnızca doğru zaman tetiklenir.
function bugunTarih() {
  const simdi = new Date();
  const ay = String(simdi.getMonth() + 1).padStart(2, '0');
  const gun = String(simdi.getDate()).padStart(2, '0');
  return `${simdi.getFullYear()}-${ay}-${gun}`;
}

function hesapKurulumAc(profil) {
  if (!profil) return;
  try {
    if (localStorage.getItem('turboluSetupSkipped') === String(profil.username || '')) return;
  } catch (e) { /* yoksay */ }
  if (window.TurboluSetup && typeof window.TurboluSetup.open === 'function') {
    window.TurboluSetup.open(profil);
  }
}

// Profil bilgilerini sunucudan yeniler (yaş, Minecraft adları, kurulum durumu).
async function profilYenile() {
  if (!token) return null;
  try {
    const res = await fetch(`${API}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.error) return null;
    currentUser = data;
    return currentUser;
  } catch (e) { return null; }
}

// ========== UI ==========
function renderUI() {
  const userArea = document.getElementById('userArea');
  const navLinks = document.getElementById('navLinks');
  const content = document.getElementById('content');

  let buttons = '';
  if (currentUser) {
    if (currentUser.isAdmin) {
      buttons = `
        <button onclick="showContent('requests')"><i class="fa-solid fa-clipboard-list"></i> Talepler</button>
        <button onclick="showContent('addAnnouncement')"><i class="fa-solid fa-bullhorn"></i> Duyuru</button>
        <button onclick="showContent('manageAnnouncements')"><i class="fa-solid fa-clipboard-list"></i> Duyuru Yönet</button>
        <button onclick="showContent('addCampaign')"><i class="fa-solid fa-bullseye"></i> Kampanya</button>
        <button onclick="showContent('manageCampaigns')"><i class="fa-solid fa-chart-simple"></i> Kampanya Yönet</button>
        <button onclick="showContent('addNews')"><i class="fa-solid fa-newspaper"></i> Haber</button>
        <button onclick="showContent('manageNews')"><i class="fa-solid fa-clipboard-list"></i> Haber Yönet</button>
        <button onclick="showContent('addItem')"><i class="fa-solid fa-cart-shopping"></i> Ürün Ekle</button>
      `;
    } else {
      buttons = `
        <button onclick="showContent('shop')"><i class="fa-solid fa-cart-shopping"></i> Market</button>
        <button onclick="showContent('inventory')"><i class="fa-solid fa-box"></i> Taleplerim</button>
        <button onclick="showContent('campaigns')"><i class="fa-solid fa-tags"></i> Kampanyalar</button>
        <button onclick="showContent('announcements')"><i class="fa-solid fa-bullhorn"></i> Duyurular</button>
        <button onclick="showContent('news')"><i class="fa-solid fa-newspaper"></i> Haberler</button>
      `;
    }
    if (navLinks) navLinks.innerHTML = buttons;
    if (userArea) userArea.innerHTML = `
      <button onclick="requestNotificationPermission()" title="Bildirim"><i class="fa-solid fa-bell"></i></button>
      <img src="${esc(safeImageSrc(currentUser.icon))}" class="profile-icon" onclick="showContent('profile')" title="Profil" loading="lazy" alt="">
      <span class="username-label">${esc(currentUser.username)}</span>
      <button class="logout-btn" onclick="logout()">Çıkış</button>
    `;
  } else {
    if (navLinks) navLinks.innerHTML = '';
    if (userArea) userArea.innerHTML = `
      <button class="btn-green" onclick="openAuthModal('register')">Kaydol</button>
      <button onclick="openAuthModal('login')">Giriş Yap</button>
    `;
  }
  if (content && !content.innerHTML.trim()) showContent('status');
}

function showContent(section) {
  const content = document.getElementById('content');
  if (!content) return;
  aktifBolum = section;
  content.classList.remove('page-enter');
  void content.offsetWidth;
  content.classList.add('page-enter');

  if (section !== 'status' && statusInterval) { clearInterval(statusInterval); statusInterval = null; }

  switch (section) {
    case 'status': renderStatus(); break;
    case 'shop': renderShop(); break;
    case 'campaigns': renderCampaigns(); break;
    case 'announcements': renderAnnouncements(); break;
    case 'news': renderNews(); break;
    case 'manageCampaigns': renderManageCampaigns(); break;
    case 'manageAnnouncements': renderManageAnnouncements(); break;
    case 'manageNews': renderManageNews(); break;
    case 'addAnnouncement': renderAdminForm('announcement'); break;
    case 'addCampaign': renderAdminForm('campaign'); break;
    case 'addNews': renderAdminForm('news'); break;
    case 'addItem': renderAdminForm('item'); break;
    case 'requests': renderRequests(); break;
    case 'inventory': renderInventory(); break;
    case 'profile': renderProfile(); break;
    default: renderStatus();
  }
}

// ========== SAYFALAR ==========
async function renderStatus() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="hero-card">
      <div class="hero-text">
        <h1>TurboluMC Dünyasına Hoş Geldiniz!</h1>
        <p class="hero-sub">Kesintisiz macera, harika topluluk ve eğlence dolu anlar seni bekliyor.</p>
        <div class="ip-box" onclick="kopyalaIP()">
          <span>turbolumc.aternos.me</span>
          <button class="copy-btn"><i class="fa-regular fa-copy"></i> Kopyala</button>
        </div>
        <p class="click-info">IP adresine tıklayarak kopyalayabilirsin!</p>
        <div id="alt-ip-info"></div>
      </div>
    </div>
    <div class="glass-card" id="features">
      <h2>Neden Biz?</h2>
      <div class="features-grid">
        <div class="feature-item"><i class="fa-solid fa-bolt"></i><h3>Yüksek Performans</h3><p>Donma ve lag olmadan akıcı oyun.</p></div>
        <div class="feature-item"><i class="fa-solid fa-shield-halved"></i><h3>Adil Oyun</h3><p>Hileye sıfır tolerans.</p></div>
        <div class="feature-item"><i class="fa-solid fa-users"></i><h3>Harika Topluluk</h3><p>Aktif yönetim ve dost oyuncular.</p></div>
      </div>
    </div>
    <div class="glass-card" id="durum">
      <h2>Anlık Sunucu Durumu</h2>
      <div class="status-info" >
        <p><strong>Durum:</strong> <span id="online-durum"><i class="fa-solid fa-circle-notch fa-spin"></i> Kontrol ediliyor...</span></p>
        <p><strong>Çevrimiçi Oyuncular:</strong> <span id="oyuncu-sayisi">- / -</span></p>
        <p><strong>Sürüm:</strong> <span id="sunucu-surum">-</span></p>
      </div>
    </div>
    ${currentUser && currentUser.isChild ? `
    <div class="glass-card" id="cocuk-hediyeleri">
      <h2><i class="fa-solid fa-gift"></i> Sana Özel Hediyeler</h2>
      <div id="cocukHediyeListesi"><p class="empty-note">Hediyeler yükleniyor...</p></div>
    </div>` : ''}
    <div class="footer">
      <p>&copy; 2026 Eren Yılmaz - TurboluMC. Tüm Hakları Saklıdır.</p>
      <p class="license-text">Bu proje GNU General Public License v3.0 ile korunmaktadır.</p>
    </div>
  `;
  async function updateStatus() {
    const durumEl = document.getElementById('online-durum');
    const oyuncuEl = document.getElementById('oyuncu-sayisi');
    const surumEl = document.getElementById('sunucu-surum');
    if (!durumEl) return;

    let timeoutId;
    try {
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me', { signal: controller.signal });
      if (!res.ok) throw new Error('Sunucu durumu alınamadı');
      const data = await res.json();
      if (typeof data.online !== 'boolean') throw new Error('Sunucu durumu geçersiz');
      durumEl.innerHTML = data.online
        ? '<span style="color:#22c55e"><i class="fa-solid fa-circle" aria-hidden="true"></i> Çevrimiçi</span>'
        : '<span style="color:#ef4444"><i class="fa-solid fa-circle" aria-hidden="true"></i> Çevrimdışı</span>';
      if (oyuncuEl) oyuncuEl.textContent = data.online
        ? `${data.players?.online ?? 0} / ${data.players?.max ?? '—'}`
        : '— / —';
      if (surumEl) surumEl.textContent = data.online ? (data.version || '—') : '—';
    } catch (e) {
      durumEl.textContent = 'Durum bilgisi şu an alınamıyor';
      if (oyuncuEl) oyuncuEl.textContent = '— / —';
      if (surumEl) surumEl.textContent = '—';
    } finally {
      clearTimeout(timeoutId);
    }
  }
  updateStatus();
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(updateStatus, 15000);
  cocukHediyeleriYukle();
}

// Çocuk hesaplarına özel hediyeler.
async function cocukHediyeleriYukle() {
  const host = document.getElementById('cocukHediyeListesi');
  if (!host) return;
  try {
    const res = await fetch(`${API}/api/child-gifts?platform=java`);
    const gifts = await res.json();
    const hedef = document.getElementById('cocukHediyeListesi');
    if (!hedef) return;
    if (!Array.isArray(gifts) || gifts.length === 0) {
      hedef.innerHTML = '<p class="empty-note">Şimdilik yeni bir hediye yok. Seni bekleyen sürprizler olabilir!</p>';
      return;
    }
    hedef.innerHTML = gifts.map(g => `
      <div class="cocuk-hediye">
        <i class="fa-solid fa-gift" aria-hidden="true"></i>
        <div>
          <b>${esc(g.title)}</b>
          <p>${esc(g.description)}</p>
          ${g.reward ? `<span class="hediye-odul"><i class="fa-solid fa-star" aria-hidden="true"></i> ${esc(g.reward)}</span>` : ''}
        </div>
      </div>`).join('');
  } catch (e) {
    const hedef = document.getElementById('cocukHediyeListesi');
    if (hedef) hedef.innerHTML = '<p class="empty-note">Hediyeler şu an görüntülenemiyor.</p>';
  }
}

async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-cart-shopping"></i> Market</h2>${currentUser ? `<p>Bakiye: <strong>${esc(currentUser.balance)}</strong> puan</p>` : ''}${items.length ? items.map(i => `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface-soft); border-radius:10px; margin:8px 0; border:1px solid var(--glass-border);"><div><b>${esc(i.name)}</b><p style="font-size:0.85rem; opacity:0.7;">${esc(i.price)} puan</p></div><button onclick="buy('${safeId(i.id)}')">Satın Al</button></div>`).join('') : '<p class="empty-note">Market şu an biraz sakin. Yeni ürünler eklendiğinde burada görebilirsin.</p>'}</div>`;
}
async function buy(itemId) {
  if (!token) return alert('Lütfen giriş yapın.');
  const res = await fetch(`${API}/api/buy`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
  const data = await res.json();
  if (data.error) alert(data.error);
  else { alert('Talep alındı!'); currentUser.balance = data.new_balance; renderShop(); }
}

async function renderInventory() {
  const content = document.getElementById('content');
  if (!currentUser) return;
  const requests = await fetch(`${API}/api/inventory`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-box"></i> Taleplerim</h2>${requests.length === 0 ? '<p class="empty-note">Henüz bir isteğin yok. Marketten beğendiğin bir şeyi seçince burada takip edebilirsin.</p>' : requests.map(r => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; border:1px solid var(--glass-border);"><div><b>${esc(r.item)}</b> (${esc(r.price)} puan)<br><small>${esc(new Date(r.date).toLocaleString())}</small></div><span style="padding:4px 12px; border-radius:20px; font-size:0.85rem; background:${r.status==='completed'?'#22c55e':r.status==='rejected'?'#ef4444':'#eab308'}; color:white;">${esc(r.status)}</span></div>`).join('')}</div>`;
}

async function renderRequests() {
  if (!currentUser?.isAdmin) return;
  const requests = await fetch(`${API}/api/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  const content = document.getElementById('content');
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-clipboard-list"></i> Talepler</h2>${requests.length===0?'<p class="empty-note">Şimdilik bekleyen bir talep yok. Yeni istekler gelince burada görünecek.</p>':requests.map(r=>`<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;"><div><b>${esc(r.user)}</b> <i class="fa-solid fa-arrow-right"></i> ${esc(r.item)} (${esc(r.price)} puan)<br><small>${esc(new Date(r.date).toLocaleString())}</small></div><div style="display:flex; gap:6px;">${r.status==='pending'?`<button onclick="completeRequest('${safeId(r.id)}')"><i class="fa-solid fa-circle-check"></i></button><button class="logout-btn" onclick="rejectRequest('${safeId(r.id)}')"><i class="fa-solid fa-xmark"></i></button>`:`<span>${esc(r.status)}</span>`}</div></div></div>`).join('')}</div>`;
}
async function completeRequest(id) {
  await fetch(`${API}/api/admin/complete-request`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id }) });
  renderRequests();
}
async function rejectRequest(id) {
  if (!confirm('Reddedilirse bakiye iade edilir.')) return;
  await fetch(`${API}/api/admin/reject-request`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ requestId: id }) });
  renderRequests();
}

async function renderAnnouncements() {
  const content = document.getElementById('content');
  const announcements = await fetch(`${API}/api/announcements`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-bullhorn"></i> Duyurular</h2>${announcements.length === 0 ? '<p class="empty-note">Yeni bir haberimiz olduğunda burada paylaşacağız. Şimdilik keyfine bak!</p>' : announcements.map(a => `<div class="announcement-item"><h3>${esc(a.title)}</h3><p>${esc(a.content)}</p><small>${new Date(a.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderNews() {
  const content = document.getElementById('content');
  const news = await fetch(`${API}/api/news`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-newspaper"></i> Haberler</h2>${news.length === 0 ? '<p class="empty-note">Şu an paylaşacak yeni bir gelişme yok. Yeni haberler burada olacak.</p>' : news.map(n => `<div class="news-item"><h3>${esc(n.title)}</h3><p>${esc(n.content)}</p><small>${new Date(n.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderManageAnnouncements() {
  if (!currentUser?.isAdmin) return;
  const content = document.getElementById('content');
  const announcements = await fetch(`${API}/api/announcements`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-clipboard-list"></i> Duyuru Yönet</h2>${announcements.length === 0 ? '<p class="empty-note">Henüz yayınlanmış bir duyuru yok. Yeni bir şey paylaşmak istersen üst menüden duyuru ekleyebilirsin.</p>' : announcements.map(a => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${esc(a.title)}</b><br><small>${esc(new Date(a.date).toLocaleString())}</small></div><button class="logout-btn" onclick="deleteAnnouncement('${safeId(a.id)}')"><i class="fa-solid fa-trash"></i> Sil</button></div>`).join('')}</div>`;
}
async function deleteAnnouncement(id) {
  if (!confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) return;
  await fetch(`${API}/api/admin/announcement`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageAnnouncements();
}

async function renderManageNews() {
  if (!currentUser?.isAdmin) return;
  const content = document.getElementById('content');
  const news = await fetch(`${API}/api/news`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-clipboard-list"></i> Haber Yönet</h2>${news.length === 0 ? '<p class="empty-note">Şu an listede haber yok. Paylaşacağın ilk gelişme için üst menüden haber ekleyebilirsin.</p>' : news.map(n => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${esc(n.title)}</b><br><small>${esc(new Date(n.date).toLocaleString())}</small></div><button class="logout-btn" onclick="deleteNews('${safeId(n.id)}')"><i class="fa-solid fa-trash"></i> Sil</button></div>`).join('')}</div>`;
}
async function deleteNews(id) {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
  await fetch(`${API}/api/admin/news`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageNews();
}

async function renderCampaigns() {
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = Date.now();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-tags"></i> Kampanyalar</h2>${campaigns.length ? campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate).getTime()<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><b>${esc(c.title)}</b><p>${esc(c.description)}</p><p><i class="fa-solid fa-gift"></i> ${esc(c.reward)}</p><small>${c.endDate?new Date(c.endDate).toLocaleString():'Süresiz'} ${expired?'<i class="fa-solid fa-triangle-exclamation"></i> Süresi Doldu':''}</small></div>`}).join('') : '<p class="empty-note">Şu an aktif bir kampanya yok. Yeni fırsatlar olursa burada duyuracağız.</p>'}</div>`;
}

async function renderManageCampaigns() {
  if (!currentUser?.isAdmin) return;
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = Date.now();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2><i class="fa-solid fa-chart-simple"></i> Kampanya Yönet</h2>${campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate).getTime()<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border:1px solid var(--glass-border);"><div><b>${esc(c.title)}</b><br><small>${esc(c.description)} | <i class="fa-solid fa-gift"></i> ${esc(c.reward)}</small><br><small><i class="fa-solid fa-calendar"></i> ${esc(c.endDate?new Date(c.endDate).toLocaleString():'Süresiz')} ${expired?'<i class="fa-solid fa-triangle-exclamation"></i> Süresi Doldu':''}</small></div><button class="logout-btn" onclick="deleteCampaign('${safeId(c.id)}')"><i class="fa-solid fa-trash"></i> Sil</button></div>`}).join('')}</div>`;
}
async function deleteCampaign(id) {
  if (!confirm('Emin misiniz?')) return;
  await fetch(`${API}/api/admin/campaign`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageCampaigns();
}

function renderAdminForm(type) {
  let html = '';
  if (type === 'announcement') html = `<h2><i class="fa-solid fa-bullhorn"></i> Duyuru Ekle</h2><input id="title" placeholder="Başlık"><textarea id="content" placeholder="İçerik"></textarea><button onclick="submitAdmin('announcement')">Ekle</button>`;
  else if (type === 'campaign') html = `<h2><i class="fa-solid fa-bullseye"></i> Kampanya Ekle</h2><input id="title" placeholder="Başlık"><input id="description" placeholder="Açıklama"><input id="reward" placeholder="Ödül"><label><i class="fa-solid fa-calendar"></i> Bitiş Tarihi:</label><input id="endDate" type="datetime-local"><button onclick="submitAdmin('campaign')">Ekle</button>`;
  else if (type === 'news') html = `<h2><i class="fa-solid fa-newspaper"></i> Haber Ekle</h2><input id="title" placeholder="Başlık"><textarea id="content" placeholder="İçerik"></textarea><button onclick="submitAdmin('news')">Ekle</button>`;
  else if (type === 'item') html = `<h2><i class="fa-solid fa-cart-shopping"></i> Ürün Ekle</h2><input id="itemName" placeholder="Ürün adı"><input id="itemPrice" type="number" placeholder="Fiyat"><input id="itemCommand" placeholder="Komut"><button onclick="submitAdmin('item')">Ekle</button>`;
  document.getElementById('content').innerHTML = `<div class="glass-card admin-form" style="max-width:600px; margin:2rem auto;">${html}</div>`;
}

async function submitAdmin(type) {
  let endpoint, body;
  if (type === 'announcement') { endpoint = 'announcement'; body = { title: document.getElementById('title').value, content: document.getElementById('content').value }; }
  else if (type === 'news') { endpoint = 'news'; body = { title: document.getElementById('title').value, content: document.getElementById('content').value }; }
  else if (type === 'campaign') { endpoint = 'campaign'; body = { title: document.getElementById('title').value, description: document.getElementById('description').value, reward: document.getElementById('reward').value, endDate: document.getElementById('endDate')?.value || null }; }
  else if (type === 'item') { endpoint = 'item'; body = { name: document.getElementById('itemName').value, price: Number(document.getElementById('itemPrice').value), command: document.getElementById('itemCommand').value }; }
  const res = await fetch(`${API}/api/admin/${endpoint}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  alert(data.success ? 'Başarıyla eklendi' : (data.error || 'Hata'));
}

function openAuthModal(mode) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const isRegister = mode === 'register';
  body.innerHTML = `
    <h3 style="text-align:center; margin-bottom:1rem;">${isRegister ? 'Kaydol' : 'Giriş Yap'}</h3>
    <input id="authUsername" placeholder="Kullanıcı adı" autocomplete="username"
           maxlength="20" minlength="3" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next">
    ${isRegister ? `<input id="authEmail" type="email" placeholder="E-posta" autocomplete="email"
           inputmode="email" autocapitalize="none" spellcheck="false" enterkeyhint="next">` : ''}
    <input id="authPassword" type="password" placeholder="Parola"
           autocomplete="${isRegister ? 'new-password' : 'current-password'}" enterkeyhint="done">
    <p id="authError" class="auth-error" role="alert" aria-live="polite"></p>
    <button class="btn-green" id="authSubmit" type="button" style="width:100%; padding:12px;">${isRegister ? 'Kaydol' : 'Giriş'}</button>
    <div data-oauth-mount></div>
    <button id="cancelModal" type="button" style="width:100%; margin-top:8px; padding:10px;">Vazgeç</button>
    ${!isRegister ? `<p style="margin-top:12px; text-align:center;"><a href="#" style="color:var(--accent);" onclick="openForgotPasswordModal(); return false;">Şifremi unuttum</a></p>` : ''}
  `;
  document.getElementById('authSubmit').addEventListener('click', () => handleAuth(mode));
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  if (window.TurboluOAuth) window.TurboluOAuth.mountAll(body);
  modal.classList.remove('hidden');
  modal.scrollTop = 0;
  body.scrollTop = 0;
  body.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        handleAuth(mode);
      }
    });
  });
  setTimeout(() => document.getElementById('authUsername')?.focus(), 60);
}

function openForgotPasswordModal() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h3 style="text-align:center; margin-bottom:1rem;">Şifremi Unuttum</h3>
    <input id="forgotEmail" type="email" placeholder="E-posta adresiniz" autocomplete="email">
    <button class="btn-green" id="forgotSubmit" style="width:100%; padding:12px;">Gönder</button>
    <button id="cancelForgot" style="width:100%; margin-top:8px; padding:10px;">Vazgeç</button>
  `;
  document.getElementById('forgotSubmit').addEventListener('click', async () => {
    const emailEl = document.getElementById('forgotEmail');
    const btn = document.getElementById('forgotSubmit');
    const email = emailEl.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('Geçerli bir e-posta adresi gir.');
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Gönderiliyor…';
    try {
      const res = await fetch(`${API}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      alert(data.message || data.error || 'İstek gönderilemedi.');
      closeModal();
    } catch (_) {
      alert('Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.');
      btn.disabled = false;
      btn.textContent = 'Gönder';
    }
  });
  document.getElementById('forgotEmail').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      document.getElementById('forgotSubmit').click();
    }
  });
  document.getElementById('cancelForgot').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
  setTimeout(() => document.getElementById('forgotEmail')?.focus(), 60);
}

let authBusy = false;

async function handleAuth(mode) {
  if (authBusy) return;

  const usernameEl = document.getElementById('authUsername');
  const passwordEl = document.getElementById('authPassword');
  const emailEl = document.getElementById('authEmail');
  const submit = document.getElementById('authSubmit');
  const errorEl = document.getElementById('authError');
  if (!usernameEl || !passwordEl) return;

  const username = usernameEl.value.trim().replace(/\s+/g, ' ');
  const password = passwordEl.value;
  const email = emailEl ? emailEl.value.trim() : '';
  const hata = (mesaj) => {
    if (errorEl) errorEl.textContent = mesaj;
    else alert(mesaj);
  };

  if (!username) return hata('Kullanıcı adı gerekli.');
  if ([...username].length < 3) return hata('Kullanıcı adı en az 3 karakter olmalı.');
  if (!password) return hata('Parola gerekli.');
  if (mode === 'register') {
    if (!email) return hata('E-posta gerekli.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return hata('Geçerli bir e-posta adresi gir.');
  }

  authBusy = true;
  if (errorEl) errorEl.textContent = '';
  if (submit) {
    submit.disabled = true;
    submit.textContent = mode === 'register' ? 'Kaydediliyor…' : 'Giriş yapılıyor…';
  }

  try {
    const res = await fetch(`${API}/api/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode === 'register'
        ? { username, password, email }
        : { username, password })
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.error) {
      hata(data.error || 'İşlem tamamlanamadı. Lütfen tekrar dene.');
      return;
    }

    localStorage.setItem('token', data.token);
    token = data.token;
    currentUser = { username: data.username, balance: data.balance, isAdmin: data.isAdmin };
    closeModal();
    await profilYenile();
    renderUI();
    showContent('status');
    // Yeni hesaplarda kurulum ekranı açılır.
    if (currentUser && currentUser.setupCompleted === false) hesapKurulumAc(currentUser);
  } catch (_) {
    hata('Sunucuya ulaşılamadı. İnternet bağlantını kontrol edip tekrar dene.');
  } finally {
    authBusy = false;
    if (submit && document.body.contains(submit)) {
      submit.disabled = false;
      submit.textContent = mode === 'register' ? 'Kaydol' : 'Giriş';
    }
  }
}

async function renderProfile() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="glass-card profile-card">
      <h2><i class="fa-solid fa-user"></i> Profil</h2>
      <div class="profile-avatar-section">
        <img src="${esc(safeImageSrc(currentUser.icon))}" class="profile-avatar" id="profileAvatar" loading="lazy" alt="Profil fotoğrafı">
        <button id="changeAvatarBtn" class="small-btn"><i class="fa-solid fa-folder"></i> Avatar Değiştir</button>
        <input type="file" id="avatarUpload" accept="image/*" style="display:none">
      </div>
      <div class="profile-field">
        <label><i class="fa-solid fa-globe"></i> Dil</label>
        <select id="langSelect"><option value="tr">Türkçe</option><option value="en">English</option></select>
      </div>
      <div class="profile-field">
        <label><i class="fa-solid fa-comment"></i> Durum</label>
        <select id="statusSelect"><option value="Online">Çevrimiçi</option><option value="Offline">Çevrimdışı</option></select>
      </div>
      <div class="profile-field">
        <label><i class="fa-solid fa-cube"></i> Java Minecraft adın</label>
        <input id="minecraftJavaInput" type="text" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Örn. TurboluMC" value="${esc(currentUser.minecraftJava || '')}">
      </div>
      <div class="profile-field">
        <label><i class="fa-solid fa-cubes"></i> Bedrock oyuncu adın</label>
        <input id="minecraftBedrockInput" type="text" maxlength="20" autocomplete="off" spellcheck="false" placeholder="Örn. TurboluMC" value="${esc(currentUser.minecraftBedrock || '')}">
      </div>
      <div class="profile-field">
        <label><i class="fa-solid fa-cake-candles"></i> Doğum tarihi</label>
        <input id="birthDateInput" type="date" max="${bugunTarih()}">
      </div>
      <p class="empty-note" style="text-align:left; margin-top:-4px;">
        ${currentUser.isChild ? 'Çocuk hesabısın: sana özel hediyeler ana sayfada görünüyor.' : 'Doğum tarihin yalnızca yaşına göre hediye göstermek için kullanılır, kimseye gösterilmez.'}
      </p>
      <button id="setupAgainBtn" class="small-btn" style="width:100%; margin-top:12px;">
        <i class="fa-solid fa-sliders"></i> Hesap kurulumunu güncelle
      </button>
      <hr style="margin: 1rem 0; border-color: var(--glass-border);">
      <h3 style="margin-bottom:0.5rem;"><i class="fa-solid fa-lock"></i> Şifre Değiştir</h3>
      <div class="profile-field"><input id="oldPass" type="password" placeholder="Mevcut şifre" autocomplete="current-password"></div>
      <div class="profile-field"><input id="newPass" type="password" placeholder="Yeni şifre" autocomplete="new-password"></div>
      <button id="changePassBtn" class="small-btn">Şifreyi Güncelle</button>
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button id="saveSettingsBtn">Kaydet</button>
        <button onclick="showContent('status')"><i class="fa-solid fa-arrow-left"></i> Geri</button>
      </div>
    </div>
  `;
  document.getElementById('langSelect').value = currentUser.language || 'tr';
  document.getElementById('statusSelect').value = currentUser.status || 'Online';
  document.getElementById('birthDateInput').value = currentUser.birthDate || '';
  document.getElementById('changeAvatarBtn').addEventListener('click', () => document.getElementById('avatarUpload').click());
  document.getElementById('avatarUpload').addEventListener('change', uploadAvatar);
  document.getElementById('changePassBtn').addEventListener('click', changePassword);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveProfileSettings);
  document.getElementById('setupAgainBtn').addEventListener('click', () => {
    hesapKurulumAc(currentUser);
  });
}

async function uploadAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  const izinli = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
  if (!izinli.includes(file.type)) {
    alert('Sadece PNG, JPEG, WEBP veya GIF yükleyebilirsin.');
    event.target.value = '';
    return;
  }
  if (file.size > 2 * 1024 * 1024) return alert('Dosya çok büyük (max 2MB)');
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    currentUser.icon = base64;
    await fetch(`${API}/api/profile`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ icon: base64 })
    });
    const pa = document.getElementById('profileAvatar');
    if (pa) pa.src = base64;
    const ta = document.querySelector('.user-area .profile-icon');
    if (ta) ta.src = base64;
  };
  reader.readAsDataURL(file);
}

async function changePassword() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  if (!oldPass || !newPass) return alert('Lütfen alanları doldurun');
  const res = await fetch(`${API}/api/password`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
  });
  const data = await res.json();
  alert(data.success ? 'Şifre değiştirildi' : (data.error || 'Hata'));
}

async function saveProfileSettings() {
  const language = document.getElementById('langSelect').value;
  const status = document.getElementById('statusSelect').value;
  const java = document.getElementById('minecraftJavaInput').value.trim();
  const bedrock = document.getElementById('minecraftBedrockInput').value.trim();
  const dogum = document.getElementById('birthDateInput').value;

  if (java && !/^[A-Za-z0-9_]{3,16}$/.test(java)) return alert('Java adı 3-16 karakter olmalı (harf, rakam, alt çizgi).');
  if (bedrock && !/^[\p{L}\p{N} _.-]{2,20}$/u.test(bedrock)) return alert('Bedrock adı 2-20 karakter olabilir.');
  if (dogum && dogum > bugunTarih()) return alert('Doğum tarihi gelecekte olamaz.');

  const govde = { language, status, minecraftJava: java, minecraftBedrock: bedrock };
  if (dogum) govde.birthDate = dogum;
  // Kurulum alanları tamamlandıysa hesap artık "kurulmuş" sayılır.
  if (dogum && (java || bedrock)) govde.setupCompleted = true;

  const res = await fetch(`${API}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(govde)
  });
  const data = await res.json();
  if (data.success) {
    currentUser.language = language;
    currentUser.status = status;
    currentUser.minecraftJava = java;
    currentUser.minecraftBedrock = bedrock;
    if (dogum) currentUser.birthDate = dogum;
    if (typeof data.isChild === 'boolean') currentUser.isChild = data.isChild;
    if (typeof data.setupCompleted === 'boolean') currentUser.setupCompleted = data.setupCompleted;
    setLang(language);
    renderUI();
    showContent('status');
  } else alert(data.error || 'Hata');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('notificationsEnabled');
  token = null;
  currentUser = null;
  location.reload();
}
function setLang(lang) { currentLang = lang; localStorage.setItem('lang', lang); renderUI(); }
