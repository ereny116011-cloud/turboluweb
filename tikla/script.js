// ========== TEMA ==========
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.documentElement.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== BUHAR (KÜÇÜK) ==========
const MAX_PARTICLES = 60;
const MAX_PARTICLES_POOL = 80;
let steamParticles = [];
let steamCanvas, steamCtx;
let steamRAF = null;
let steamLastTime = 0;
let steamLastMouseTime = 0;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!steamCtx) return;

  resizeSteamCanvas();

  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - steamLastMouseTime < 16) return;
    steamLastMouseTime = now;

    if (steamParticles.length >= MAX_PARTICLES_POOL) steamParticles.shift();
    steamParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 10,
      y: e.clientY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.4 - Math.random() * 0.5,
      size: 5 + Math.random() * 9,
      life: 0.9,
      decay: 0.024 + Math.random() * 0.014
    });
    if (steamParticles.length > MAX_PARTICLES) {
      steamParticles.splice(0, steamParticles.length - MAX_PARTICLES);
    }
    startSteamLoop();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (steamRAF) { cancelAnimationFrame(steamRAF); steamRAF = null; }
    } else if (steamParticles.length > 0) {
      startSteamLoop();
    }
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeSteamCanvas, 150);
  }, { passive: true });
}

function startSteamLoop() {
  if (steamRAF || document.hidden) return;
  steamLastTime = performance.now();
  steamRAF = requestAnimationFrame(animateSteam);
}

function resizeSteamCanvas() {
  if (!steamCanvas) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  steamCanvas.width = window.innerWidth * dpr;
  steamCanvas.height = window.innerHeight * dpr;
  steamCanvas.style.width = window.innerWidth + 'px';
  steamCanvas.style.height = window.innerHeight + 'px';
  steamCtx.setTransform(1, 0, 0, 1, 0, 0);
  steamCtx.scale(dpr, dpr);
}

function animateSteam(now) {
  if (!steamCtx) { steamRAF = null; return; }
  const dt = Math.min((now - steamLastTime) / 16.67, 3);
  steamLastTime = now;

  steamCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  const isLight = document.documentElement.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.size += 0.5 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }
    const alpha = p.life * 0.28;
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${color}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }

  if (steamParticles.length === 0) { steamRAF = null; return; }
  steamRAF = requestAnimationFrame(animateSteam);
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
  const frag = document.createDocumentFragment();
  galleryImages.forEach((src, i) => {
    const thumb = document.createElement('img');
    thumb.src = src;
    thumb.alt = `Ekran ${i + 1}`;
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.className = 'thumb';
    if (i === currentImageIndex) thumb.classList.add('active');
    thumb.addEventListener('click', () => {
      currentImageIndex = i;
      updateGalleryImage();
    });
    frag.appendChild(thumb);
  });
  thumbsEl.appendChild(frag);
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
  allFaqs.forEach(f => { if (f !== item) f.classList.remove('open'); });
  item.classList.toggle('open');
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    updateThemeIcon();
    themeBtn.addEventListener('click', () => {
      const isLight = document.documentElement.classList.toggle('light');
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
