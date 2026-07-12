const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
const VAPID_PUBLIC_KEY = 'OLUŞTURDUĞUN_PUBLİC_KEY_BURAYA'; // <-- BURAYI GÜNCELLE

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'42\' height=\'42\' viewBox=\'0 0 42 42\'%3E%3Ccircle cx=\'21\' cy=\'21\' r=\'20\' fill=\'%2322c55e\'/%3E%3Ccircle cx=\'14\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Ccircle cx=\'28\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Cpath d=\'M12 26 Q21 32 30 26\' stroke=\'%230f172a\' stroke-width=\'3\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E';

const translations = {
  tr: {
    register: 'Kaydol', login: 'Giriş Yap', logout: 'Çıkış',
    shop: 'Market', campaigns: 'Kampanyalar',
    addAnnouncement: 'Duyuru Yap', addCampaign: 'Kampanya Düzenle',
    addNews: 'Haber Ekle', addItem: 'Ürün Ekle',
    manageCampaigns: 'Kampanyaları Yönet',
    inventory: 'Taleplerim', serverStatus: 'Sunucu Durumu',
    balance: 'Bakiye', buy: 'Satın Al', profile: 'Profil Ayarları',
    passwordChange: 'Şifre Değiştir', oldPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre', save: 'Kaydet', selectAvatar: 'Avatar Seç',
    customURL: 'veya URL gir', uploadAvatar: 'Avatar Yükle',
    language: 'Dil', status: 'Durum', online: 'Çevrimiçi', offline: 'Çevrimdışı',
    requests: 'Bekleyen Talepler', complete: 'Tamamlandı', reject: 'Reddet',
    pending: 'Bekliyor', completed: 'Tamamlandı', rejected: 'Reddedildi',
    delete: 'Sil', endDate: 'Bitiş Tarihi', noEndDate: 'Süresiz',
    expired: 'Süresi Doldu',
    notifications: 'Bildirimler',
    enableNotifications: 'Bildirimleri Aç',
    notifyAnnouncements: 'Duyurular',
    notifyNews: 'Haberler',
    notifyCampaigns: 'Kampanyalar',
    notifyItems: 'Yeni Ürünler',
  },
  en: {
    register: 'Register', login: 'Login', logout: 'Logout',
    shop: 'Shop', campaigns: 'Campaigns',
    addAnnouncement: 'Add Announcement', addCampaign: 'Add Campaign',
    addNews: 'Add News', addItem: 'Add Item',
    manageCampaigns: 'Manage Campaigns',
    inventory: 'My Requests', serverStatus: 'Server Status',
    balance: 'Balance', buy: 'Buy', profile: 'Profile Settings',
    passwordChange: 'Change Password', oldPassword: 'Current Password',
    newPassword: 'New Password', save: 'Save', selectAvatar: 'Select Avatar',
    customURL: 'or enter URL', uploadAvatar: 'Upload Avatar',
    language: 'Language', status: 'Status', online: 'Online', offline: 'Offline',
    requests: 'Pending Requests', complete: 'Complete', reject: 'Reject',
    pending: 'Pending', completed: 'Completed', rejected: 'Rejected',
    delete: 'Delete', endDate: 'End Date', noEndDate: 'No End Date',
    expired: 'Expired',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
    notifyAnnouncements: 'Announcements',
    notifyNews: 'News',
    notifyCampaigns: 'Campaigns',
    notifyItems: 'New Items',
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let statusInterval = null;
let notificationPreferences = JSON.parse(localStorage.getItem('notifyPrefs') || '{"announcements":true,"news":true,"campaigns":true,"items":true}');

function t(key) { return translations[currentLang][key] || key; }

function kopyalaIP() {
  navigator.clipboard.writeText('turbolumc.seedloaf.gg').then(() => alert('IP adresi kopyalandı!'));
}

// ========== BİLDİRİM SİSTEMİ ==========
async function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    alert('Tarayıcınız bildirimleri desteklemiyor.');
    return null;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    alert('Bildirim izni verilmedi.');
    return null;
  }

  const registration = await navigator.serviceWorker.register('/sw.js');
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: await urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });

  // Subscription'ı Worker'a kaydet
  const subData = subscription.toJSON();
  await fetch(`${API}/api/notification/subscribe`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscription: subData,
      preferences: notificationPreferences,
      isAdmin: currentUser?.isAdmin || false
    })
  });

  return subscription;
}

async function requestNotificationPermission() {
  if (!token) return alert('Önce giriş yapmalısınız.');
  
  const result = await subscribeToPush();
  if (result) {
    localStorage.setItem('notificationsEnabled', 'true');
    alert('✅ Bildirimler aktif edildi!');
  }
}

function saveNotificationPreferences() {
  notificationPreferences = {
    announcements: document.getElementById('notifyAnnouncements').checked,
    news: document.getElementById('notifyNews').checked,
    campaigns: document.getElementById('notifyCampaigns').checked,
    items: document.getElementById('notifyItems').checked,
  };
  localStorage.setItem('notifyPrefs', JSON.stringify(notificationPreferences));
  
  // Tercihleri sunucuya da bildir
  if (token) {
    fetch(`${API}/api/notification/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ preferences: notificationPreferences })
    });
  }
}

// Sayfa yüklendiğinde service worker'ı kaydet
document.addEventListener('DOMContentLoaded', async () => {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (e) { /* hata olursa sessiz kal */ }
  }

  // Dil
  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) setLang(tr ? 'tr' : 'en');
    else setLang(currentLang);
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

function renderUI() {
  const userArea = document.getElementById('userArea');
  const content = document.getElementById('content');

  if (currentUser) {
    let extraButtons = '';
    if (currentUser.isAdmin) {
      extraButtons = `
        <button onclick="showContent('requests')">📋 ${t('requests')}</button>
        <button onclick="showContent('addAnnouncement')">📢 ${t('addAnnouncement')}</button>
        <button onclick="showContent('addCampaign')">🎯 ${t('addCampaign')}</button>
        <button onclick="showContent('manageCampaigns')">📊 ${t('manageCampaigns')}</button>
        <button onclick="showContent('addNews')">📰 ${t('addNews')}</button>
        <button onclick="showContent('addItem')">🛒 ${t('addItem')}</button>
      `;
    } else {
      extraButtons = `
        <button onclick="showContent('shop')">🛒 ${t('shop')}</button>
        <button onclick="showContent('inventory')">📦 ${t('inventory')}</button>
        <button onclick="showContent('campaigns')">📣 ${t('campaigns')}</button>
      `;
    }

    userArea.innerHTML = `
      ${extraButtons}
      <button onclick="requestNotificationPermission()" title="${t('enableNotifications')}">🔔</button>
      <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-icon" onclick="showContent('profile')" title="${t('profile')}">
      <span style="font-weight:bold">${currentUser.username}</span>
      <button id="logoutBtn">${t('logout')}</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', logout);
  } else {
    userArea.innerHTML = `
      <button id="registerBtn" class="btn-green">${t('register')}</button>
      <button id="loginBtn">${t('login')}</button>
    `;
    document.getElementById('registerBtn').addEventListener('click', () => openAuthModal('register'));
    document.getElementById('loginBtn').addEventListener('click', () => openAuthModal('login'));
  }

  if (!content.innerHTML.trim()) showContent('status');
}

function showContent(section) {
  if (section !== 'status' && statusInterval) {
    clearInterval(statusInterval);
    statusInterval = null;
  }

  switch (section) {
    case 'status': renderStatus(); break;
    case 'shop': renderShop(); break;
    case 'campaigns': renderCampaigns(); break;
    case 'manageCampaigns': renderManageCampaigns(); break;
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

// --- ANA SAYFA ---
async function renderStatus() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div class="glass-card hero-card">
      <h1>
        <i class="fa-solid fa-gamepad"></i> 
        TurboluMC Dünyasına Hoş Geldiniz! 
        <i class="fa-solid fa-gamepad"></i>
      </h1>
      <p>Kesintisiz macera, harika topluluk ve eğlence dolu anlar seni bekliyor.</p>
      <div class="ip-box" onclick="kopyalaIP()">
        <span>turbolumc.seedloaf.gg</span>
        <button class="copy-btn"><i class="fa-regular fa-copy"></i> Kopyala</button>
      </div>
      <p class="click-info">IP adresine tıklayarak kopyalayabilirsin!</p>
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
      const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.seedloaf.gg');
      const data = await res.json();
      const durumEl = document.getElementById('online-durum');
      if (data.online) {
        durumEl.innerHTML = '<span style="color:#22c55e">🟢 Çevrimiçi</span>';
      } else {
        durumEl.innerHTML = '<span style="color:#ef4444">🔴 Çevrimdışı</span>';
      }
      document.getElementById('oyuncu-sayisi').textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
      document.getElementById('sunucu-surum').textContent = data.version || '-';
    } catch (e) {}
  }

  updateStatus();
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(updateStatus, 10000);
}

// --- MARKET (TALEP SİSTEMİ) ---
async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items`).then(r => r.json());
  content.innerHTML = `
    <div class="glass-card">
      <h2>🛒 ${t('shop')}</h2>
      <p style="margin-bottom:1rem; opacity:0.8;">Ürünleri satın alabilir, taleplerinizi "Taleplerim" sekmesinden takip edebilirsiniz.</p>
      ${currentUser ? `<p>${t('balance')}: <strong>${currentUser.balance}</strong> puan</p>` : ''}
      ${items.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0;">
          <div>
            <b>${i.name}</b>
            <p style="font-size:0.85rem; opacity:0.7;">${i.price} puan</p>
          </div>
          <button onclick="buy('${i.id}')">${t('buy')}</button>
        </div>
      `).join('')}
    </div>`;
}

async function buy(itemId) {
  if (!token) return alert('Lütfen giriş yapın.');
  const res = await fetch(`${API}/api/buy`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemId })
  });
  const data = await res.json();
  if (data.error) alert(data.error);
  else {
    alert('✅ Talep alındı! En kısa sürede teslim edilecektir.');
    currentUser.balance = data.new_balance;
    renderShop();
  }
}

// --- TALEPLERİM (KULLANICI) ---
async function renderInventory() {
  const content = document.getElementById('content');
  if (!currentUser) { content.innerHTML = '<p>Lütfen giriş yapın.</p>'; return; }
  const requests = await fetch(`${API}/api/inventory`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  content.innerHTML = `
    <div class="glass-card">
      <h2>📦 ${t('inventory')}</h2>
      ${requests.length === 0 ? '<p>Henüz talebiniz yok.</p>' : requests.map(r => `
        <div style="padding:12px; background:rgba(0,0,0,0.3); border
