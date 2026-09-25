// ========== TEMA ==========
function updateThemeIcon() {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  btn.innerHTML = document.documentElement.classList.contains('light')
    ? '<i class="fa-solid fa-sun"></i>'
    : '<i class="fa-solid fa-moon"></i>';
}

// ========== BUHAR ==========
var MAX_PARTICLES = 60;
var MAX_PARTICLES_POOL = 80;
var steamParticles = [];
var steamCanvas, steamCtx;
var steamRAF = null;
var steamLastTime = 0;
var steamLastMouseTime = 0;

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

  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      if (steamRAF) { cancelAnimationFrame(steamRAF); steamRAF = null; }
    } else if (steamParticles.length > 0) {
      startSteamLoop();
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function() {
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
  var dt = Math.min((now - steamLastTime) / 16.67, 3);
  steamLastTime = now;

  steamCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  var isLight = document.documentElement.classList.contains('light');
  var color = isLight ? '22, 163, 74' : '34, 197, 94';

  for (var i = steamParticles.length - 1; i >= 0; i--) {
    var p = steamParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.size += 0.5 * dt;
    p.life -= p.decay * dt;
    if (p.life <= 0) { steamParticles.splice(i, 1); continue; }
    var alpha = p.life * 0.28;
    var gradient = steamCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
    gradient.addColorStop(0, 'rgba(' + color + ', ' + alpha + ')');
    gradient.addColorStop(0.5, 'rgba(' + color + ', ' + (alpha * 0.4) + ')');
    gradient.addColorStop(1, 'rgba(' + color + ', 0)');
    steamCtx.fillStyle = gradient;
    steamCtx.beginPath();
    steamCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    steamCtx.fill();
  }

  if (steamParticles.length === 0) { steamRAF = null; return; }
  steamRAF = requestAnimationFrame(animateSteam);
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
      var isLight = document.documentElement.classList.toggle('light');
      localStorage.setItem('theme', isLight ? 'light' : 'dark');
      updateThemeIcon();
    });
  }

  initSteam();
  loadGallery();

  document.querySelectorAll('.faq-question').forEach(function(q) {
    q.addEventListener('click', function() { toggleFaq(q); });
  });
});
