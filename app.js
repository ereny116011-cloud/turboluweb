const API_BASE = 'https://turboluweb-api.ereny116011.workers.dev';

// Dil
const translations = {
  tr: {},
  en: {}
};
let currentLang = localStorage.getItem('lang') || 'tr';

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-tr][data-en]').forEach(el => {
    el.textContent = lang === 'tr' ? el.dataset.tr : el.dataset.en;
  });
  document.getElementById('langToggle').textContent = lang === 'tr' ? '🌐 TR' : '🌐 EN';
}

// Tema
function toggleTheme() {
  document.body.classList.toggle('light');
  localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Bildirim
function toggleNotification() {
  if (!('Notification' in window)) return alert('Bildirim desteklenmiyor');
  if (Notification.permission === 'granted') {
    // Kapatmak için tarayıcı ayarlarına yönlendirelim, direkt kapatamayız
    alert('Bildirimleri kapatmak için tarayıcı ayarlarını kullanın.');
  } else if (Notification.permission === 'denied') {
    alert('Bildirim izni reddedilmiş. Tarayıcı ayarlarından sıfırlayın.');
  } else {
    Notification.requestPermission().then(perm => {
      document.getElementById('notifyToggle').textContent = perm === 'granted' ? '🔕' : '🔔';
    });
  }
}

// Giriş (aynı)
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
      'Content-Type':'application/json',
      'Authorization':'Bearer ' + getToken()
    },
    body: JSON.stringify(body)
  });
  return await res.json();
}

window.addEventListener('DOMContentLoaded', () => {
  // Tema yükle
  if (localStorage.getItem('theme') === 'light') document.body.classList.add('light');
  // Dil
  setLang(currentLang);
  // Sunucu durumu
  apiGet('/api/status').then(data => {
    const statusEl = document.getElementById('status');
    if (data.online) {
      statusEl.innerHTML = `🟢 Açık - ${data.players.online}/${data.players.max} oyuncu`;
    } else {
      statusEl.innerHTML = '🔴 Kapalı';
    }
  }).catch(() => {
    document.getElementById('status').textContent = '⚠️ Durum alınamadı';
  });

  // Duyurular
  apiGet('/api/announcements').then(list => {
    document.getElementById('announcements').innerHTML = list.map(a => `<li><b>${a.title}</b>: ${a.content}</li>`).join('');
  });

  // Kullanıcı bilgisi
  const user = getUser();
  if (user) {
    document.getElementById('userInfo').textContent = `Giriş: ${user.username} | Bakiye: ${user.balance}`;
  }
});

async function login() {
  const username = document.getElementById('usernameInput').value;
  const data = await apiPost('/api/login', { username });
  if (data.error) return alert(data.error);
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data));
  location.reload();
}
