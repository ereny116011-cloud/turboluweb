// Galeri
const totalImages = 6; // Kaç ekran görüntünüz varsa bu sayıyı güncelleyin
let currentImage = 1;

function showImage(index) {
  const galleryImage = document.getElementById('galleryImage');
  galleryImage.style.opacity = 0;
  setTimeout(() => {
    galleryImage.src = `sss/${index}.png`;
    galleryImage.style.opacity = 1;
    document.getElementById('currentImage').textContent = index;
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
  document.getElementById('totalImages').textContent = totalImages;
  showImage(1);

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

// Virüs modal
function openVirusModal() {
  document.getElementById('virusModal').classList.remove('hidden');
}

function closeVirusModal() {
  document.getElementById('virusModal').classList.add('hidden');
}
