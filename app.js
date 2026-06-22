// Buraya Cloudflare Worker URL’sini yazacaksın (sonra değiştir)
const API_BASE = 'https://MC-API-ADRESIN.workers.dev'; // <-- DÜZELT

function getToken() { return localStorage.getItem('token'); }
function getUser() { return JSON.parse(localStorage.getItem('user')); }

async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  return await res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + getToken()
    },
    body: JSON.stringify(body)
  });
  return await res.json();
}

function updateBalance(newBalance) {
  const user = getUser();
  if (user) {
    user.balance = newBalance;
    localStorage.setItem('user', JSON.stringify(user));
    const balEl = document.getElementById('balance');
    if (balEl) balEl.innerText = newBalance;
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  if (statusEl) {
    try {
      const status = await apiGet('/api/status');
      statusEl.innerHTML = status.online
        ? `🟢 Açık - ${status.players.online}/${status.players.max} oyuncu`
        : '🔴 Kapalı';
    } catch(e) { statusEl.innerText = 'Durum alınamadı'; }
  }

  const announceEl = document.getElementById('announcements');
  if (announceEl) {
    const announcements = await apiGet('/api/announcements');
    announceEl.innerHTML = announcements.map(a => `<li><b>${a.title}</b>: ${a.content}</li>`).join('');
  }

  const user = getUser();
  const userInfoEl = document.getElementById('userInfo');
  if (userInfoEl && user) {
    userInfoEl.innerText = `Giriş yapıldı: ${user.username} | Bakiye: ${user.balance}`;
  }
  if (user) {
    const balEl = document.getElementById('balance');
    if (balEl) balEl.innerText = user.balance;
  }
});

async function login() {
  const username = document.getElementById('usernameInput').value;
  if (!username) return alert('Kullanıcı adı girin');
  const data = await apiPost('/api/login', { username });
  if (data.error) return alert(data.error);
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data));
  window.location.reload();
}
