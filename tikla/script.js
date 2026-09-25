// ========== TEMA ==========
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.documentElement.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== BUHAR ==========
let steamParticles = [];
let steamCanvas, steamCtx;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d');
  resizeSteamCanvas();
  window.addEventListener('resize', resizeSteamCanvas);

  document.addEventListener('mousemove', (e) => {
    steamParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 15,
      y: e.clientY + (Math.random() - 0.5) * 15,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.4 - Math.random() * 0.5,
      size: 10 + Math.random() * 15,
      life: 0.9,
      decay: 0.02 + Math.random() * 0.015
    });
    if (steamParticles.length > 60) steamParticles.splice(0, steamParticles.length - 60);
  });
  requestAnimationFrame(animateSteam);
}

function resizeSteamCanvas() {
  if (!steamCanvas) return;
  steamCanvas.width = window.innerWidth;
  steamCanvas.height = window.innerHeight;
}

function animateSteam() {
  if (!steamCtx) return;
  steamCtx.clearRect(0, 0, steamCanvas.width, steamCanvas.height);
  const isLight = document.documentElement.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx; p.y += p.vy; p.size += 0.6; p.life -= p.decay;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }
    const alpha = p.life * 0.28;
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }
  requestAnimationFrame(animateSteam);
}

// ========== GALERİ ==========
let galleryImages = [];
let currentImageIndex = 0;
let galleryLoaded = false;

function loadGallery() {
  if (galleryLoaded) return;
  const galleryEl = document.getElementById('gallery');
  if (!galleryEl) return;
  galleryImages = [
    'ss1.png', 'ss2.png', 'ss3.png', 'ss4.png',
    'ss5.png', 'ss6.png', 'ss7.png', 'ss8.png'
  ];
  renderGalleryThumbs();
  updateGalleryImage();
  galleryLoaded = true;
}

function renderGalleryThumbs() {
  const thumbsEl = document.getElementById('galleryThumbs');
  if (!thumbsEl) return;
  thumbsEl.innerHTML = '';
  galleryImages.forEach((src, i) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.alt = `Ekran ${i + 1}`;
    thumb.loading = 'lazy';
    thumb.className = 'thumb';
    if (i === currentImageIndex) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
      currentImageIndex = i;
      updateGalleryImage();
    });
    thumbsEl.appendChild(thumb);
  });
}

function updateGalleryImage() {
  const mainImg = document.getElementById('galleryImage');
  if (!mainImg) return;
  mainImg.style.opacity = '0';
  setTimeout(() => {
    mainImg.src = galleryImages[currentImageIndex];
    mainImg.onload = () => { mainImg.style.opacity = '1'; };
  }, 150);
  document.querySelectorAll('.thumb').forEach((t, i) => {
    t.classList.toggle('active', i === currentImageIndex);
  });
}

// ========== SSS ==========
function toggleFaq(el) {
  const item = el.closest('.faq-item');
  const allFaqs = document.querySelectorAll('.faq-item');
  allFaqs.forEach(f => {
    if (f !== item) f.classList.remove('open');
  });
  item.classList.toggle('open');
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    updateThemeIcon();
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      const isLight = document.documentElement.classList.contains('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      updateThemeIcon();
    });
  }

  initSteam();
  loadGallery();

  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => toggleFaq(q));
  });
});
