const API = 'https://shrill-salad-a498.ereny116011.workers.dev';

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

document.addEventListener('DOMContentLoaded', async () => {
  // Kullanıcı bilgisi
  const token = localStorage.getItem('token');
  const userArea = document.getElementById('userArea');

  if (token) {
    try {
      const res = await fetch(`${API}/api/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      userArea.innerHTML = `
        <a href="profil" class="profile-link">
          <img src="${data.icon || 'crpr.png'}" class="profile-icon" alt="Profil">
          <span class="username-label">${data.username}</span>
        </a>
        <button onclick="logout()" class="logout-btn">Çıkış</button>
      `;
    } catch (e) {
      logout();
    }
  } else {
    userArea.innerHTML = `
      <a href="login.html" class="btn-green">Giriş Yap</a>
      <a href="register.html" class="btn">Kaydol</a>
    `;
  }

  // Sunucu durumu (sadece ana sayfada varsa)
  const onlineDurum = document.getElementById('online-durum');
  if (onlineDurum) {
    async function updateStatus() {
      try {
        const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me');
        const data = await res.json();
        onlineDurum.innerHTML = data.online ? '<span style="color:#22c55e">🟢 Çevrimiçi</span>' : '<span style="color:#ef4444">🔴 Çevrimdışı</span>';
        document.getElementById('oyuncu-sayisi').textContent = `${data.players?.online ?? 0} / ${data.players?.max ?? 0}`;
        document.getElementById('sunucu-surum').textContent = data.version || '-';
      } catch (e) {}
    }
    updateStatus();
    setInterval(updateStatus, 10000);
  }
});

function logout() {
  localStorage.clear();
  window.location.reload();
}
