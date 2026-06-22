const API = 'https://shrill-salad-a498.ereny116011.workers.dev'; // API Worker adresin

// Çeviriler
const translations = {
  tr: {
    register: 'Kaydol',
    login: 'Giriş Yap',
    logout: 'Çıkış',
    shop: 'Market',
    campaigns: 'Kampanyalar',
    addAnnouncement: 'Duyuru Yap',
    addCampaign: 'Kampanya Düzenle',
    addNews: 'Haber Ekle',
    serverStatus: 'Sunucu Durumu',
    balance: 'Bakiye',
    buy: 'Satın Al',
    profile: 'Profil Ayarları',
    passwordChange: 'Şifre Değiştir',
    oldPassword: 'Mevcut Şifre',
    newPassword: 'Yeni Şifre',
    save: 'Kaydet',
    selectAvatar: 'Avatar Seç',
    customURL: 'veya URL gir',
    theme: 'Tema',
    dark: 'Koyu',
    light: 'Açık',
    language: 'Dil',
    status: 'Durum',
    online: 'Çevrimiçi',
    offline: 'Çevrimdışı',
  },
  en: {
    register: 'Register',
    login: 'Login',
    logout: 'Logout',
    shop: 'Shop',
    campaigns: 'Campaigns',
    addAnnouncement: 'Add Announcement',
    addCampaign: 'Add Campaign',
    addNews: 'Add News',
    serverStatus: 'Server Status',
    balance: 'Balance',
    buy: 'Buy',
    profile: 'Profile Settings',
    passwordChange: 'Change Password',
    oldPassword: 'Current Password',
    newPassword: 'New Password',
    save: 'Save',
    selectAvatar: 'Select Avatar',
    customURL: 'or enter URL',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    language: 'Language',
    status: 'Status',
    online: 'Online',
    offline: 'Offline',
  }
};

let currentLang = localStorage.getItem('lang') || 'tr';
let currentUser = null;
let token = localStorage.getItem('token') || null;

function t(key) { return translations[currentLang][key] || key; }

function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) {
      setLang(tr ? 'tr' : 'en');
    } else {
      setLang(currentLang);
    }
  } catch { setLang(currentLang); }

  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || getSystemTheme();
  document.body.classList.toggle('light', initialTheme === 'light');
  if (!savedTheme) {
    localStorage.setItem('theme', initialTheme);
  }

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
    } catch (e) {
      logout();
    }
  }
  renderUI();
});

function renderUI() {
  const userArea = document.getElementById('userArea');
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');

  if (currentUser) {
    userArea.innerHTML = `
      <img src="${currentUser.icon || 'https://via.placeholder.com/38/22c55e/fff?text=?'}" class="profile-icon" id="profileIcon" title="${t('profile')}">
      <span style="font-weight:bold">${currentUser.username}</span>
      <button id="logoutBtn">${t('logout')}</button>
    `;
    document.getElementById('profileIcon').addEventListener('click', openProfileModal);
    document.getElementById('logoutBtn').addEventListener('click', logout);
  } else {
    userArea.innerHTML = `
      <button id="registerBtn" class="btn-green">${t('register')}</button>
      <button id="loginBtn">${t('login')}</button>
    `;
    document.getElementById('registerBtn').addEventListener('click', () => openAuthModal('register'));
    document.getElementById('loginBtn').addEventListener('click', () => openAuthModal('login'));
  }

  let sidebarHtml = '';
  if (currentUser?.isAdmin) {
    sidebarHtml = `
      <button onclick="showContent('addAnnouncement')">📢 ${t('addAnnouncement')}</button>
      <button onclick="showContent('addCampaign')">🎯 ${t('addCampaign')}</button>
      <button onclick="showContent('addNews')">📰 ${t('addNews')}</button>
    `;
  } else {
    sidebarHtml = `
      <button onclick="showContent('shop')">🛒 ${t('shop')}</button>
      <button onclick="showContent('campaigns')">📣 ${t('campaigns')}</button>
    `;
  }
  sidebar.innerHTML = sidebarHtml;
  if (!content.innerHTML.trim()) showContent('status');
}

function showContent(section) {
  const content = document.getElementById('content');
  switch (section) {
    case 'status': renderStatus(); break;
    case 'shop': renderShop(); break;
    case 'campaigns': renderCampaigns(); break;
    case 'addAnnouncement': renderAdminForm('announcement'); break;
    case 'addCampaign': renderAdminForm('campaign'); break;
    case 'addNews': renderAdminForm('news'); break;
  }
}

async function renderStatus() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="card"><h2>${t('serverStatus')}</h2><p id="statusWidget">⏳</p></div>`;
  try {
    const res = await fetch(`${API}/api/status`);
    const data = await res.json();
    document.getElementById('statusWidget').innerHTML = data.online
      ? `🟢 Açık - ${data.players.online}/${data.players.max} oyuncu`
      : '🔴 Kapalı';
  } catch { document.getElementById('statusWidget').innerText = '⚠️ Veri alınamadı'; }
}

async function renderShop() {
  const content = document.getElementById('content');
  const items = await fetch(`${API}/api/items`).then(r => r.json());
  content.innerHTML = `
    <div class="card">
      <h2>${t('shop')}</h2>
      ${currentUser ? `<p>${t('balance')}: ${currentUser.balance}</p>` : ''}
      ${items.map(i => `
        <div style="margin:10px 0">
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

async function renderCampaigns() {
  const content = document.getElementById('content');
  const campaigns = await fetch(`${API}/api/campaigns`).then(r => r.json());
  content.innerHTML = `<div class="card"><h2>${t('campaigns')}</h2>${
    campaigns.map(c => `<p><b>${c.title}</b>: ${c.description} (Ödül: ${c.reward})</p>`).join('')
  }</div>`;
}

function renderAdminForm(type) {
  const content = document.getElementById('content');
  let formHtml = '';
  if (type === 'announcement') {
    formHtml = `
      <h2>${t('addAnnouncement')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <textarea id="content" placeholder="İçerik"></textarea><br>
      <button onclick="submitAdmin('announcement')">Gönder</button>`;
  } else if (type === 'campaign') {
    formHtml = `
      <h2>${t('addCampaign')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <input id="description" placeholder="Açıklama"><br>
      <input id="reward" placeholder="Ödül"><br>
      <button onclick="submitAdmin('campaign')">Gönder</button>`;
  } else if (type === 'news') {
    formHtml = `
      <h2>${t('addNews')}</h2>
      <input id="title" placeholder="Başlık"><br>
      <textarea id="content" placeholder="İçerik"></textarea><br>
      <button onclick="submitAdmin('news')">Gönder</button>`;
  }
  content.innerHTML = `<div class="card">${formHtml}</div>`;
}

async function submitAdmin(type) {
  const title = document.getElementById('title')?.value;
  const content = document.getElementById('content')?.value;
  const description = document.getElementById('description')?.value;
  const reward = document.getElementById('reward')?.value;

  let endpoint, body;
  if (type === 'announcement') { endpoint = 'announcement'; body = { title, content }; }
  else if (type === 'news') { endpoint = 'news'; body = { title, content }; }
  else if (type === 'campaign') { endpoint = 'campaign'; body = { title, description, reward }; }

  const res = await fetch(`${API}/api/admin/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  alert(data.success ? 'Başarıyla eklendi' : (data.error || 'Hata'));
}

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

async function openProfileModal() {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modalBody');
  const icons = await fetch(`${API}/api/icons`).then(r => r.json()).catch(() => []);
  body.innerHTML = `
    <h3>${t('profile')}</h3>
    <h4>${t('passwordChange')}</h4>
    <input id="oldPass" type="password" placeholder="${t('oldPassword')}"><br>
    <input id="newPass" type="password" placeholder="${t('newPassword')}"><br>
    <button id="changePassBtn">${t('save')}</button>
    <hr>
    <h4>${t('selectAvatar')}</h4>
    <div id="avatarPool" style="display:flex;flex-wrap:wrap;gap:8px;margin:10px 0">
      ${icons.map(url => `<img src="${url}" class="profile-icon" style="cursor:pointer" onclick="setAvatar('${url}')">`).join('')}
    </div>
    <input id="customAvatar" placeholder="${t('customURL')}"><br>
    <button id="setAvatarBtn">${t('save')}</button>
    <hr>
    <label>${t('theme')}: <select id="themeSelect"><option value="dark">${t('dark')}</option><option value="light">${t('light')}</option></select></label>
    <label>${t('language')}: <select id="langSelect"><option value="tr">Türkçe</option><option value="en">English</option></select></label>
    <label>${t('status')}: <select id="statusSelect"><option value="Online">${t('online')}</option><option value="Offline">${t('offline')}</option></select></label>
    <br><button id="saveSettingsBtn">${t('save')}</button>
    <button id="closeProfileBtn">Kapat</button>
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
  document.getElementById('closeProfileBtn').addEventListener('click', closeModal);
  modal.classList.remove('hidden');
}

function setAvatar(url) {
  currentUser.icon = url;
  fetch(`${API}/api/profile`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ icon: url })
  }).then(() => { renderUI(); closeModal(); });
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
    closeModal();
  } else alert(data.error || 'Hata');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); token = null; currentUser = null; location.reload(); }
function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  renderUI();
}
