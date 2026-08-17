const menu = document.querySelector('.menu');
const nav = document.querySelector('.header nav');

menu?.addEventListener('click', () => {
  nav?.classList.toggle('show');
});

document.querySelectorAll('nav a').forEach(a => {
  a.addEventListener('click', () => nav?.classList.remove('show'));
});

/* Dokumentasi lokal — tidak memakai Spreadsheet, Drive, atau manifest.json. */
(() => {
  const track = document.getElementById('portfolioTrack');
  const status = document.getElementById('portfolioStatus');
  const prev = document.querySelector('.doc-prev');
  const next = document.querySelector('.doc-next');

  if (!track || !status || !prev || !next) return;

  // Nama file dibuat sederhana agar aman di GitHub Pages.
  const photos = [
    { file: 'dokumentasi-01.jpg', title: 'Dokumentasi 01' },
    { file: 'dokumentasi-02.jpg', title: 'Dokumentasi 02' },
    { file: 'dokumentasi-03.jpg', title: 'Dokumentasi 03' }
  ];

  let current = 0;

  function render() {
    track.innerHTML = photos.map((photo, index) => `
      <figure class="doc-slide">
        <img src="dokumentasi/${encodeURIComponent(photo.file)}"
             alt="${photo.title}"
             loading="${index === 0 ? 'eager' : 'lazy'}"
             decoding="async">
        <figcaption class="doc-caption">${photo.title}</figcaption>
      </figure>
    `).join('');

    track.querySelectorAll('img').forEach((img, index) => {
      img.addEventListener('error', () => {
        img.closest('.doc-slide').innerHTML =
          '<div class="doc-error">Foto dokumentasi belum ditemukan.<br>Pastikan nama file <strong>' +
          photos[index].file +
          '</strong> berada di folder <strong>dokumentasi/</strong>.</div>';
      });
    });

    update();
  }

  function update() {
    track.style.transform = `translateX(-${current * 100}%)`;
    status.textContent = `Dokumentasi ${current + 1} dari ${photos.length}`;
    prev.disabled = current === 0;
    next.disabled = current === photos.length - 1;
  }

  prev.addEventListener('click', () => {
    if (current > 0) {
      current -= 1;
      update();
    }
  });

  next.addEventListener('click', () => {
    if (current < photos.length - 1) {
      current += 1;
      update();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && current > 0) {
      current -= 1;
      update();
    }
    if (event.key === 'ArrowRight' && current < photos.length - 1) {
      current += 1;
      update();
    }
  });

  let startX = null;
  track.addEventListener('touchstart', event => {
    startX = event.touches[0].clientX;
  }, { passive: true });

  track.addEventListener('touchend', event => {
    if (startX === null) return;
    const delta = event.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 45) {
      if (delta < 0 && current < photos.length - 1) current += 1;
      if (delta > 0 && current > 0) current -= 1;
      update();
    }
    startX = null;
  }, { passive: true });

  render();
})();
