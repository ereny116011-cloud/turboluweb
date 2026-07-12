const API = 'https://shrill-salad-a498.ereny116011.workers.dev';

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
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let statusInterval = null;

function t(key) { return translations[currentLang][key] || key; }

function kopyalaIP() {
  navigator.clipboard.writeText('turbolumc.seedloaf.gg').then(() => alert('IP adresi kopyalandı!'));
}

document.addEventListener('DOMContentLoaded', async () => {
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
        <div style="padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b>${r.item}</b> (${r.price} puan)
            <p style="font-size:0.8rem; opacity:0.7;">${new Date(r.date).toLocaleString()}</p>
          </div>
          <span style="padding:4px 12px; border-radius:20px; font-size:0.85rem;
            ${r.status === 'completed' ? 'background:#22c55e;' : ''}
            ${r.status === 'pending' ? 'background:#eab308;' : ''}
            ${r.status === 'rejected' ? 'background:#ef4444;' : ''}
          ">${t(r.status)}</span>
        </div>
      `).join('')}
    </div>`;
}

// --- BEKLEYEN TALEPLER (ADMIN) ---
async function renderRequests() {
  const content = document.getElementById('content');
  if (!currentUser?.isAdmin) { content.innerHTML = '<p>Yetkisiz.</p>'; return; }
  const requests = await fetch(`${API}/api/admin/requests`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  content.innerHTML = `
    <div class="glass-card">
      <h2>📋 ${t('requests')}</h2>
      ${requests.length === 0 ? '<p>Bekleyen talep yok.</p>' : requests.map(r => `
        <div style="padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <b>${r.user}</b> → ${r.item} (${r.price} puan)
              <p style="font-size:0.8rem; opacity:0.7;">${new Date(r.date).toLocaleString()}</p>
              ${r.command ? `<p style="font-size:0.8rem; color: var(--accent);">Komut: ${r.command.replace('%player%', r.user)}</p>` : ''}
            </div>
            <div style="display:flex; gap:8px;">
              ${r.status === 'pending' ? `
                <button onclick="completeRequest('${r.id}')">✅ ${t('complete')}</button>
                <button onclick="rejectRequest('${r.id}')" style="background:rgba(239,68,68,0.8);">❌ ${t('reject')}</button>
              ` : `<span>${t(r.status)}</span>`}
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;
}

async function completeRequest(requestId) {
  const res = await fetch(`${API}/api/admin/complete-request`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (data.success) { alert('Talep tamamlandı.'); renderRequests(); }
  else alert(data.error || 'Hata');
}

async function rejectRequest(requestId) {
  if (!confirm('Reddederseniz bakiye iade edilir. Emin misiniz?')) return;
  const res = await fetch(`${API}/api/admin/reject-request`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId })
  });
  const data = await res.json();
  if (data.success) { alert('Talep reddedildi, bakiye iade edildi.'); renderRequests(); }
  else alert(data.error || 'Hata');
}

// --- KAMPANYALAR (KULLANICI GÖRÜNÜMÜ) ---
async function renderCampaigns() {
  const content = document.getElementById('content');
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  content.innerHTML = `
    <div class="glass-card">
      <h2>📣 ${t('campaigns')}</h2>
      ${campaigns.length === 0 ? '<p>Henüz kampanya yok.</p>' : campaigns.map(c => {
        const expired = c.endDate && new Date(c.endDate) < now;
        return `
          <div class="${expired ? 'campaign-expired' : 'campaign-active'}" style="padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0;">
            <b>${c.title}</b>
            <p style="font-size:0.9rem; opacity:0.8;">${c.description}</p>
            <p style="font-size:0.85rem;">🎁 ${c.reward}</p>
            <p style="font-size:0.8rem; opacity:0.6;">
              ${c.endDate ? new Date(c.endDate).toLocaleString() : t('noEndDate')}
              ${expired ? ` ⚠️ ${t('expired')}` : ''}
            </p>
          </div>`;
      }).join('')}
    </div>`;
}

// --- KAMPANYALARI YÖNET (ADMIN – SİLME VE LİSTELEME) ---
async function renderManageCampaigns() {
  const content = document.getElementById('content');
  if (!currentUser?.isAdmin) { content.innerHTML = '<p>Yetkisiz.</p>'; return; }
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  const now = new Date();
  content.innerHTML = `
    <div class="glass-card">
      <h2>📊 ${t('manageCampaigns')}</h2>
      ${campaigns.length === 0 ? '<p>Henüz kampanya yok.</p>' : campaigns.map(c => {
        const expired = c.endDate && new Date(c.endDate) < now;
        return `
          <div class="${expired ? 'campaign-expired' : 'campaign-active'}" style="padding:12px; background:rgba(0,0,0,0.3); border-radius:8px; margin:8px 0; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <b>${c.title}</b>
              <p style="font-size:0.85rem; opacity:0.8;">${c.description} | 🎁 ${c.reward}</p>
              <p style="font-size:0.8rem; opacity:0.6;">
                📅 ${c.endDate ? new Date(c.endDate).toLocaleString() : t('noEndDate')}
                ${expired ? ` ⚠️ ${t('expired')}` : ''}
              </p>
            </div>
            <button onclick="deleteCampaign('${c.id}')" style="background:rgba(239,68,68,0.8);">🗑️ ${t('delete')}</button>
          </div>`;
      }).join('')}
    </div>`;
}

async function deleteCampaign(id) {
  if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
  const res = await fetch(`${API}/api/admin/campaign`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  const data = await res.json();
  if (data.success) { alert('Kampanya silindi.'); renderManageCampaigns(); }
  else alert(data.error || 'Hata');
}

// --- ADMIN FORMLARI ---
function renderAdminForm(type) {
  const content = document.getElementById('content');
  let formHtml = '';
  if (type === 'announcement') {
    formHtml = `<h2>📢 ${t('addAnnouncement')}</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('announcement')">Gönder</button>`;
  } else if (type === 'campaign') {
    formHtml = `<h2>🎯 ${t('addCampaign')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <input id="description" placeholder="Açıklama"><br>
      <input id="reward" placeholder="Ödül"><br>
      <label style="font-size:0.9rem; margin-bottom:5px;">📅 ${t('endDate')}:</label>
      <input id="endDate" type="datetime-local"><br>
      <button onclick="submitAdmin('campaign')">Gönder</button>`;
  } else if (type === 'news') {
    formHtml = `<h2>📰 ${t('addNews')}</h2><input id="title" placeholder="Başlık"><br><textarea id="content" placeholder="İçerik"></textarea><br><button onclick="submitAdmin('news')">Gönder</button>`;
  } else if (type === 'item') {
    formHtml = `<h2>🛒 ${t('addItem')}</h2><input id="itemName" placeholder="Ürün adı"><br><input id="itemPrice" type="number" placeholder="Fiyat"><br><input id="itemCommand" placeholder="Komut (örn: give %player% diamond 1)"><br><button onclick="submitAdmin('item')">Ekle</button>`;
  }
  content.innerHTML = `<div class="glass-card" style="max-width:600px; margin:2rem auto;">${formHtml}</div>`;
}

async function submitAdmin(type) {
  let endpoint, body;
  if (type === 'announcement') {
    endpoint = 'announcement';
    body = { title: document.getElementById('title').value, content: document.getElementById('content').value };
  } else if (type === 'news') {
    endpoint = 'news';
    body = { title: document.getElementById('title').value, content: document.getElementById('content').value };
  } else if (type === 'campaign') {
    endpoint = 'campaign';
    body = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      reward: document.getElementById('reward').value,
      endDate: document.getElementById('endDate')?.value || null
    };
  } else if (type === 'item') {
    endpoint = 'item';
    body = { name: document.getElementById('itemName').value, price: Number(document.getElementById('itemPrice').value), command: document.getElementById('itemCommand').value };
  }
  const res = await fetch(`${API}/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.success ? 'Başarıyla eklendi' : (data.error || 'Hata'));
}

// --- GİRİŞ / KAYIT ---
function openAuthModal(mode) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <h3>${mode === 'register' ? t('register') : t('login')}</h3>
    <input id="authUsername" placeholder="Kullanıcı adı"><br>
    <input id="authPassword" type="password" placeholder="Parola"><br>
    <button class="btn-green" id="authSubmit">${mode === 'register' ? t('register') : t('login')}</button>
    <button id="cancelModal">Vazgeç</button>
  `;
  document.getElementById('authSubmit').addEventListener('click', () => handleAuth(mode));
  document.getElementById('cancelModal').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
}

async function handleAuth(mode) {
  const username = document.getElementById('authUsername').value.trim();
  const password = document.getElementById('authPassword').value;
  const res = await fetch(`${API}/api/${mode}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
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

// --- PROFİL ---
async function renderProfile() {
  const content = document.getElementById('content');
  const icons = await fetch(`${API}/api/icons`).then(r => r.json()).catch(() => []);
  content.innerHTML = `
    <div class="glass-card" style="max-width:600px; margin:2rem auto;">
      <h2>${t('profile')}</h2>
      <h3>${t('passwordChange')}</h3>
      <input id="oldPass" type="password" placeholder="${t('oldPassword')}"><br>
      <input id="newPass" type="password" placeholder="${t('newPassword')}"><br>
      <button id="changePassBtn">${t('save')}</button>
      <hr style="margin:20px 0; border-color: rgba(255,255,255,0.1);">
      <h3>${t('selectAvatar')}</h3>
      <div id="avatarPool" style="display:flex; flex-wrap:wrap; gap:10px; margin:10px 0;">
        <img src="${DEFAULT_AVATAR}" class="profile-icon" style="cursor:pointer" onclick="setAvatar('${DEFAULT_AVATAR}')" title="Varsayılan">
        ${icons.map(url => `<img src="${url}" class="profile-icon" style="cursor:pointer" onclick="setAvatar('${url}')">`).join('')}
      </div>
      <div class="file-upload" style="margin:10px 0;">
        <label for="avatarUpload" style="background: var(--accent); color: white; padding: 8px 16px; border-radius: 8px; cursor: pointer;">📁 ${t('uploadAvatar')}</label>
        <input type="file" id="avatarUpload" accept="image/*" onchange="uploadAvatar(event)" style="display:none;">
        <span id="uploadStatus"></span>
      </div>
      <input id="customAvatar" placeholder="${t('customURL')}"><br>
      <button id="setAvatarBtn">${t('save')}</button>
      <hr style="margin:20px 0; border-color: rgba(255,255,255,0.1);">
      <label>${t('language')}: <select id="langSelect"><option value="tr">Türkçe</option><option value="en">English</option></select></label>
      <label>${t('status')}: <select id="statusSelect"><option value="Online">${t('online')}</option><option value="Offline">${t('offline')}</option></select></label>
      <div style="margin-top:20px">
        <button id="saveSettingsBtn">${t('save')}</button>
        <button onclick="showContent('status')">← Geri</button>
      </div>
    </div>
  `;
  document.getElementById('langSelect').value = currentUser.language || 'tr';
  document.getElementById('statusSelect').value = currentUser.status || 'Online';
  document.getElementById('changePassBtn').addEventListener('click', changePassword);
  document.getElementById('setAvatarBtn').addEventListener('click', () => {
    const url = document.getElementById('customAvatar').value.trim();
    if (url) setAvatar(url);
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', saveProfileSettings);
}

// --- YARDIMCI FONKSİYONLAR ---
async function uploadAvatar(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    currentUser.icon = base64;
    await fetch(`${API}/api/profile`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: base64 }) });
    document.getElementById('uploadStatus').innerText = '✅ Yüklendi!';
    const pool = document.getElementById('avatarPool');
    const img = document.createElement('img');
    img.src = base64; img.className = 'profile-icon'; img.style.cursor = 'pointer';
    img.onclick = () => setAvatar(base64);
    pool.appendChild(img);
    setAvatar(base64);
  };
  reader.readAsDataURL(file);
}

function setAvatar(url) {
  currentUser.icon = url;
  fetch(`${API}/api/profile`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ icon: url }) }).then(() => renderUI());
  const profileIcon = document.querySelector('.profile-icon');
  if (profileIcon) profileIcon.src = url;
}

async function changePassword() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  const res = await fetch(`${API}/api/password`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }) });
  const data = await res.json();
  alert(data.success ? 'Şifre değiştirildi' : (data.error || 'Hata'));
}

async function saveProfileSettings() {
  const language = document.getElementById('langSelect').value;
  const status = document.getElementById('statusSelect').value;
  const res = await fetch(`${API}/api/profile`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ language, status }) });
  const data = await res.json();
  if (data.success) { currentUser.language = language; currentUser.status = status; setLang(language); renderUI(); showContent('status'); }
  else alert(data.error || 'Hata');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); token = null; currentUser = null; location.reload(); }
function setLang(lang) { currentLang = lang; localStorage.setItem('lang', lang); renderUI(); }
