const API = 'https://shrill-salad-a498.ereny116011.workers.dev';

// Varsayılan profil resmi (gülen yüz SVG)
const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'42\' height=\'42\' viewBox=\'0 0 42 42\'%3E%3Ccircle cx=\'21\' cy=\'21\' r=\'20\' fill=\'%2322c55e\'/%3E%3Ccircle cx=\'14\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Ccircle cx=\'28\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Cpath d=\'M12 26 Q21 32 30 26\' stroke=\'%230f172a\' stroke-width=\'3\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E';

const translations = {
  tr: {
    register: 'Kaydol', login: 'Giriş Yap', logout: 'Çıkış',
    shop: 'Market', campaigns: 'Kampanyalar', tasks: 'Görevler',
    addAnnouncement: 'Duyuru Yap', addCampaign: 'Kampanya Düzenle',
    addNews: 'Haber Ekle', addItem: 'Ürün Ekle', addTask: 'Görev Ekle',
    inventory: 'Envanter', serverStatus: 'Sunucu Durumu',
    balance: 'Bakiye', buy: 'Satın Al', profile: 'Profil Ayarları',
    passwordChange: 'Şifre Değiştir', oldPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre', save: 'Kaydet', selectAvatar: 'Avatar Seç',
    customURL: 'veya URL gir', uploadAvatar: 'Avatar Yükle',
    theme: 'Tema', dark: 'Koyu', light: 'Açık', language: 'Dil',
    status: 'Durum', online: 'Çevrimiçi', offline: 'Çevrimdışı',
    complete: 'Tamamlandı', taskReward: 'Ödül', balanceReward: 'Bakiye',
    itemReward: 'Eşya',
  },
  en: {
    register: 'Register', login: 'Login', logout: 'Logout',
    shop: 'Shop', campaigns: 'Campaigns', tasks: 'Tasks',
    addAnnouncement: 'Add Announcement', addCampaign: 'Add Campaign',
    addNews: 'Add News', addItem: 'Add Item', addTask: 'Add Task',
    inventory: 'Inventory', serverStatus: 'Server Status',
    balance: 'Balance', buy: 'Buy', profile: 'Profile Settings',
    passwordChange: 'Change Password', oldPassword: 'Current Password',
    newPassword: 'New Password', save: 'Save', selectAvatar: 'Select Avatar',
    customURL: 'or enter URL', uploadAvatar: 'Upload Avatar',
    theme: 'Theme', dark: 'Dark', light: 'Light', language: 'Language',
    status: 'Status', online: 'Online', offline: 'Offline',
    complete: 'Complete', taskReward: 'Reward', balanceReward: 'Balance',
    itemReward: 'Item',
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;
let statusInterval = null;

function t(key) { return translations[currentLang][key] || key; }

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// IP kopyalama
function kopyalaIP() {
  navigator.clipboard.writeText('turbolu.mcsh.io').then(() => {
    alert('IP adresi kopyalandı!');
  });
}

// Navbar kaydırma yardımcısı
function handleNavClick(targetId) {
  if (!document.getElementById(targetId)) {
    showContent('status');
    setTimeout(() => {
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  } else {
    document.getElementById(targetId).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Dil
  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) {
      setLang(tr ? 'tr' : 'en');
    } else {
      setLang(currentLang);
    }
  } catch { setLang(currentLang); }

  // Tema
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || getSystemTheme();
  document.body.classList.toggle('light', initialTheme === 'light');
  if (!savedTheme) localStorage.setItem('theme', initialTheme);

  // Oturum
  if (token) {
    try {
      const res = await fetch(`${API}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      currentUser = data;
      if (currentUser.theme) {
        document.body.classList.toggle('light', currentUser.theme === 'light');
        localStorage.setItem('theme', currentUser.theme);
      }
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
        <button onclick="showContent('addAnnouncement')">📢 Duyuru</button>
        <button onclick="showContent('addCampaign')">🎯 Kampanya</button>
        <button onclick="showContent('addNews')">📰 Haber</button>
        <button onclick="showContent('addItem')">🛒 Ürün</button>
        <button onclick="showContent('addTask')">📋 Görev</button>
      `;
    } else {
      extraButtons = `
        <button onclick="showContent('shop')">🛒 ${t('shop')}</button>
        <button onclick="showContent('tasks')">📋 ${t('tasks')}</button>
        <button onclick="showContent('inventory')">🎒 ${t('inventory')}</button>
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
    case 'tasks': renderTasks(); break;
    case 'campaigns': renderCampaigns(); break;
    case 'addAnnouncement': renderAdminForm('announcement'); break;
    case 'addCampaign': renderAdminForm('campaign'); break;
    case 'addNews': renderAdminForm('news'); break;
    case 'addItem': renderAdminForm('item'); break;
    case 'addTask': renderAdminForm('task'); break;
    case 'inventory': renderInventory(); break;
    case 'profile': renderProfile(); break;
    default: renderStatus();
  }
}

// ---------- ANA SAYFA ----------
async function renderStatus() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <header class="hero">
      <div class="hero-content">
        <h1>TurboluMC Dünyasına Hoş Geldiniz!</h1>
        <p>Kesintisiz macera, harika topluluk ve eğlence dolu anlar seni bekliyor.</p>
        <div class="ip-box" onclick="kopyalaIP()">
          <span>turbolu.mcsh.io</span>
          <button class="copy-btn"><i class="fa-regular fa-copy"></i> Kopyala</button>
        </div>
        <p class="click-info">IP adresine tıklayarak kopyalayabilirsin!</p>
      </div>
    </header>

    <section id="features" class="features">
      <h2>Neden Biz?</h2>
      <div class="feature-cards">
        <div class="card"><i class="fa-solid fa-bolt icon"></i><h3>Yüksek Performans</h3><p>Lag yok, donma yok.</p></div>
        <div class="card"><i class="fa-solid fa-shield-halved icon"></i><h3>Adil Oyun</h3><p>Hileye karşı sıfır tolerans.</p></div>
        <div class="card"><i class="fa-solid fa-users icon"></i><h3>Harika Topluluk</h3><p>Aktif yönetim ve dost oyuncular.</p></div>
      </div>
    </section>

    <section id="durum" class="status-section">
      <h2>Anlık Sunucu Durumu</h2>
      <div class="status-card">
        <div class="status-info">
          <p><strong>Durum:</strong> <span id="online-durum"><i class="fa-solid fa-circle-notch fa-spin"></i> Kontrol ediliyor...</span></p>
          <p><strong>Çevrimiçi Oyuncular:</strong> <span id="oyuncu-sayisi">- / -</span></p>
          <p><strong>Sürüm:</strong> <span id="sunucu-surum">-</span></p>
        </div>
      </div>
    </section>

    <footer class="footer">
      <p>&copy; 2026 Eren Yılmaz - TurboluMC. Tüm Hakları Saklıdır.</p>
      <p class="license-text">Bu proje GNU General Public License v3.0 ile korunmaktadır.</p>
    </footer>
  `;

  async function updateStatus() {
    try {
      const res = await fetch('https://api.mcsrvstat.us/2/144.31.46.15:12443');
      const data = await res.json();
      const durumEl = document.getElementById('online-durum');
      if (data.online) {
        durumEl.innerHTML = '<span style="color:#22c55e">🟢 Çevrimiçi</span>';
      } else {
        durumEl.innerHTML = '<span style="color:#ef4444">🔴 Çevrimdışı</span>';
      }
      document.getElementById('oyuncu-sayisi').textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
      document.getElementById('sunucu-surum').textContent = data.version || '-';
    } catch (e) { /* hata durumunda dokunma */ }
  }

  updateStatus();
  if (statusInterval) clearInterval(statusInterval);
  statusInterval = setInterval(updateStatus, 10000);
}

// ---------- MARKET ----------
async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items`).then(r => r.json());
  content.innerHTML = `
    <div class="card" style="max-width:800px; margin:2rem auto;">
      <h2>🛒 ${t('shop')}</h2>
      ${currentUser ? `<p>${t('balance')}: ${currentUser.balance}</p>` : ''}
      ${items.map(i => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg); border-radius:8px; margin:8px 0;">
          <b>${i.name}</b> - ${i.price} puan
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
    alert('Satın alındı!');
    currentUser.balance = data.new_balance;
    renderShop();
  }
}

// ---------- GÖREVLER ----------
async function renderTasks() {
  const content = document.getElementById('content');
  if (!currentUser) {
    content.innerHTML = '<p>Lütfen giriş yapın.</p>'; return;
  }
  const tasks = await fetch(`${API}/api/tasks`).then(r => r.json());
  content.innerHTML = `
    <div class="card" style="max-width:800px; margin:2rem auto;">
      <h2>📋 ${t('tasks')}</h2>
      ${tasks.map(task => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:var(--bg); border-radius:8px; margin:8px 0;">
          <div>
            <b>${task.title}</b>
            <p style="font-size:0.85rem; opacity:0.8">${task.description}</p>
            <small>${t('taskReward')}: ${task.rewardType === 'balance' ? task.rewardAmount + ' puan' : task.rewardCommand}</small>
          </div>
          <button onclick="completeTask('${task.id}')">✅ ${t('complete')}</button>
        </div>
      `).join('')}
    </div>`;
}

async function completeTask(taskId) {
  if (!token) return alert('Giriş yapın.');
  const res = await fetch(`${API}/api/tasks/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId })
  });
  const data = await res.json();
  if (data.error) alert(data.error);
  else {
    alert('Görev tamamlandı!');
    currentUser.balance = data.new_balance;
    renderTasks();
  }
}

// ---------- ENVANTER ----------
async function renderInventory() {
  const content = document.getElementById('content');
  if (!currentUser) return;
  const items = await fetch(`${API}/api/inventory`, { headers: { 'Authorization': `Bearer ${token}` } }).then(r => r.json());
  content.innerHTML = `
    <div class="card" style="max-width:800px; margin:2rem auto;">
      <h2>🎒 ${t('inventory')}</h2>
      ${items.length === 0 ? '<p>Henüz eşya yok.</p>' : items.map(i => `
        <div style="padding:10px; background:var(--bg); border-radius:8px; margin:5px 0;">
          <b>${i.name}</b>
          <p style="font-size:0.8rem; opacity:0.7">${new Date(i.purchasedAt).toLocaleString()}</p>
        </div>
      `).join('')}
    </div>`;
}

// ---------- KAMPANYALAR ----------
async function renderCampaigns() {
  const content = document.getElementById('content');
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  content.innerHTML = `
    <div class="card" style="max-width:800px; margin:2rem auto;">
      <h2>📣 ${t('campaigns')}</h2>
      ${campaigns.map(c => `<p><b>${c.title}</b>: ${c.description} (Ödül: ${c.reward})</p>`).join('')}
    </div>`;
}

// ---------- ADMIN FORMLARI ----------
function renderAdminForm(type) {
  const content = document.getElementById('content');
  let formHtml = '';
  if (type === 'announcement') {
    formHtml = `
      <h2>📢 ${t('addAnnouncement')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <textarea id="content" placeholder="İçerik"></textarea><br>
      <button onclick="submitAdmin('announcement')">Gönder</button>`;
  } else if (type === 'campaign') {
    formHtml = `
      <h2>🎯 ${t('addCampaign')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <input id="description" placeholder="Açıklama"><br>
      <input id="reward" placeholder="Ödül"><br>
      <button onclick="submitAdmin('campaign')">Gönder</button>`;
  } else if (type === 'news') {
    formHtml = `
      <h2>📰 ${t('addNews')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <textarea id="content" placeholder="İçerik"></textarea><br>
      <button onclick="submitAdmin('news')">Gönder</button>`;
  } else if (type === 'item') {
    formHtml = `
      <h2>🛒 ${t('addItem')}</h2>
      <input id="itemName" placeholder="Ürün adı"><br>
      <input id="itemPrice" type="number" placeholder="Fiyat"><br>
      <input id="itemCommand" placeholder="Komut (örn: give %player% diamond 1)"><br>
      <button onclick="submitAdmin('item')">Ekle</button>`;
  } else if (type === 'task') {
    formHtml = `
      <h2>📋 ${t('addTask')}</h2>
      <input id="taskTitle" placeholder="Görev başlığı"><br>
      <textarea id="taskDescription" placeholder="Açıklama"></textarea><br>
      <select id="taskRewardType" onchange="toggleRewardFields()">
        <option value="balance">${t('balanceReward')}</option>
        <option value="item">${t('itemReward')}</option>
      </select><br>
      <div id="balanceRewardDiv"><input id="taskRewardAmount" type="number" placeholder="Bakiye miktarı"></div>
      <div id="itemRewardDiv" style="display:none"><input id="taskRewardCommand" placeholder="Komut"></div>
      <button onclick="submitAdmin('task')">Ekle</button>`;
  }
  content.innerHTML = `<div class="card" style="max-width:600px; margin:2rem auto;">${formHtml}</div>`;
}

function toggleRewardFields() {
  const type = document.getElementById('taskRewardType').value;
  document.getElementById('balanceRewardDiv').style.display = type === 'balance' ? 'block' : 'none';
  document.getElementById('itemRewardDiv').style.display = type === 'item' ? 'block' : 'none';
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
    body = { title: document.getElementById('title').value, description: document.getElementById('description').value, reward: document.getElementById('reward').value };
  } else if (type === 'item') {
    endpoint = 'item';
    body = { name: document.getElementById('itemName').value, price: Number(document.getElementById('itemPrice').value), command: document.getElementById('itemCommand').value };
  } else if (type === 'task') {
    endpoint = 'task';
    body = {
      title: document.getElementById('taskTitle').value,
      description: document.getElementById('taskDescription').value,
      rewardType: document.getElementById('taskRewardType').value,
      rewardAmount: Number(document.getElementById('taskRewardAmount')?.value || 0),
      rewardCommand: document.getElementById('taskRewardCommand')?.value || ''
    };
  }
  const res = await fetch(`${API}/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.success ? 'Başarıyla eklendi' : (data.error || 'Hata'));
}

// ---------- GİRİŞ / KAYIT MODAL ----------
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

// ---------- PROFİL ----------
async function renderProfile() {
  const content = document.getElementById('content');
  const icons = await fetch(`${API}/api/icons`).then(r => r.json()).catch(() => []);
  content.innerHTML = `
    <div class="card" style="max-width:600px; margin:2rem auto;">
      <h2>${t('profile')}</h2>
      <h3>${t('passwordChange')}</h3>
      <input id="oldPass" type="password" placeholder="${t('oldPassword')}"><br>
      <input id="newPass" type="password" placeholder="${t('newPassword')}"><br>
      <button id="changePassBtn">${t('save')}</button>

      <hr>
      <h3>${t('selectAvatar')}</h3>
      <div id="avatarPool" style="display:flex; flex-wrap:wrap; gap:10px; margin:10px 0;">
        <img src="${DEFAULT_AVATAR}" class="profile-icon" style="cursor:pointer" onclick="setAvatar('${DEFAULT_AVATAR}')" title="Varsayılan">
        ${icons.map(url => `<img src="${url}" class="profile-icon" style="cursor:pointer" onclick="setAvatar('${url}')">`).join('')}
      </div>
      <div class="file-upload">
        <label for="avatarUpload">📁 ${t('uploadAvatar')}</label>
        <input type="file" id="avatarUpload" accept="image/*" onchange="uploadAvatar(event)">
        <span id="uploadStatus"></span>
      </div>
      <input id="customAvatar" placeholder="${t('customURL')}"><br>
      <button id="setAvatarBtn">${t('save')}</button>

      <hr>
      <label>${t('theme')}: <select id="themeSelect"><option value="dark">${t('dark')}</option><option value="light">${t('light')}</option></select></label>
      <label>${t('language')}: <select id="langSelect"><option value="tr">Türkçe</option><option value="en">English</option></select></label>
      <label>${t('status')}: <select id="statusSelect"><option value="Online">${t('online')}</option><option value="Offline">${t('offline')}</option></select></label>
      <div style="margin-top:20px">
        <button id="saveSettingsBtn">${t('save')}</button>
        <button onclick="showContent('status')">← Geri</button>
      </div>
    </div>
  `;

  document.getElementById('themeSelect').value = currentUser.theme || 'dark';
  document.getElementById('langSelect').value = currentUser.language || 'tr';
  document.getElementById('statusSelect').value = currentUser.status || 'Online';
  document.getElementById('changePassBtn').addEventListener('click', changePassword);
  document.getElementById('setAvatarBtn').addEventListener('click', () => {
    const url = document.getElementById('customAvatar').value.trim();
    if (url) setAvatar(url);
  });
  document.getElementById('saveSettingsBtn').addEventListener('click', saveProfileSettings);
}

// ---------- YARDIMCI FONKSİYONLAR ----------
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
    document.getElementById('uploadStatus').innerText = '✅ Yüklendi!';
    const pool = document.getElementById('avatarPool');
    const img = document.createElement('img');
    img.src = base64;
    img.className = 'profile-icon';
    img.style.cursor = 'pointer';
    img.onclick = () => setAvatar(base64);
    pool.appendChild(img);
    setAvatar(base64);
  };
  reader.readAsDataURL(file);
}

function setAvatar(url) {
  currentUser.icon = url;
  fetch(`${API}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ icon: url })
  }).then(() => renderUI());
  const profileIcon = document.querySelector('.profile-icon');
  if (profileIcon) profileIcon.src = url;
}

async function changePassword() {
  const oldPass = document.getElementById('oldPass').value;
  const newPass = document.getElementById('newPass').value;
  const res = await fetch(`${API}/api/password`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
  });
  const data = await res.json();
  alert(data.success ? 'Şifre değiştirildi' : (data.error || 'Hata'));
}

async function saveProfileSettings() {
  const theme = document.getElementById('themeSelect').value;
  const language = document.getElementById('langSelect').value;
  const status = document.getElementById('statusSelect').value;
  const res = await fetch(`${API}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ theme, language, status })
  });
  const data = await res.json();
  if (data.success) {
    currentUser.theme = theme;
    currentUser.language = language;
    currentUser.status = status;
    document.body.classList.toggle('light', theme === 'light');
    localStorage.setItem('theme', theme);
    setLang(language);
    renderUI();
    showContent('status');
  } else alert(data.error || 'Hata');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); token = null; currentUser = null; location.reload(); }
function setLang(lang) { currentLang = lang; localStorage.setItem('lang', lang); renderUI(); }
