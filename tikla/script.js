// Ekran görüntüsü galerisi (sadece ekran-goruntuleri.html'de kullanılacak)
let totalImages = 6; // Yüklediğin ekran görüntüsü sayısı
let currentImage = 1;

function showImage(index) {
  const galleryImage = document.getElementById('galleryImage');
  if (!galleryImage) return;
  galleryImage.style.opacity = 0;
  setTimeout(() => {
    galleryImage.src = `sss/${index}.png`;
    galleryImage.style.opacity = 1;
    const currentEl = document.getElementById('currentImage');
    if (currentEl) currentEl.textContent = index;
  }, 300);
}

function nextImage() {
  if (currentImage < totalImages) {
    currentImage++;
    showImage(currentImage);
  }
}

function prevImage() {
  if (currentImage > 1) {
    currentImage--;
    showImage(currentImage);
  }
}

// SSS akordiyon
document.addEventListener('DOMContentLoaded', () => {
  const totalEl = document.getElementById('totalImages');
  if (totalEl) totalEl.textContent = totalImages;

  if (document.getElementById('galleryImage')) {
    showImage(1);
  }

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = answer.classList.contains('open');
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      if (!isOpen) {
        answer.classList.add('open');
      }
    });
  });
});
