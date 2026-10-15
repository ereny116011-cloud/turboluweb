// ========== TEMA: Koyu / Açık / Duvar kağıdı ==========
var TEMA_MODLAR = ['dark', 'light', 'wallpaper'];
var TEMA_ETIKET = { dark: 'Koyu', light: 'Açık', wallpaper: 'Duvar kağıdı' };
var TEMA_IKON = { dark: 'fa-moon', light: 'fa-sun', wallpaper: 'fa-image' };

function aktifTema() {
  var root = document.documentElement;
  if (root.classList.contains('wallpaper')) return 'wallpaper';
  if (root.classList.contains('light')) return 'light';
  return 'dark';
}

function temaUygula(mod) {
  var root = document.documentElement;
  root.classList.remove('light', 'wallpaper');
  if (mod === 'light') root.classList.add('light');
  else if (mod === 'wallpaper') root.classList.add('wallpaper');
  localStorage.setItem('theme', mod);
  updateThemeIcon();
}

function toggleTheme() {
  temaUygula(TEMA_MODLAR[(TEMA_MODLAR.indexOf(aktifTema()) + 1) % TEMA_MODLAR.length]);
}

function updateThemeIcon() {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  var mod = aktifTema();
  btn.innerHTML = '<i class="fa-solid ' + TEMA_IKON[mod] + '"></i>';
  btn.title = 'Tema: ' + TEMA_ETIKET[mod] + ' (değiştirmek için tıkla)';
  btn.setAttribute('aria-label', btn.title);
}

// ========== BUHAR ==========
// İki kaynak: (1) ekranın her yerinde kendiliğinden doğan ortam bulutları,
// (2) fare izi. Ortam bulutları sayesinde fare dururken de arka plan canlı kalır.
var MAX_PARTICLES = 60;
var MAX_TRAIL = 24;
var AMBIENT_INTERVAL = 420;
var AMBIENT_SEED = 14;
var TARGET_FPS = 30;
var steamParticles = [];
var steamCanvas, steamCtx;
var steamRAF = null;
var steamLastTime = 0;
var steamLastMouseTime = 0;
var steamLastAmbient = 0;
var steamLastFrame = 0;
var steamReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ekranın rastgele bir yerinde doğan, çok yavaş süzülen ortam bulutu.
// seedLife verilirse bulut ömrünün ortasından başlar (açılış dağılımı için).
function spawnAmbientSteam(seedLife) {
  steamParticles.push({
    x: Math.random() * window.innerWidth,
    y: window.innerHeight * (0.15 + Math.random() * 0.95),
    vx: (Math.random() - 0.5) * 0.16,
    vy: -0.08 - Math.random() * 0.16,
    size: 26 + Math.random() * 46,
    grow: 0.05 + Math.random() * 0.05,
    sway: 6 + Math.random() * 16,
    phase: Math.random() * Math.PI * 2,
    ambient: true,
    life: seedLife === undefined ? 1 : seedLife,
    decay: 0.0012 + Math.random() * 0.0013
  });
}

function seedAmbientSteam() {
  for (var i = 0; i < AMBIENT_SEED; i++) spawnAmbientSteam(Math.random());
}

function initSteam() {
  steamCanvas = document.getElementById('steamCanvas');
  if (!steamCanvas) return;
  steamCtx = steamCanvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!steamCtx) return;
  resizeSteamCanvas();

  document.addEventListener('mousemove', function(e) {
    var now = performance.now();
    if (now - steamLastMouseTime < 16) return;
    steamLastMouseTime = now;

    // Fare izi ayrı bir havuzda tutulur; ortam bulutlarını ezmesin
    var trailCount = 0;
    for (var k = 0; k < steamParticles.length; k++) {
      if (!steamParticles[k].ambient) trailCount++;
    }
    if (trailCount >= MAX_TRAIL) {
      for (var j = 0; j < steamParticles.length; j++) {
        if (!steamParticles[j].ambient) { steamParticles.splice(j, 1); break; }
      }
    }

    steamParticles.push({
      x: e.clientX + (Math.random() - 0.5) * 10,
      y: e.clientY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.4 - Math.random() * 0.5,
      size: 5 + Math.random() * 9,
      grow: 0.5,
      sway: 0,
      phase: 0,
      ambient: false,
      life: 0.9,
      decay: 0.024 + Math.random() * 0.014
    });
    startSteamLoop();
  }, { passive: true });

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (steamRAF) { cancelAnimationFrame(steamRAF); steamRAF = null; }
    } else {
      startSteamLoop();
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resizeSteamCanvas, 150);
  }, { passive: true });

  // Hareket azaltma tercihi olmayanlarda arka plan kendiliğinden canlansın
  if (!steamReduced) {
    seedAmbientSteam();
    startSteamLoop();
  }
}

function startSteamLoop() {
  if (steamRAF || document.hidden || steamReduced) return;
  steamLastTime = performance.now();
  steamRAF = requestAnimationFrame(animateSteam);
}

function resizeSteamCanvas() {
  if (!steamCanvas) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  steamCanvas.width = window.innerWidth * dpr;
  steamCanvas.height = window.innerHeight * dpr;
  steamCanvas.style.width = window.innerWidth + 'px';
  steamCanvas.style.height = window.innerHeight + 'px';
  steamCtx.setTransform(1, 0, 0, 1, 0, 0);
  steamCtx.scale(dpr, dpr);
}

function animateSteam(now) {
  if (!steamCtx) { steamRAF = null; return; }
  steamRAF = requestAnimationFrame(animateSteam);

  // ~30 fps: yavaş arka plan animasyonu için yeterli, GPU'yu yormaz
  if (now - steamLastFrame < 1000 / TARGET_FPS) return;

  // dt atlanan kareleri de sayar; animasyon gerçek zamana bağlı kalır
  var dt = Math.min((now - steamLastTime) / 16.67, 3);
  steamLastTime = now;
  steamLastFrame = now;

  if (now - steamLastAmbient > AMBIENT_INTERVAL && steamParticles.length < MAX_PARTICLES) {
    steamLastAmbient = now;
    spawnAmbientSteam();
  }

  steamCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  var isLight = document.documentElement.classList.contains('light');
  var color = isLight ? '22, 163, 74' : '34, 197, 94';
  var swayT = now * 0.0005;

  for (var i = steamParticles.length - 1; i >= 0; i--) {
    var p = steamParticles[i];
    var swayX = p.sway ? Math.sin(swayT + p.phase) * p.sway * 0.02 : 0;
    p.x += (p.vx + swayX) * dt;
    p.y += p.vy * dt;
    p.size += p.grow * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0 || p.y + p.size < -80) { steamParticles.splice(i, 1); continue; }

    var alpha = p.ambient ? p.life * 0.18 : p.life * 0.28;
    var gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, 'rgba(' + color + ', ' + alpha + ')');
    gradient.addColorStop(0.5, 'rgba(' + color + ', ' + (alpha * 0.4) + ')');
    gradient.addColorStop(1, 'rgba(' + color + ', 0)');
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }
}

// ========== GALERİ (resimler: sss/1.png, sss/2.png, ...) ==========
var galleryImages = [];
var currentImageIndex = 0;
var galleryLoaded = false;
var EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
var TOTAL_IMAGES = 8;
var IMAGE_PATH = 'sss/'; // <-- buraya dikkat: resimlerin bulunduğu klasör

function loadGallery() {
  if (galleryLoaded) return;
  var galleryEl = document.getElementById('gallery');
  if (!galleryEl) return;

  galleryImages = [];
  for (var n = 1; n <= TOTAL_IMAGES; n++) {
    galleryImages.push({ name: IMAGE_PATH + String(n), src: null });
  }

  probeImages().then(function() {
    renderGalleryThumbs();
    updateGalleryImage();
    galleryLoaded = true;
  });
}

function probeImages() {
  var promises = galleryImages.map(function(img) {
    return new Promise(function(resolve) {
      var extIndex = 0;
      function tryNext() {
        if (extIndex >= EXTENSIONS.length) {
          img.src = null;
          resolve();
          return;
        }
        var testSrc = img.name + '.' + EXTENSIONS[extIndex];
        var probe = new Image();
        probe.onload = function() { img.src = testSrc; resolve(); };
        probe.onerror = function() { extIndex++; tryNext(); };
        probe.src = testSrc;
      }
      tryNext();
    });
  });
  return Promise.all(promises);
}

function renderGalleryThumbs() {
  var thumbsEl = document.getElementById('galleryThumbs');
  if (!thumbsEl) return;
  thumbsEl.innerHTML = '';

  var available = galleryImages.filter(function(img) { return img.src; });
  if (available.length === 0) return;

  var frag = document.createDocumentFragment();
  galleryImages.forEach(function(img, i) {
    if (!img.src) return;
    var thumb = document.createElement('img');
    thumb.src = img.src;
    thumb.alt = 'Ekran ' + (i + 1);
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    thumb.className = 'thumb';
    thumb.dataset.index = i;
    if (i === currentImageIndex) thumb.classList.add('active');
    thumb.addEventListener('click', function() {
      currentImageIndex = i;
      updateGalleryImage();
    });
    frag.appendChild(thumb);
  });
  thumbsEl.appendChild(frag);
}

function updateGalleryImage() {
  var mainImg = document.getElementById('galleryImage');
  if (!mainImg) return;

  var found = null;
  if (galleryImages[currentImageIndex] && galleryImages[currentImageIndex].src) {
    found = galleryImages[currentImageIndex];
  } else {
    for (var i = 0; i < galleryImages.length; i++) {
      if (galleryImages[i].src) {
        currentImageIndex = i;
        found = galleryImages[i];
        break;
      }
    }
  }

  var fallbackEl = document.getElementById('galleryFallback');
  if (!fallbackEl) {
    fallbackEl = document.createElement('div');
    fallbackEl.id = 'galleryFallback';
    fallbackEl.className = 'gallery-fallback';
    fallbackEl.style.display = 'none';
    mainImg.parentNode.insertBefore(fallbackEl, mainImg.nextSibling);
  }

  if (!found) {
    mainImg.style.display = 'none';
    fallbackEl.style.display = 'block';
    fallbackEl.innerHTML =
      '<div class="fallback-icon">&#128247;</div>' +
      '<div class="fallback-title">Henüz ekran görüntüsü yok</div>' +
      '<div class="fallback-sub">tikla/sss/ klasörüne 1.png, 2.png, 3.png ... ekleyin</div>';
    return;
  }

  mainImg.style.display = 'block';
  fallbackEl.style.display = 'none';

  mainImg.style.opacity = '0';
  setTimeout(function() {
    mainImg.onload = function() { mainImg.style.opacity = '1'; };
    mainImg.onerror = function() {
      mainImg.style.display = 'none';
      fallbackEl.style.display = 'block';
      fallbackEl.innerHTML =
        '<div class="fallback-icon">&#9888;</div>' +
        '<div class="fallback-title">Görsel yüklenemedi</div>' +
        '<div class="fallback-sub">' + found.name + '</div>';
    };
    mainImg.src = found.src;
    mainImg.alt = 'Ekran ' + (currentImageIndex + 1);
  }, 150);

  document.querySelectorAll('.thumb').forEach(function(t) {
    t.classList.toggle('active', parseInt(t.dataset.index, 10) === currentImageIndex);
  });
}

// Klavye ile gezinme
document.addEventListener('keydown', function(e) {
  if (galleryImages.length === 0) return;
  var galleryImage = document.getElementById('galleryImage');
  if (!galleryImage || galleryImage.style.display === 'none') return;

  if (e.key === 'ArrowRight') {
    for (var i = currentImageIndex + 1; i < galleryImages.length; i++) {
      if (galleryImages[i].src) { currentImageIndex = i; break; }
    }
    updateGalleryImage();
  } else if (e.key === 'ArrowLeft') {
    for (var j = currentImageIndex - 1; j >= 0; j--) {
      if (galleryImages[j].src) { currentImageIndex = j; break; }
    }
    updateGalleryImage();
  }
});

// ========== SSS ==========
function toggleFaq(el) {
  var item = el.closest('.faq-item');
  var allFaqs = document.querySelectorAll('.faq-item');
  allFaqs.forEach(function(f) { if (f !== item) f.classList.remove('open'); });
  item.classList.toggle('open');
}

// ========== BAŞLAT ==========
document.addEventListener('DOMContentLoaded', function() {
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    updateThemeIcon();
    themeBtn.addEventListener('click', function() {
      toggleTheme();
    });
  }

  initSteam();
  loadGallery();

  document.querySelectorAll('.faq-question').forEach(function(q) {
    q.addEventListener('click', function() { toggleFaq(q); });
  });
});
