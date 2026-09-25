// ============================================
// TURBOLU BEDROCK - app.js
// ============================================

const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
const VAPID_PUBLIC_KEY = 'BD3kAyCW2OpZmM7SzNSEeANMtFNDXUiFP3ZDpgOfeRv78S3Igz4qOxZZubXBo1kXaj_9Q53lwKghx0PIIsRsaXk';
const DEFAULT_AVATAR = '../mc/crpr.png';
const PLATFORM = 'bedrock';

// ============================================
// BEDROCK SUNUCU IP AYARLARI
// ============================================
const SERVER_HOST = 'turbolubedrock.mcsh.io';
const SERVER_ALT = '163.5.201.11:13317';
const SERVER_STATUS_QUERY = '163.5.201.11:13317';
const SERVER_IP_DISPLAY = SERVER_HOST;

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
let notificationPreferences = JSON.parse(localStorage.getItem('notifyPrefs') || '{"announcements":true,"news":true,"campaigns":true,"items":true}');

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

// ========== TEMA ==========
function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = saved ? saved === 'light' : prefersLight;
  document.documentElement.classList.toggle('light', isLight);
  updateThemeIcon();
}
function toggleTheme() {
  const root = document.documentElement;
  const isLight = root.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.documentElement.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== MOUSE BUHAR İZİ ==========
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
const BG_MAX = 26;
const BG_EMIT_INTERVAL = 350;
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

function emitBgParticle() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const x = Math.random() * w;
  const y = h + 40;
  bgParticles.push({
    x, y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: -0.4 - Math.random() * 0.5,
    size: 30 + Math.random() * 50,
    life: 1.0,
    decay: 0.004 + Math.random() * 0.004,
    wobble: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.005 + Math.random() * 0.01
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
    p.size += 0.35 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0 || p.y + p.size < -50) { bgParticles.splice(i, 1); continue; }

    const alpha = p.life * 0.22;
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
    await navigator.clipboard.writeText(SERVER_IP_DISPLAY);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = SERVER_IP_DISPLAY;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
  const altInfo = document.getElementById('alt-ip-info');
  if (altInfo) {
    altInfo.innerHTML = `
      <p style="margin-top: 12px; font-size: 0.9rem; opacity: 0.9; line-height: 1.6;">
        ✅ Adres kopyalandı!<br>
        ⚠️ Giremediyseniz alternatif IP: <strong style="color: var(--accent);">${SERVER_ALT}</strong><br>
        ❓ Bağlantı sorunu yaşarsanız admin ile iletişime geçiniz.
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
  const registration = await navigator.serviceWorker.register('../mc/sw.js');
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
  if (result) { localStorage.setItem('notificationsEnabled', 'true'); alert('✅ Bildirimler aktif edildi!'); }
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initSteam();
  initBgSteam();

  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('../mc/sw.js'); } catch (e) {}
  }

  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) setLang(tr ? 'tr' : 'en'); else setLang(currentLang);
  } catch { setLang(currentLang); }

  if (token) {
    try {
      const res = await fetch(`${API}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      currentUser = data;
    } catch (e) { logout(); }
  }
  renderUI();
});

// ========== UI ==========
function renderUI() {
  const userArea = document.getElementById('userArea');
  const navLinks = document.getElementById('navLinks');
  const content = document.getElementById('content');

  let buttons = '';
  if (currentUser) {
    if (currentUser.isAdmin) {
      buttons = `
        <button onclick="showContent('requests')">📋 Talepler</button>
        <button onclick="showContent('addAnnouncement')">📢 Duyuru</button>
        <button onclick="showContent('manageAnnouncements')">📋 Duyuru Yönet</button>
        <button onclick="showContent('addCampaign')">🎯 Kampanya</button>
        <button onclick="showContent('manageCampaigns')">📊 Kampanya Yönet</button>
        <button onclick="showContent('addNews')">📰 Haber</button>
        <button onclick="showContent('manageNews')">📋 Haber Yönet</button>
        <button onclick="showContent('addItem')">🛒 Ürün Ekle</button>
      `;
    } else {
      buttons = `
        <button onclick="showContent('shop')">🛒 Market</button>
        <button onclick="showContent('inventory')">📦 Taleplerim</button>
        <button onclick="showContent('campaigns')">📣 Kampanyalar</button>
        <button onclick="showContent('announcements')">📢 Duyurular</button>
        <button onclick="showContent('news')">📰 Haberler</button>
      `;
    }
    navLinks.innerHTML = buttons;
    userArea.innerHTML = `
      <button onclick="requestNotificationPermission()" title="Bildirim">🔔</button>
      <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-icon" onclick="showContent('profile')" title="Profil" loading="lazy">
      <span class="username-label">${currentUser.username}</span>
      <button class="logout-btn" onclick="logout()">Çıkış</button>
    `;
  } else {
    navLinks.innerHTML = '';
    userArea.innerHTML = `
      <button class="btn-green" onclick="openAuthModal('register')">Kaydol</button>
      <button onclick="openAuthModal('login')">Giriş Yap</button>
    `;
  }
  if (!content.innerHTML.trim()) showContent('status');
}

function showContent(section) {
  const content = document.getElementById('content');
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
    <div class="glass-card hero-card">
      <h1><i class="fa-solid fa-cube"></i> Turbolu Bedrock'a Hoş Geldiniz! <i class="fa-solid fa-cube"></i></h1>
      <p>Telefon, tablet ve konsoldan katılın. Cross-play destekli Bedrock sunucumuz!</p>
      <div class="ip-box" onclick="kopyalaIP()">
        <span>${SERVER_IP_DISPLAY}</span>
        <button class="copy-btn"><i class="fa-regular fa-copy"></i> Kopyala</button>
      </div>
      <p class="click-info">Adrese tıklayarak kopyalayabilirsin!</p>
      <div id="alt-ip-info"></div>
    </div>
    <div class="glass-card" id="features">
      <h2 style="text-align:center; color: var(--accent); margin-bottom:1.5rem;">Neden Bedrock?</h2>
      <div class="features-grid">
        <div class="feature-item"><i class="fa-solid fa-mobile-screen"></i><h3>Cross-Play</h3><p>Telefon, konsol, PC fark etmez — herkes oynar.</p></div>
        <div class="feature-item"><i class="fa-solid fa-shield-halved"></i><h3>Adil Oyun</h3><p>Hileye sıfır tolerans, güvenli ortam.</p></div>
        <div class="feature-item"><i class="fa-solid fa-users"></i><h3>Aktif Topluluk</h3><p>7/24 oyuncu ve etkinlikler.</p></div>
      </div>
    </div>
    <div class="glass-card" id="durum">
      <h2 style="text-align:center; color: var(--accent); margin-bottom:1.5rem;">Anlık Sunucu Durumu</h2>
      <div class="status-info" style="text-align:center;">
        <p><strong>Durum:</strong> <span id="online-durum"><i class="fa-solid fa-circle-notch fa-spin"></i> Kontrol ediliyor...</span></p>
        <p><strong>Çevrimiçi Oyuncular:</strong> <span id="oyuncu-sayisi">- / -</span></p>
        <p><strong>Sürüm:</strong> <span id="sunucu-surum">-</span></p>
      </div>
    </div>
    <div class="footer">
      <p>&copy; 2026 Eren Yılmaz - Turbolu Bedrock. Tüm Hakları Saklıdır.</p>
      <p class="license-text">Bu proje GNU General Public License v3.0 ile korunmaktadır.</p>
    </div>
  `;
  async function updateStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(
        `https://api.mcsrvstat.us/bedrock/2/${SERVER_STATUS_QUERY}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);
      const data = await res.json();
      const durumEl = document.getElementById('online-durum');
      if (!durumEl) return;
      durumEl.innerHTML = data.online
        ? '<span style="color:#22c55e">🟢 Çevrimiçi</span>'
        : '<span style="color:#ef4444">🔴 Çevrimdışı</span>';
      document.getElementById('oyuncu-sayisi').textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
      document.getElementById('sunucu-surum').textContent = data.version || '-';
    } catch (e) {}
  }
  updateStatus();
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(updateStatus, 15000);
}

async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items?platform=${PLATFORM}`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>🛒 Market</h2>${currentUser ? `<p>Bakiye: <strong>${currentUser.balance}</strong> puan</p>` : ''}${items.map(i => `<div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:var(--surface-soft); border-radius:10px; margin:8px 0; border:1px solid var(--glass-border);"><div><b>${i.name}</b><p style="font-size:0.85rem; opacity:0.7;">${i.price} puan</p></div><button onclick="buy('${i.id}')">Satın Al</button></div>`).join('')}</div>`;
}
async function buy(itemId) {
  if (!token) return alert('Lütfen giriş yapın.');
  const res = await fetch(`${API}/api/buy`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
  const data = await res.json();
  if (data.error) alert(data.error);
  else { alert('✅ Talep alındı!'); currentUser.balance = data.new_balance; renderShop(); }
}

async function renderInventory() {
  const content = document.getElementById('content');
  if (!currentUser) return;
  const requests = await fetch(`${API}/api/inventory`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📦 Taleplerim</h2>${requests.length === 0 ? '<p>Henüz talebiniz yok.</p>' : requests.map(r => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; border:1px solid var(--glass-border);"><div><b>${r.item_name}</b> (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()}</small></div><span style="padding:4px 12px; border-radius:20px; font-size:0.85rem; background:${r.status==='completed'?'#22c55e':r.status==='rejected'?'#ef4444':'#eab308'}; color:white;">${r.status}</span></div>`).join('')}</div>`;
}

async function renderRequests() {
  if (!currentUser?.isAdmin) return;
  const requests = await fetch(`${API}/api/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  const content = document.getElementById('content');
  content.innerHTML = `<div class="glass-card"><h2>📋 Talepler</h2>${requests.length===0?'<p>Talep yok.</p>':requests.map(r=>`<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;"><div><b>${r.user_name}</b> → ${r.item_name} (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()} • ${r.platform || 'all'}</small></div><div style="display:flex; gap:6px;">${r.status==='pending'?`<button onclick="completeRequest('${r.id}')">✅</button><button class="logout-btn" onclick="rejectRequest('${r.id}')">❌</button>`:`<span>${r.status}</span>`}</div></div></div>`).join('')}</div>`;
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
  const announcements = await fetch(`${API}/api/announcements?platform=${PLATFORM}`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📢 Duyurular</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div class="announcement-item"><h3>${a.title}</h3><p>${a.content}</p><small>${new Date(a.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderNews() {
  const content = document.getElementById('content');
  const news = await fetch(`${API}/api/news?platform=${PLATFORM}`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📰 Haberler</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div class="news-item"><h3>${n.title}</h3><p>${n.content}</p><small>${new Date(n.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderManageAnnouncements() {
  if (!currentUser?.isAdmin) return;
  const content = document.getElementById('content');
  const announcements = await fetch(`${API}/api/announcements`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📋 Duyuru Yönet</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${a.title}</b> <small style="opacity:0.6;">[${a.platform||'all'}]</small><br><small>${new Date(a.date).toLocaleString()}</small></div><button class="logout-btn" onclick="deleteAnnouncement('${a.id}')">🗑️ Sil</button></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📋 Haber Yönet</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${n.title}</b> <small style="opacity:0.6;">[${n.platform||'all'}]</small><br><small>${new Date(n.date).toLocaleString()}</small></div><button class="logout-btn" onclick="deleteNews('${n.id}')">🗑️ Sil</button></div>`).join('')}</div>`;
}
async function deleteNews(id) {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
  await fetch(`${API}/api/admin/news`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageNews();
}

async function renderCampaigns() {
  const campaigns = await fetch(`${API}/api/campaigns?platform=${PLATFORM}`).then(r => r.json());
  const now = Date.now();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📣 Kampanyalar</h2>${campaigns.map(c=>{const expired=c.end_date&&new Date(c.end_date).getTime()<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><b>${c.title}</b><p>${c.description}</p><p>🎁 ${c.reward}</p><small>${c.end_date?new Date(c.end_date).toLocaleString():'Süresiz'} ${expired?'⚠️ Süresi Doldu':''}</small></div>`}).join('')}</div>`;
}

async function renderManageCampaigns() {
  if (!currentUser?.isAdmin) return;
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = Date.now();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📊 Kampanya Yönet</h2>${campaigns.map(c=>{const expired=c.end_date&&new Date(c.end_date).getTime()<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border:1px solid var(--glass-border);"><div><b>${c.title}</b> <small style="opacity:0.6;">[${c.platform||'all'}]</small><br><small>${c.description} | 🎁 ${c.reward}</small><br><small>📅 ${c.end_date?new Date(c.end_date).toLocaleString():'Süresiz'} ${expired?'⚠️ Süresi Doldu':''}</small></div><button class="logout-btn" onclick="deleteCampaign('${c.id}')">🗑️ Sil</button></div>`}).join('')}</div>`;
}
async function deleteCampaign(id) {
  if (!confirm('Emin misiniz?')) return;
  await fetch(`${API}/api/admin/campaign`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageCampaigns();
}

function renderAdminForm(type) {
  let html = '';
  const platformOptions = `
    <label>🎯 Platform:</label>
    <select id="platform">
      <option value="all">Her İkisi (MC + Bedrock)</option>
      <option value="bedrock" selected>Sadece Bedrock</option>
      <option value="mc">Sadece MC (Java)</option>
    </select>`;

  if (type === 'announcement') html = `<h2>📢 Duyuru Ekle</h2><input id="title" placeholder="Başlık">${platformOptions}<textarea id="content" placeholder="İçerik"></textarea><button onclick="submitAdmin('announcement')">Ekle</button>`;
  else if (type === 'campaign') html = `<h2>🎯 Kampanya Ekle</h2><input id="title" placeholder="Başlık"><input id="description" placeholder="Açıklama"><input id="reward" placeholder="Ödül"><label>📅 Bitiş Tarihi:</label><input id="endDate" type="datetime-local">${platformOptions}<button onclick="submitAdmin('campaign')">Ekle</button>`;
  else if (type === 'news') html = `<h2>📰 Haber Ekle</h2><input id="title" placeholder="Başlık">${platformOptions}<textarea id="content" placeholder="İçerik"></textarea><button onclick="submitAdmin('news')">Ekle</button>`;
  else if (type === 'item') html = `<h2>🛒 Ürün Ekle</h2><input id="itemName" placeholder="Ürün adı"><input id="itemPrice" type="number" placeholder="Fiyat"><input id="itemCommand" placeholder="Komut">${platformOptions}<button onclick="submitAdmin('item')">Ekle</button>`;
  document.getElementById('content').innerHTML = `<div class="glass-card admin-form" style="max-width:600px; margin:2rem auto;">${html}</div>`;
}

async function submitAdmin(type) {
  const platformEl = document.getElementById('platform');
  const platform = platformEl ? platformEl.value : PLATFORM;

  let endpoint, body;
  if (type === 'announcement') { endpoint = 'announcement'; body = { title: document.getElementById('title').value, content: document.getElementById('content').value, platform }; }
  else if (type === 'news') { endpoint = 'news'; body = { title: document.getElementById('title').value, content: document.getElementById('content').value, platform }; }
  else if (type === 'campaign') { endpoint = 'campaign'; body = { title: document.getElementById('title').value, description: document.getElementById('description').value, reward: document.getElementById('reward').value, endDate: document.getElementById('endDate')?.value || null, platform }; }
  else if (type === 'item') { endpoint = 'item'; body = { name: document.getElementById('itemName').value, price: Number(document.getElementById('itemPrice').value), command: document.getElementById('itemCommand').value, platform }; }
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
    <input id="authUsername" placeholder="Kullanıcı adı" autocomplete="username">
    ${isRegister ? `<input id="authEmail" type="email" placeholder="E-posta" autocomplete="email">` : ''}
    <input id="authPassword" type="password" placeholder="Parola" autocomplete="${isRegister ? 'new-password' : 'current-password'}">
    <button class="btn-green" id="authSubmit" style="width:100%; padding:12px;">${isRegister ? 'Kaydol' : 'Giriş'}</button>
    <button id="cancelModal" style="width:100%; margin-top:8px; padding:10px;">Vazgeç</button>
    ${!isRegister ? `<p style="margin-top:12px; text-align:center;"><a href="#" style="color:var(--accent);" onclick="openForgotPasswordModal(); return false;">Şifremi unuttum</a></p>` : ''}
  `;
  document.getElementById('authSubmit').addEventListener('click', () => handleAuth(mode));
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
  body.querySelectorAll('input').forEach(inp => {
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAuth(mode); });
  });
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
    const email = document.getElementById('forgotEmail').value;
    const res = await fetch(`${API}/api/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || data.error);
    closeModal();
  });
  document.getElementById('cancelForgot').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
}

async function handleAuth(mode) {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const email = document.getElementById('authEmail')?.value || '';
  const res = await fetch(`${API}/api/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, platform: PLATFORM })
  });
  const data = await res.json();
  if (data.error) return alert(data.error);
  localStorage.setItem('token', data.token);
  token = data.token;
  currentUser = { username: data.username, balance: data.balance, isAdmin: data.isAdmin };
  closeModal();
  renderUI();
  showContent('status');
}

async function renderProfile() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="glass-card profile-card">
      <h2>👤 Profil</h2>
      <div class="profile-avatar-section">
        <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-avatar" id="profileAvatar" loading="lazy">
        <button id="changeAvatarBtn" class="small-btn">📁 Avatar Değiştir</button>
        <input type="file" id="avatarUpload" accept="image/*" style="display:none">
      </div>
      <div class="profile-field">
        <label>🌐 Dil</label>
        <select id="langSelect"><option value="tr">Türkçe</option><option value="en">English</option></select>
      </div>
      <div class="profile-field">
        <label>💬 Durum</label>
        <select id="statusSelect"><option value="Online">Çevrimiçi</option><option value="Offline">Çevrimdışı</option></select>
      </div>
      <hr style="margin: 1rem 0; border-color: var(--glass-border);">
      <h3 style="margin-bottom:0.5rem;">🔒 Şifre Değiştir</h3>
      <div class="profile-field"><input id="oldPass" type="password" placeholder="Mevcut şifre" autocomplete="current-password"></div>
      <div class="profile-field"><input id="newPass" type="password" placeholder="Yeni şifre" autocomplete="new-password"></div>
      <button id="changePassBtn" class="small-btn">Şifreyi Güncelle</button>
      <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: center;">
        <button id="saveSettingsBtn">Kaydet</button>
        <button onclick="showContent('status')">← Geri</button>
      </div>
    </div>
  `;
  document.getElementById('langSelect').value = currentUser.language || 'tr';
  document.getElementById('statusSelect').value = currentUser.status || 'Online';
  document.getElementById('changeAvatarBtn').addEventListener('click', () => document.getElementById('avatarUpload').click());
  document.getElementById('avatarUpload').addEventListener('change', uploadAvatar);
  document.getElementById('changePassBtn').addEventListener('click', changePassword);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveProfileSettings);
}

async function uploadAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
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
  const res = await fetch(`${API}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, status })
  });
  const data = await res.json();
  if (data.success) {
    currentUser.language = language;
    currentUser.status = status;
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
