// ========== BUHAR İZİ (BELİRGİN, EN ÜST KATMAN) ==========
let steamParticles = [];
let steamCanvas, steamCtx;

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d');
  resizeSteamCanvas();
  window.addEventListener('resize', resizeSteamCanvas);

  document.addEventListener('mousemove', (e) => {
    // Her harekette 2 particle → daha yoğun buhar
    for (let k = 0; k < 2; k++) {
      steamParticles.push({
        x: e.clientX + (Math.random() - 0.5) * 22,
        y: e.clientY + (Math.random() - 0.5) * 22,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -0.6 - Math.random() * 0.7,
        size: 14 + Math.random() * 20,
        life: 1.1,
        decay: 0.016 + Math.random() * 0.012
      });
    }
    if (steamParticles.length > 90) {
      steamParticles.splice(0, steamParticles.length - 90);
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
  const isLight = document.documentElement.classList.contains('light');
  const color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (let i = steamParticles.length - 1; i >= 0; i--) {
    const p = steamParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.size += 0.9;
    p.life -= p.decay;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }

    const alpha = p.life * 0.38; // Çok belirgin
    const gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, `rgba(${color}, ${alpha})`);
    gradient.addColorStop(0.45, `rgba(${color}, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }
  requestAnimationFrame(animateSteam);
}
