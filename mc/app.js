const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
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
let notificationPreferences = JSON.parse(localStorage.getItem('notifyPrefs') || '{"announcements":true,"news":true,"campaigns":true,"items":true}');

function t(key) { return (translations[currentLang] && translations[currentLang][key]) || key; }

// Global
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
  document.body.classList.toggle('light', isLight);
  updateThemeIcon();
}
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.body.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== DOT GRID (sadece ana ekran) ==========
let dots = [];
let mouse = { x: -1000, y: -1000 };
let canvas, ctx;

function initCanvas() {
  canvas = document.getElementById('dotGridCanvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = -1000; mouse.y = -1000;
  });
  requestAnimationFrame(animateCanvas);
}
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  generateDots();
}
function generateDots() {
  dots = [];
  const spacing = 42;
  const cols = Math.ceil(canvas.width / spacing) + 1;
  const rows = Math.ceil(canvas.height / spacing) + 1;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      dots.push({
        baseX: i * spacing + spacing / 2,
        baseY: j * spacing + spacing / 2,
        phase: Math.random() * Math.PI * 2,
        size: 1.6
      });
    }
  }
}
let lastFrame = 0;
function animateCanvas(t) {
  if (t - lastFrame > 32) { drawDots(t); lastFrame = t; }
  requestAnimationFrame(animateCanvas);
}
function drawDots(t) {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const isLight = document.body.classList.contains('light');
  const colorBase = isLight ? [22, 163, 74] : [34, 197, 94];
  const baseAlpha = isLight ? 0.35 : 0.55;

  dots.forEach(dot => {
    const dx = mouse.x - dot.baseX;
    const dy = mouse.y - dot.baseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = 160;
    let offsetX = 0, offsetY = 0;
    let alpha = baseAlpha;
    let size = dot.size;
    if (dist < maxDist) {
      const force = (maxDist - dist) / maxDist;
      offsetX = -dx * force * 0.25;
      offsetY = -dy * force * 0.25;
      alpha = Math.min(1, baseAlpha + force * 0.5);
      size = dot.size + force * 1.2;
    }
    const floatX = Math.sin(t * 0.0008 + dot.phase) * 2.5;
    const floatY = Math.cos(t * 0.001 + dot.phase) * 2.5;
    const x = dot.baseX + floatX + offsetX;
    const y = dot.baseY + floatY + offsetY;
    ctx.fillStyle = `rgba(${colorBase[0]}, ${colorBase[1]}, ${colorBase[2]}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ========== STEAM TRAIL (mouse takipli buhar izi) ==========
let steamParticles = [];
let steamCanvas, steamCtx;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d');
  resizeSteamCanvas();
  window.addEventListener('resize', resizeSteamCanvas);
  document.addEventListener('mousemove', (e) => {
    // Sadece steam görünen sayfalarda particle üret
    if (!document.body.classList.contains('main-view') && !document.body.classList.contains('steam-only')) return;
    for (let i = 0; i < 3; i++) {
      steamParticles.push({
        x: e.clientX + (Math.random() - 0.5) * 24,
        y: e.clientY + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.6 - Math.random() * 1.0,
        size: 18 + Math.random() * 30,
        life: 1,
        decay: 0.012 + Math.random() * 0.018
      });
    }
    if (steamParticles.length > 150) {
      steamParticles.splice(0, steamParticles.length - 150);
    }
  });
  requestAnimationFrame(animateSteam);
}

function resizeSteamCanvas() {
  if (!steamCanvas) return;
  steamCanvas.width = window.innerWidth;
  steamCanvas.height = window.innerHeight;
}

function animateSteam() {
  if (!steamCtx) return;
  steamCtx.clearRect(0, 0, steamCanvas.width, steamCanvas.height);

  const isLight = document.body.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.008;
    p.vx *= 0.99;
    p.size += 0.6;
    p.life -= p.decay;

    if (p.life <= 0) {
      steamParticles.splice(i, 1);
      continue;
    }

    const alpha = p.life * 0.55;
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.6, `rgba(${color}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }

  requestAnimationFrame(animateSteam);
}

// ========== PARALAKS (diğer sekmeler) ==========
function initParallax() {
  const bgImage = document.getElementById('bgImage');
  if (!bgImage) return;
  document.addEventListener('mousemove', (e) => {
    if (document.body.classList.contains('main-view')) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    bgImage.style.transform = `scale(1.1) translate(${x}px, ${y}px)`;
  });
}

// ========== IP ==========
function kopyalaIP() {
  navigator.clipboard.writeText('turbolumc.aternos.me');
  const altInfo = document.getElementById('alt-ip-info');
  if (altInfo) {
    altInfo.innerHTML = `
      <p style="margin-top: 12px; font-size: 0.9rem; opacity: 0.9;">
        ✅ IP Kopyalandı!<br>
        ⚠️ Giremediyseniz alternatif IP: <strong style="color: var(--accent);">turbolu.aternos.me:13795</strong><br>
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
  if (result) { localStorage.setItem('notificationsEnabled', 'true'); alert('✅ Bildirimler aktif edildi!'); }
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  initCanvas();
  initSteam();
  initParallax();

  if ('serviceWorker' in navigator) { try { await navigator.serviceWorker.register('/mc/sw.js'); } catch (e) {} }

  try {
    const res = await fetch(`${API}/api/country`); const { tr } = await res.json();
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
      <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-icon" onclick="showContent('profile')" title="Profil">
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
  if (section !== 'status' && statusInterval) { clearInterval(statusInterval); statusInterval = null; }

  if (section === 'status') document.body.classList.add('main-view');
  else document.body.classList.remove('main-view');

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
      <h1><i class="fa-solid fa-gamepad"></i> TurboluMC Dünyasına Hoş Geldiniz! <i class="fa-solid fa-gamepad"></i></h1>
      <p>Kesintisiz macera, harika topluluk ve eğlence dolu anlar seni bekliyor.</p>
      <div class="ip-box" onclick="kopyalaIP()">
        <span>turbolumc.aternos.me</span>
        <button class="copy-btn"><i class="fa-regular fa-copy"></i> Kopyala</button>
      </div>
      <p class="click-info">IP adresine tıklayarak kopyalayabilirsin!</p>
      <div id="alt-ip-info"></div>
    </div>
    <div class="glass-card" id="features">
      <h2 style="text-align:center; color: var(--accent); margin-bottom:1.5rem;">Neden Biz?</h2>
      <div class="features-grid">
        <div class="feature-item"><i class="fa-solid fa-bolt"></i><h3>Yüksek Performans</h3><p>Donma ve lag olmadan akıcı oyun.</p></div>
        <div class="feature-item"><i class="fa-solid fa-shield-halved"></i><h3>Adil Oyun</h3><p>Hileye sıfır tolerans.</p></div>
        <div class="feature-item"><i class="fa-solid fa-users"></i><h3>Harika Topluluk</h3><p>Aktif yönetim ve dost oyuncular.</p></div>
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
      <p>&copy; 2026 Eren Yılmaz - TurboluMC. Tüm Hakları Saklıdır.</p>
      <p class="license-text">Bu proje GNU General Public License v3.0 ile korunmaktadır.</p>
    </div>
  `;
  async function updateStatus() {
    try {
      const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me');
      const data = await res.json();
      const durumEl = document.getElementById('online-durum');
      if (!durumEl) return;
      durumEl.innerHTML = data.online ? '<span style="color:#22c55e">🟢 Çevrimiçi</span>' : '<span style="color:#ef4444">🔴 Çevrimdışı</span>';
      document.getElementById('oyuncu-sayisi').textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
      document.getElementById('sunucu-surum').textContent = data.version || '-';
    } catch (e) {}
  }
  updateStatus();
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(updateStatus, 10000);
}

async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items`).then(r => r.json());
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
  content.innerHTML = `<div class="glass-card"><h2>📦 Taleplerim</h2>${requests.length === 0 ? '<p>Henüz talebiniz yok.</p>' : requests.map(r => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; border:1px solid var(--glass-border);"><div><b>${r.item}</b> (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()}</small></div><span style="padding:4px 12px; border-radius:20px; font-size:0.85rem; background:${r.status==='completed'?'#22c55e':r.status==='rejected'?'#ef4444':'#eab308'}; color:white;">${r.status}</span></div>`).join('')}</div>`;
}

async function renderRequests() {
  if (!currentUser?.isAdmin) return;
  const requests = await fetch(`${API}/api/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  const content = document.getElementById('content');
  content.innerHTML = `<div class="glass-card"><h2>📋 Talepler</h2>${requests.length===0?'<p>Talep yok.</p>':requests.map(r=>`<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px;"><div><b>${r.user}</b> → ${r.item} (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()}</small></div><div style="display:flex; gap:6px;">${r.status==='pending'?`<button onclick="completeRequest('${r.id}')">✅</button><button class="logout-btn" onclick="rejectRequest('${r.id}')">❌</button>`:`<span>${r.status}</span>`}</div></div></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📢 Duyurular</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div class="announcement-item"><h3>${a.title}</h3><p>${a.content}</p><small>${new Date(a.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderNews() {
  const content = document.getElementById('content');
  const news = await fetch(`${API}/api/news`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📰 Haberler</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div class="news-item"><h3>${n.title}</h3><p>${n.content}</p><small>${new Date(n.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderManageAnnouncements() {
  if (!currentUser?.isAdmin) return;
  const content = document.getElementById('content');
  const announcements = await fetch(`${API}/api/announcements`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📋 Duyuru Yönet</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${a.title}</b><br><small>${new Date(a.date).toLocaleString()}</small></div><button class="logout-btn" onclick="deleteAnnouncement('${a.id}')">🗑️ Sil</button></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📋 Haber Yönet</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--glass-border);"><div><b>${n.title}</b><br><small>${new Date(n.date).toLocaleString()}</small></div><button class="logout-btn" onclick="deleteNews('${n.id}')">🗑️ Sil</button></div>`).join('')}</div>`;
}
async function deleteNews(id) {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
  await fetch(`${API}/api/admin/news`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageNews();
}

async function renderCampaigns() {
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📣 Kampanyalar</h2>${campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate)<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; border:1px solid var(--glass-border);"><b>${c.title}</b><p>${c.description}</p><p>🎁 ${c.reward}</p><small>${c.endDate?new Date(c.endDate).toLocaleString():'Süresiz'} ${expired?'⚠️ Süresi Doldu':''}</small></div>`}).join('')}</div>`;
}

async function renderManageCampaigns() {
  if (!currentUser?.isAdmin) return;
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📊 Kampanya Yönet</h2>${campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate)<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:12px; background:var(--surface-soft); border-radius:10px; margin:6px 0; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; border:1px solid var(--glass-border);"><div><b>${c.title}</b><br><small>${c.description} | 🎁 ${c.reward}</small><br><small>📅 ${c.endDate?new Date(c.endDate).toLocaleString():'Süresiz'} ${expired?'⚠️ Süresi Doldu':''}</small></div><button class="logout-btn" onclick="deleteCampaign('${c.id}')">🗑️ Sil</button></div>`}).join('')}</div>`;
}
async function deleteCampaign(id) {
  if (!confirm('Emin misiniz?')) return;
  await fetch(`${API}/api/admin/campaign`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageCampaigns();
}

function renderAdminForm(type) {
  let html = '';
  if (type === 'announcement') html = `<h2>📢 Duyuru Ekle</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('announcement')">Ekle</button>`;
  else if (type === 'campaign') html = `<h2>🎯 Kampanya Ekle</h2><input id="title" placeholder="Başlık"><br><input id="description" placeholder="Açıklama"><br><input id="reward" placeholder="Ödül"><br><label>📅 Bitiş Tarihi:</label><input id="endDate" type="datetime-local"><br><button onclick="submitAdmin('campaign')">Ekle</button>`;
  else if (type === 'news') html = `<h2>📰 Haber Ekle</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('news')">Ekle</button>`;
  else if (type === 'item') html = `<h2>🛒 Ürün Ekle</h2><input id="itemName" placeholder="Ürün adı"><br><input id="itemPrice" type="number" placeholder="Fiyat"><br><input id="itemCommand" placeholder="Komut"><br><button onclick="submitAdmin('item')">Ekle</button>`;
  document.getElementById('content').innerHTML = `<div class="glass-card" style="max-width:600px; margin:2rem auto;">${html}</div>`;
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
    <input id="authUsername" placeholder="Kullanıcı adı">
    ${isRegister ? `<input id="authEmail" type="email" placeholder="E-posta">` : ''}
    <input id="authPassword" type="password" placeholder="Parola">
    <button class="btn-green" id="authSubmit" style="width:100%; padding:12px;">${isRegister ? 'Kaydol' : 'Giriş'}</button>
    <button id="cancelModal" style="width:100%; margin-top:8px; padding:10px;">Vazgeç</button>
    ${!isRegister ? `<p style="margin-top:12px; text-align:center;"><a href="#" style="color:var(--accent);" onclick="openForgotPasswordModal(); return false;">Şifremi unuttum</a></p>` : ''}
  `;
  document.getElementById('authSubmit').addEventListener('click', () => handleAuth(mode));
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
}

function openForgotPasswordModal() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h3 style="text-align:center; margin-bottom:1rem;">Şifremi Unuttum</h3>
    <input id="forgotEmail" type="email" placeholder="E-posta adresiniz">
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
    body: JSON.stringify({ username, password, email })
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
        <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-avatar" id="profileAvatar">
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
      <div class="profile-field"><input id="oldPass" type="password" placeholder="Mevcut şifre"></div>
      <div class="profile-field"><input id="newPass" type="password" placeholder="Yeni şifre"></div>
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
function logout() { localStorage.clear(); token = null; currentUser = null; location.reload(); }
function setLang(lang) { currentLang = lang; localStorage.setItem('lang', lang); renderUI(); }
