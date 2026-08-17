(() => {
  'use strict';

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#site-nav') || document.querySelector('.header nav');
  const grid = document.getElementById('portfolioGrid');
  const status = document.getElementById('portfolioStatus');

  function closeMenu() {
    if (!menu || !nav) return;
    nav.classList.remove('show');
    menu.setAttribute('aria-expanded', 'false');
  }
  menu?.addEventListener('click', () => {
    const open = nav.classList.toggle('show');
    menu.setAttribute('aria-expanded', String(open));
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Add your image filenames to dokumentasi/manifest.json.
  // Filenames can be anything: "Fabrikasi Tanki.jpg", "Project Pabrik.png", etc.
  const manifestUrl = 'dokumentasi/manifest.json';

  let photos = [];
  let current = 0;
  let lightbox = null;

  async function loadManifest() {
    try {
      const response = await fetch(manifestUrl, { cache: 'no-store' });
      if (!response.ok) throw new Error('Manifest tidak ditemukan');
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Format manifest tidak valid');
      return data.filter(item => typeof item === 'string' && item.trim());
    } catch {
      return [];
    }
  }

  function safePath(filename) {
    // Only allow local files inside the documentation folder.
    return 'dokumentasi/' + filename.split('/').map(encodeURIComponent).join('/');
  }

  function renderGallery(files) {
    if (!grid) return;
    grid.innerHTML = '';
    photos = [];

    if (!files.length) {
      grid.innerHTML = `<div class="portfolio-empty">
        <strong>Dokumentasi belum ditambahkan.</strong>
        <span>Masukkan foto ke folder <b>dokumentasi</b>, lalu tambahkan nama filenya ke <b>manifest.json</b>.</span>
      </div>`;
      if (status) status.textContent = '';
      return;
    }

    files.forEach((filename, index) => {
      const src = safePath(filename);
      const img = new Image();
      img.src = src;
      img.alt = filename.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      img.loading = 'lazy';

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'portfolio-card portfolio-photo';
      card.setAttribute('aria-label', `Buka dokumentasi ${index + 1}`);
      card.appendChild(img);

      const caption = document.createElement('span');
      caption.textContent = img.alt;
      card.appendChild(caption);

      card.addEventListener('click', () => openLightbox(index));
      img.addEventListener('error', () => card.remove());
      grid.appendChild(card);
      photos.push({ src, alt: img.alt });
    });

    if (status) status.textContent = `${files.length} dokumentasi tersedia.`;
  }

  function openLightbox(index) {
    current = index;
    if (lightbox) lightbox.remove();

    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Galeri dokumentasi');
    lightbox.innerHTML = `
      <button class="lightbox-close" type="button" aria-label="Tutup">×</button>
      <button class="lightbox-prev" type="button" aria-label="Foto sebelumnya">‹</button>
      <figure class="lightbox-figure">
        <img class="lightbox-image" alt="">
        <figcaption class="lightbox-caption"></figcaption>
      </figure>
      <button class="lightbox-next" type="button" aria-label="Foto berikutnya">›</button>
      <div class="lightbox-counter" aria-live="polite"></div>`;

    document.body.appendChild(lightbox);
    document.body.classList.add('lightbox-open');

    lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => move(-1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => move(1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

    updateLightbox();
    lightbox.querySelector('.lightbox-close').focus();
  }

  function updateLightbox() {
    if (!lightbox || !photos.length) return;
    const item = photos[current];
    lightbox.querySelector('.lightbox-image').src = item.src;
    lightbox.querySelector('.lightbox-image').alt = item.alt;
    lightbox.querySelector('.lightbox-caption').textContent = item.alt;
    lightbox.querySelector('.lightbox-counter').textContent = `${current + 1} / ${photos.length}`;
    lightbox.querySelector('.lightbox-prev').disabled = photos.length < 2;
    lightbox.querySelector('.lightbox-next').disabled = photos.length < 2;
  }

  function move(step) {
    if (!photos.length) return;
    current = (current + step + photos.length) % photos.length;
    updateLightbox();
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.remove();
    lightbox = null;
    document.body.classList.remove('lightbox-open');
  }

  document.addEventListener('keydown', e => {
    if (!lightbox) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') move(-1);
    if (e.key === 'ArrowRight') move(1);
  });

  (async () => {
    const files = await loadManifest();
    renderGallery(files);
  })();
})();
