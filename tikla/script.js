// ========== TEMA ==========
function updateThemeIcon() {
  const btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.documentElement.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

document.addEventListener('DOMContentLoaded', () => {
  // Tema
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    updateThemeIcon();
    themeBtn.addEventListener('click', () => {
      document.documentElement.classList.toggle('light');
      const isLight = document.documentElement.classList.contains('light');
      localStorage.setItem('tikla-theme', isLight ? 'light' : 'dark');
      updateThemeIcon();
    });
  }

  // Galeri
  const totalEl = document.getElementById('totalImages');
  if (totalEl) totalEl.textContent = totalImages;
  if (document.getElementById('galleryImage')) showImage(1);

  // SSS
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      if (!isOpen) answer.classList.add('open');
    });
  });
});

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
  }, 250);
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

document.addEventListener('DOMContentLoaded', () => {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d');
  resizeSteamCanvas();
  window.addEventListener('resize', resizeSteamCanvas);

  document.addEventListener('mousemove', (e) => {
    steamParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 6,
      y: e.clientY + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.2,
      vy: -0.15 - Math.random() * 0.2,
      size: 4 + Math.random() * 6,
      life: 0.6,
      decay: 0.035 + Math.random() * 0.02
    });
    if (steamParticles.length > 30) {
      steamParticles.splice(0, steamParticles.length - 30);
    }
  });
  requestAnimationFrame(animateSteam);
});

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
    p.x += p.vx;
    p.y += p.vy;
    p.size += 0.3;
    p.life -= p.decay;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }
    const alpha = p.life * 0.1;
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
