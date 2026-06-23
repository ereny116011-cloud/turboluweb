const API = 'https://shrill-salad-a498.ereny116011.workers.dev';

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
function getSystemTheme() { return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'; }

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch(`${API}/api/country`);
    const { tr } = await res.json();
    if (!localStorage.getItem('lang')) setLang(tr ? 'tr' : 'en');
    else setLang(currentLang);
  } catch { setLang(currentLang); }

  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme || getSystemTheme();
  document.body.classList.toggle('light', initialTheme === 'light');
  if (!savedTheme) localStorage.setItem('theme', initialTheme);

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
  const sidebar = document.getElementById('sidebar');
  const content = document.getElementById('content');

  if (currentUser) {
    userArea.innerHTML = `
      <img src="${currentUser.icon || DEFAULT_AVATAR}" class="profile-icon" id="profileIcon" title="${t('profile')}">
      <span style="font-weight:bold">${currentUser.username}</span>
      <button id="logoutBtn">${t('logout')}</button>`;
    document.getElementById('profileIcon').addEventListener('click', () => showContent('profile'));
    document.getElementById('logoutBtn').addEventListener('click', logout);
  } else {
    userArea.innerHTML = `
      <button id="registerBtn" class="btn-green">${t('register')}</button>
      <button id="loginBtn">${t('login')}</button>`;
    document.getElementById('registerBtn').addEventListener('click', () => openAuthModal('register'));
    document.getElementById('loginBtn').addEventListener('click', () => openAuthModal('login'));
  }

  let sidebarHtml = '';
  if (currentUser?.isAdmin) {
    sidebarHtml = `
      <button data-section="addAnnouncement">📢 ${t('addAnnouncement')}</button>
      <button data-section="addCampaign">🎯 ${t('addCampaign')}</button>
      <button data-section="addNews">📰 ${t('addNews')}</button>
      <button data-section="addItem">🛒 ${t('addItem')}</button>
      <button data-section="addTask">📋 ${t('addTask')}</button>`;
  } else {
    sidebarHtml = `
      <button data-section="shop">🛒 ${t('shop')}</button>
      <button data-section="tasks">📋 ${t('tasks')}</button>
      <button data-section="campaigns">📣 ${t('campaigns')}</button>
      <button data-section="inventory">🎒 ${t('inventory')}</button>`;
  }
  sidebar.innerHTML = sidebarHtml;
  sidebar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      sidebar.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showContent(btn.dataset.section);
    });
  });
  if (!content.innerHTML.trim()) showContent('status');
}

function showContent(section) {
  if (section !== 'status' && statusInterval) { clearInterval(statusInterval); statusInterval = null; }
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
  }
}

// --- Sunucu Durumu (aynı) ---
async function renderStatus() {
  const content = document.getElementById('content');
  content.innerHTML = `<div class="status-banner" id="statusBanner">...</div>`; // (öncekiyle aynı, uzun olduğu için kısaltıyorum)
  // ... (renderStatus kodunun tamamı aynı, bir önceki tam dosyadaki gibi)
}

// --- Shop (aynı) ---
async function renderShop() { /* aynı */ }
async function buy(itemId) { /* aynı */ }

// --- Görevler ---
async function renderTasks() {
  const content = document.getElementById('content');
  const tasks = await fetch(`${API}/api/tasks`).then(r => r.json());
  content.innerHTML = `<div class="card"><h2>📋 ${t('tasks')}</h2>${
    tasks.map(task => `
      <div class="item-card">
        <div>
          <b>${task.title}</b>
          <p style="font-size:0.85rem;opacity:0.8">${task.description}</p>
          <small>${t('taskReward')}: ${task.rewardType === 'balance' ? task.rewardAmount + ' puan' : task.rewardCommand}</small>
        </div>
        <button onclick="completeTask('${task.id}')">✅ ${t('complete')}</button>
      </div>
    `).join('')}</div>`;
}

async function completeTask(taskId) {
  if (!token) return alert('Lütfen giriş yapın.');
  const res = await fetch(`${API}/api/tasks/complete`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId })
  });
  const data = await res.json();
  if (data.error) return alert(data.error);
  alert('Görev tamamlandı! Ödülün verildi.');
  currentUser.balance = data.new_balance;
  renderTasks();
}

// --- Kampanyalar (aynı) ---
async function renderCampaigns() { /* aynı */ }

// --- Admin Formları (güncel) ---
function renderAdminForm(type) {
  const content = document.getElementById('content');
  let formHtml = '';
  if (type === 'announcement') { /* aynı */ }
  else if (type === 'campaign') { /* aynı */ }
  else if (type === 'news') { /* aynı */ }
  else if (type === 'item') { /* aynı */ }
  else if (type === 'task') {
    formHtml = `
      <h2>${t('addTask')}</h2>
      <input id="taskTitle" placeholder="Görev başlığı"><br>
      <textarea id="taskDescription" placeholder="Görev açıklaması"></textarea><br>
      <select id="taskRewardType" onchange="toggleRewardFields()">
        <option value="balance">${t('balanceReward')}</option>
        <option value="item">${t('itemReward')}</option>
      </select><br>
      <div id="balanceRewardDiv"><input id="taskRewardAmount" type="number" placeholder="Bakiye miktarı"></div>
      <div id="itemRewardDiv" style="display:none"><input id="taskRewardCommand" placeholder="Komut (örn: give %player% diamond 1)"></div>
      <button onclick="submitAdmin('task')">${t('save')}</button>`;
  }
  content.innerHTML = `<div class="card">${formHtml}</div>`;
}

function toggleRewardFields() {
  const type = document.getElementById('taskRewardType').value;
  document.getElementById('balanceRewardDiv').style.display = type === 'balance' ? 'block' : 'none';
  document.getElementById('itemRewardDiv').style.display = type === 'item' ? 'block' : 'none';
}

async function submitAdmin(type) {
  let endpoint, body;
  if (type === 'announcement') { /* aynı */ }
  else if (type === 'news') { /* aynı */ }
  else if (type === 'campaign') { /* aynı */ }
  else if (type === 'item') { /* aynı */ }
  else if (type === 'task') {
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

// --- Envanter (aynı) ---
async function renderInventory() { /* aynı */ }

// --- Giriş/Kayıt Modal (aynı) ---
function openAuthModal(mode) { /* aynı */ }
async function handleAuth(mode) { /* aynı */ }

// --- Profil (aynı) ---
async function renderProfile() { /* aynı */ }

// --- Yardımcılar (aynı) ---
async function uploadAvatar(event) { /* aynı */ }
function setAvatar(url) { /* aynı */ }
async function changePassword() { /* aynı */ }
async function saveProfileSettings() { /* aynı */ }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function logout() { localStorage.clear(); token = null; currentUser = null; location.reload(); }
function setLang(lang) { currentLang = lang; localStorage.setItem('lang', lang); renderUI(); }
