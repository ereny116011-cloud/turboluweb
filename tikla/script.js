// ========== TEMA ==========
function initTheme() {
  const saved = localStorage.getItem('tikla-theme');
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const isLight = saved ? saved === 'light' : prefersLight;
  document.body.classList.toggle('light', isLight);
  updateThemeIcon();
}
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('tikla-theme', isLight ? 'light' : 'dark');
  updateThemeIcon();
}
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.body.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== GALERİ ==========
let totalImages = 9;
let currentImage = 1;

function showImage(index) {
  const galleryImage = document.getElementById('galleryImage');
  if (!galleryImage) return;
  galleryImage.style.opacity = 0;
  setTimeout(() => {
    galleryImage.src = `sss/${index}.png`;
    galleryImage.style.opacity = 1;
    const cur = document.getElementById('currentImage');
    if (cur) cur.textContent = index;
  }, 300);
}
function nextImage() {
  if (currentImage < totalImages) { currentImage++; showImage(currentImage); }
}
function prevImage() {
  if (currentImage > 1) { currentImage--; showImage(currentImage); }
}
window.nextImage = nextImage;
window.prevImage = prevImage;

// ========== STEAM TRAIL ==========
let steamParticles = [];
let steamCanvas, steamCtx;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d');
  resizeSteamCanvas();
  window.addEventListener('resize', resizeSteamCanvas);

  document.addEventListener('mousemove', (e) => {
    for (let i = 0; i < 3; i++) {
      steamParticles.push({
        x: e.clientX + (Math.random() - 0.5) * 24,
        y: e.clientY + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.6 - Math.random() * 1.0,
        size: 18 + Math.random() * 30,
        life: 1,
        decay: 0.012 + Math.random() * 0.018
      });
    }
    if (steamParticles.length > 150) {
      steamParticles.splice(0, steamParticles.length - 150);
    }
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

  const isLight = document.body.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.008;
    p.vx *= 0.99;
    p.size += 0.6;
    p.life -= p.decay;

    if (p.life <= 0) {
      steamParticles.splice(i, 1);
      continue;
    }

    const alpha = p.life * 0.55;
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.6, `rgba(${color}, ${alpha * 0.4})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }
  requestAnimationFrame(animateSteam);
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSteam();

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const totalEl = document.getElementById('totalImages');
  if (totalEl) totalEl.textContent = totalImages;

  if (document.getElementById('galleryImage')) showImage(1);

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      if (!isOpen) answer.classList.add('open');
    });
  });
});
