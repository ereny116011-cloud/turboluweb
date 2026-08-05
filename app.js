const API = 'https://shrill-salad-a498.ereny116011.workers.dev';
const VAPID_PUBLIC_KEY = 'BD3kAyCW2OpZmM7SzNSEeANMtFNDXUiFP3ZDpgOfeRv78S3Igz4qOxZZubXBo1kXaj_9Q53lwKghx0PIIsRsaXk';

const DEFAULT_AVATAR = 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'42\' height=\'42\' viewBox=\'0 0 42 42\'%3E%3Ccircle cx=\'21\' cy=\'21\' r=\'20\' fill=\'%2322c55e\'/%3E%3Ccircle cx=\'14\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Ccircle cx=\'28\' cy=\'16\' r=\'3\' fill=\'%230f172a\'/%3E%3Cpath d=\'M12 26 Q21 32 30 26\' stroke=\'%230f172a\' stroke-width=\'3\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E';

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

// Güncellenmiş kopyalama fonksiyonu
function kopyalaIP() {
  const anaIP = 'turbolumc.aternos.me';
  navigator.clipboard.writeText(anaIP).then(() => {
    alert('✅ IP kopyalandı!\n\n📌 Ana IP: ' + anaIP + '\n⚠️ Giremediyseniz alternatif IP\'yi deneyin:\n🔹 turbolu.aternos.me:13795\n\n❓ Hâlâ bağlanamıyorsanız admin ile iletişime geçiniz.');
  });
}

// ... (bildirim fonksiyonları aynı kalacak) ...

// ========== ANA SAYFA ==========
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
      <p style="margin-top: 10px; font-size: 0.9rem; opacity: 0.8;">
        ⚠️ Giremediyseniz alternatif IP: <strong style="color: var(--accent);">turbolu.aternos.me:13795</strong><br>
        ❓ Bağlantı sorunu yaşarsanız admin ile iletişime geçiniz.
      </p>
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
      // Yeni IP ile sunucu durumu sorgulama
      const res = await fetch('https://api.mcsrvstat.us/2/turbolumc.aternos.me');
      const data = await res.json();
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

// ... (diğer fonksiyonlar aynı kalacak - market, talepler, duyurular, haberler, kampanyalar, admin, profil) ...
// NOT: Yukarıdaki önceki tam app.js dosyasında yer alan diğer tüm fonksiyonlar (renderShop, buy, renderInventory, renderRequests, renderAnnouncements, renderNews, renderManageAnnouncements, deleteAnnouncement, renderManageNews, deleteNews, renderCampaigns, renderManageCampaigns, deleteCampaign, renderAdminForm, submitAdmin, openAuthModal, handleAuth, renderProfile, uploadAvatar, setAvatar, changePassword, saveProfileSettings, closeModal, logout, setLang) AYNEN KORUNACAK.
