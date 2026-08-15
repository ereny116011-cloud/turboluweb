const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
const VAPID_PUBLIC_KEY = 'BD3kAyCW2OpZmM7SzNSEeANMtFNDXUiFP3ZDpgOfeRv78S3Igz4qOxZZubXBo1kXaj_9Q53lwKghx0PIIsRsaXk';

const DEFAULT_AVATAR = 'crpr.png';

const translations = {
  tr: {
    register: 'Kaydol', login: 'Giriş Yap', logout: 'Çıkış',
    shop: 'Market', campaigns: 'Kampanyalar',
    announcements: 'Duyurular', news: 'Haberler',
    addAnnouncement: 'Duyuru Yap', addCampaign: 'Kampanya Düzenle',
    addNews: 'Haber Ekle', addItem: 'Ürün Ekle',
    manageCampaigns: 'Kampanyaları Yönet',
    manageAnnouncements: 'Duyuruları Yönet',
    manageNews: 'Haberleri Yönet',
    inventory: 'Taleplerim', serverStatus: 'Sunucu Durumu',
    balance: 'Bakiye', buy: 'Satın Al', profile: 'Profil Ayarları',
    passwordChange: 'Şifre Değiştir', oldPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre', save: 'Kaydet', selectAvatar: 'Avatar Seç',
    customURL: 'veya URL gir', uploadAvatar: 'Avatar Yükle',
    language: 'Dil', status: 'Durum', online: 'Çevrimiçi', offline: 'Çevrimdışı',
    requests: 'Bekleyen Talepler', complete: 'Tamamlandı', reject: 'Reddet',
    pending: 'Bekliyor', completed: 'Tamamlandı', rejected: 'Reddedildi',
    delete: 'Sil', endDate: 'Bitiş Tarihi', noEndDate: 'Süresiz',
    expired: 'Süresi Doldu', notifications: 'Bildirimler',
    enableNotifications: 'Bildirimleri Aç',
  },
  en: {
    register: 'Register', login: 'Login', logout: 'Logout',
    shop: 'Shop', campaigns: 'Campaigns',
    announcements: 'Announcements', news: 'News',
    addAnnouncement: 'Add Announcement', addCampaign: 'Add Campaign',
    addNews: 'Add News', addItem: 'Add Item',
    manageCampaigns: 'Manage Campaigns',
    manageAnnouncements: 'Manage Announcements',
    manageNews: 'Manage News',
    inventory: 'My Requests', serverStatus: 'Server Status',
    balance: 'Balance', buy: 'Buy', profile: 'Profile Settings',
    passwordChange: 'Change Password', oldPassword: 'Current Password',
    newPassword: 'New Password', save: 'Save', selectAvatar: 'Select Avatar',
    customURL: 'or enter URL', uploadAvatar: 'Upload Avatar',
    language: 'Language', status: 'Status', online: 'Online', offline: 'Offline',
    requests: 'Pending Requests', complete: 'Complete', reject: 'Reject',
    pending: 'Pending', completed: 'Completed', rejected: 'Rejected',
    delete: 'Delete', endDate: 'End Date', noEndDate: 'No End Date',
    expired: 'Expired', notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let statusInterval = null;
let notificationPreferences = JSON.parse(localStorage.getItem('notifyPrefs') || '{"announcements":true,"news":true,"campaigns":true,"items":true}');

function t(key) { return translations[currentLang][key] || key; }

function kopyalaIP() {
  navigator.clipboard.writeText('turbolumc.aternos.me');
  const altInfo = document.getElementById('alt-ip-info');
  if (altInfo) {
    altInfo.innerHTML = `
      <p style="margin-top: 12px; font-size: 0.9rem; opacity: 0.9; animation: fadeIn 0.3s ease;">
        ✅ IP Kopyalandı!<br>
        ⚠️ Giremediyseniz alternatif IP: <strong style="color: var(--accent);">turbolu.aternos.me:13795</strong><br>
        ❓ Bağlantı sorunu yaşarsanız admin ile iletişime geçiniz.
      </p>`;
  }
}

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

document.addEventListener('DOMContentLoaded', async () => {
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

function renderUI() {
  const userArea = document.getElementById('userArea');
  const content = document.getElementById('content');

  if (currentUser) {
    let buttons = '';
    if (currentUser.isAdmin) {
      buttons = `
        <button data-section="requests">📋 Talepler</button>
        <button data-section="addAnnouncement">📢 Duyuru</button>
        <button data-section="manageAnnouncements">📋 Duyuru Yönet</button>
        <button data-section="addCampaign">🎯 Kampanya</button>
        <button data-section="manageCampaigns">📊 Kampanya Yönet</button>
        <button data-section="addNews">📰 Haber</button>
        <button data-section="manageNews">📋 Haber Yönet</button>
        <button data-section="addItem">🛒 Ürün Ekle</button>
      `;
    } else {
      buttons = `
        <button data-section="shop">🛒 Market</button>
        <button data-section="inventory">📦 Taleplerim</button>
        <button data-section="campaigns">📣 Kampanyalar</button>
        <button data-section="announcements">📢 Duyurular</button>
        <button data-section="news">📰 Haberler</button>
      `;
    }

    userArea.innerHTML = `
      ${buttons}
      <button id="notifyBtn" title="Bildirim">🔔</button>
      <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-icon" id="profileIcon" title="Profil">
      <span class="username-label">${currentUser.username}</span>
      <button id="logoutBtn">${t('logout')}</button>
    `;

    document.querySelectorAll('#userArea [data-section]').forEach(btn => {
      btn.addEventListener('click', () => showContent(btn.dataset.section));
    });
    document.getElementById('profileIcon').addEventListener('click', () => showContent('profile'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('notifyBtn').addEventListener('click', requestNotificationPermission);
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
      const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me'); const data = await res.json();
      const durumEl = document.getElementById('online-durum');
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
  content.innerHTML = `<div class="glass-card"><h2>🛒 ${t('shop')}</h2>${currentUser ? `<p>${t('balance')}: <strong>${currentUser.balance}</strong> puan</p>` : ''}${items.map(i => `<div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0;"><div><b>${i.name}</b><p style="font-size:0.85rem; opacity:0.7;">${i.price} puan</p></div><button onclick="buy('${i.id}')">${t('buy')}</button></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📦 ${t('inventory')}</h2>${requests.length === 0 ? '<p>Henüz talebiniz yok.</p>' : requests.map(r => `<div style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0; display:flex; justify-content:space-between;"><div><b>${r.item}</b> (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()}</small></div><span style="padding:4px 12px; border-radius:20px; font-size:0.85rem; background:${r.status==='completed'?'#22c55e':r.status==='rejected'?'#ef4444':'#eab308'}">${t(r.status)}</span></div>`).join('')}</div>`;
}

async function renderRequests() {
  if (!currentUser?.isAdmin) return;
  const requests = await fetch(`${API}/api/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  const content = document.getElementById('content');
  content.innerHTML = `<div class="glass-card"><h2>📋 ${t('requests')}</h2>${requests.length===0?'<p>Talep yok.</p>':requests.map(r=>`<div style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0;"><div style="display:flex; justify-content:space-between;"><div><b>${r.user}</b> → ${r.item} (${r.price} puan)<br><small>${new Date(r.date).toLocaleString()}</small></div><div>${r.status==='pending'?`<button onclick="completeRequest('${r.id}')">✅</button><button onclick="rejectRequest('${r.id}')" style="background:rgba(239,68,68,0.8);">❌</button>`:`<span>${t(r.status)}</span>`}</div></div></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📢 ${t('announcements')}</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div class="announcement-item"><h3>${a.title}</h3><p>${a.content}</p><small>${new Date(a.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderNews() {
  const content = document.getElementById('content');
  const news = await fetch(`${API}/api/news`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📰 ${t('news')}</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div class="news-item"><h3>${n.title}</h3><p>${n.content}</p><small>${new Date(n.date).toLocaleString()}</small></div>`).join('')}</div>`;
}

async function renderManageAnnouncements() {
  if (!currentUser?.isAdmin) return;
  const content = document.getElementById('content');
  const announcements = await fetch(`${API}/api/announcements`).then(r => r.json());
  content.innerHTML = `<div class="glass-card"><h2>📋 ${t('manageAnnouncements')}</h2>${announcements.length === 0 ? '<p>Henüz duyuru yok.</p>' : announcements.map(a => `<div style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0; display:flex; justify-content:space-between; align-items:center;"><div><b>${a.title}</b><br><small>${new Date(a.date).toLocaleString()}</small></div><button onclick="deleteAnnouncement('${a.id}')" style="background:rgba(239,68,68,0.8);">🗑️ ${t('delete')}</button></div>`).join('')}</div>`;
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
  content.innerHTML = `<div class="glass-card"><h2>📋 ${t('manageNews')}</h2>${news.length === 0 ? '<p>Henüz haber yok.</p>' : news.map(n => `<div style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0; display:flex; justify-content:space-between; align-items:center;"><div><b>${n.title}</b><br><small>${new Date(n.date).toLocaleString()}</small></div><button onclick="deleteNews('${n.id}')" style="background:rgba(239,68,68,0.8);">🗑️ ${t('delete')}</button></div>`).join('')}</div>`;
}
async function deleteNews(id) {
  if (!confirm('Bu haberi silmek istediğinize emin misiniz?')) return;
  await fetch(`${API}/api/admin/news`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageNews();
}

async function renderCampaigns() {
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📣 ${t('campaigns')}</h2>${campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate)<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0;"><b>${c.title}</b><p>${c.description}</p><p>🎁 ${c.reward}</p><small>${c.endDate?new Date(c.endDate).toLocaleString():t('noEndDate')} ${expired?'⚠️ '+t('expired'):''}</small></div>`}).join('')}</div>`;
}

async function renderManageCampaigns() {
  if (!currentUser?.isAdmin) return;
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  document.getElementById('content').innerHTML = `<div class="glass-card"><h2>📊 ${t('manageCampaigns')}</h2>${campaigns.map(c=>{const expired=c.endDate&&new Date(c.endDate)<now;return`<div class="${expired?'campaign-expired':'campaign-active'}" style="padding:10px; background:rgba(0,0,0,0.3); border-radius:8px; margin:5px 0; display:flex; justify-content:space-between;"><div><b>${c.title}</b><br><small>${c.description} | 🎁 ${c.reward}</small><br><small>📅 ${c.endDate?new Date(c.endDate).toLocaleString():t('noEndDate')} ${expired?'⚠️ '+t('expired'):''}</small></div><button onclick="deleteCampaign('${c.id}')" style="background:rgba(239,68,68,0.8);">🗑️ ${t('delete')}</button></div>`}).join('')}</div>`;
}
async function deleteCampaign(id) {
  if (!confirm('Emin misiniz?')) return;
  await fetch(`${API}/api/admin/campaign`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
  renderManageCampaigns();
}

function renderAdminForm(type) {
  let html = '';
  if (type === 'announcement') html = `<h2>📢 ${t('addAnnouncement')}</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('announcement')">${t('save')}</button>`;
  else if (type === 'campaign') html = `<h2>🎯 ${t('addCampaign')}</h2><input id="title" placeholder="Başlık"><br><input id="description" placeholder="Açıklama"><br><input id="reward" placeholder="Ödül"><br><label>📅 ${t('endDate')}:</label><input id="endDate" type="datetime-local"><br><button onclick="submitAdmin('campaign')">${t('save')}</button>`;
  else if (type === 'news') html = `<h2>📰 ${t('addNews')}</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('news')">${t('save')}</button>`;
  else if (type === 'item') html = `<h2>🛒 ${t('addItem')}</h2><input id="itemName" placeholder="Ürün adı"><br><input id="itemPrice" type="number" placeholder="Fiyat"><br><input id="itemCommand" placeholder="Komut"><br><button onclick="submitAdmin('item')">${t('save')}</button>`;
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
    <h3>${isRegister ? t('register') : t('login')}</h3>
    <input id="authUsername" placeholder="Kullanıcı adı"><br>
    ${isRegister ? `<input id="authEmail" type="email" placeholder="E-posta"><br>` : ''}
    <input id="authPassword" type="password" placeholder="Parola"><br>
    <button class="btn-green" id="authSubmit">${isRegister ? t('register') : t('login')}</button>
    <button id="cancelModal">Vazgeç</button>
    ${!isRegister ? `<p style="margin-top:10px"><a href="#" onclick="openForgotPasswordModal(); return false;">Şifremi unuttum</a></p>` : ''}
  `;
  document.getElementById('authSubmit').addEventListener('click', () => handleAuth(mode));
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
}

function openForgotPasswordModal() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h3>Şifremi Unuttum</h3>
    <input id="forgotEmail" type="email" placeholder="E-posta adresiniz"><br>
    <button class="btn-green" id="forgotSubmit">Gönder</button>
    <button id="cancelForgot">Vazgeç</button>
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
  const icons = await fetch(`${API}/api/icons`).then(r => r.json()).catch(() => []);

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
        <select id="langSelect">
          <option value="tr">Türkçe</option>
          <option value="en">English</option>
        </select>
      </div>

      <div class="profile-field">
        <label>💬 Durum</label>
        <select id="statusSelect">
          <option value="Online">Çevrimiçi</option>
          <option value="Offline">Çevrimdışı</option>
        </select>
      </div>

      <hr style="margin: 1rem 0; border-color: rgba(255,255,255,0.1);">

      <h3>🔒 Şifre Değiştir</h3>
      <div class="profile-field">
        <input id="oldPass" type="password" placeholder="Mevcut şifre">
      </div>
      <div class="profile-field">
        <input id="newPass" type="password" placeholder="Yeni şifre">
      </div>
      <button id="changePassBtn" class="small-btn">Şifreyi Güncelle</button>

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="saveSettingsBtn">Kaydet</button>
        <button id="backBtn" onclick="showContent('status')">← Geri</button>
      </div>
    </div>
  `;

  document.getElementById('langSelect').value = currentUser.language || 'tr';
  document.getElementById('statusSelect').value = currentUser.status || 'Online';

  document.getElementById('changeAvatarBtn').addEventListener('click', () => {
    document.getElementById('avatarUpload').click();
  });

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
    const profileAvatar = document.getElementById('profileAvatar');
    if (profileAvatar) profileAvatar.src = base64;
    const topAvatar = document.querySelector('.user-area .profile-icon');
    if (topAvatar) topAvatar.src = base64;
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
