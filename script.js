(() => {
  'use strict';

  const menu = document.querySelector('.menu');
  const nav = document.querySelector('#site-nav') || document.querySelector('.header nav');
  const grid = document.getElementById('portfolioGrid');
  const status = document.getElementById('portfolioStatus');

  // Mobile navigation
  function closeMenu() {
    if (!menu || !nav) return;
    nav.classList.remove('show');
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Buka menu navigasi');
  }

  function toggleMenu() {
    if (!menu || !nav) return;
    const open = !nav.classList.contains('show');
    nav.classList.toggle('show', open);
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Tutup menu navigasi' : 'Buka menu navigasi');
  }

  menu?.addEventListener('click', toggleMenu);
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  // Local portfolio: no Google Sheets and no Google Drive.
  // manifest.json and all photos are in the SAME folder as index.html.
  const manifestCandidates = ['manifest.json', 'dokumentasi/manifest.json'];
  let photos = [];
  let current = 0;
  let lightbox = null;

  function cleanName(filename) {
    return String(filename || '')
      .split('/').pop()
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function safeLocalPath(filename, manifestPath) {
    const name = String(filename || '').trim();
    if (!name) return '';
    // If manifest is in dokumentasi/, keep files relative to that folder.
    const prefix = manifestPath.startsWith('dokumentasi/') ? 'dokumentasi/' : '';
    if (/^(https?:|data:|javascript:)/i.test(name)) return '';
    return prefix + name.split('/').map(encodeURIComponent).join('/');
  }

  async function fetchManifest(url) {
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      if (!Array.isArray(data)) return null;
      return { data, url };
    } catch {
      return null;
    }
  }

  async function loadManifest() {
    for (const url of manifestCandidates) {
      const result = await fetchManifest(url);
      if (result) return result;
    }
    return { data: [], url: 'manifest.json' };
  }

  function normalizeManifestItem(item) {
    if (typeof item === 'string') {
      return { file: item.trim(), title: cleanName(item), category: '', description: '' };
    }
    if (item && typeof item === 'object' && typeof item.file === 'string') {
      return {
        file: item.file.trim(),
        title: String(item.title || cleanName(item.file)),
        category: String(item.category || ''),
        description: String(item.description || '')
      };
    }
    return null;
  }

  function renderGallery(items, manifestPath) {
    if (!grid) return;
    grid.innerHTML = '';
    photos = [];

    const valid = items
      .map(normalizeManifestItem)
      .filter(Boolean)
      .map(item => ({ ...item, src: safeLocalPath(item.file, manifestPath) }))
      .filter(item => item.src);

    if (!valid.length) {
      grid.innerHTML = `<div class="portfolio-empty">
        <strong>Dokumentasi belum ditemukan.</strong>
        <span>Pastikan <b>manifest.json</b> berada di folder utama website dan berisi nama file foto Anda.</span>
      </div>`;
      if (status) status.textContent = '';
      return;
    }

    valid.forEach((item, index) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'portfolio-card portfolio-photo';
      card.setAttribute('aria-label', `Buka dokumentasi ${index + 1}: ${item.title}`);

      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      img.loading = index < 3 ? 'eager' : 'lazy';
      img.decoding = 'async';

      const overlay = document.createElement('span');
      overlay.className = 'portfolio-photo-overlay';
      overlay.innerHTML = `<strong></strong><small></small>`;
      overlay.querySelector('strong').textContent = item.title;
      overlay.querySelector('small').textContent = item.category || 'Dokumentasi proyek';

      card.append(img, overlay);
      card.addEventListener('click', () => openLightbox(index));
      img.addEventListener('error', () => {
        card.classList.add('is-missing');
        card.setAttribute('aria-label', `File tidak ditemukan: ${item.file}`);
        overlay.querySelector('small').textContent = `File tidak ditemukan: ${item.file}`;
      });

      grid.appendChild(card);
      photos.push(item);
    });

    if (status) status.textContent = `${photos.length} dokumentasi tersedia.`;
  }

  function openLightbox(index) {
    if (!photos.length) return;
    current = Math.max(0, Math.min(index, photos.length - 1));
    lightbox?.remove();

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
    const image = lightbox.querySelector('.lightbox-image');
    image.src = item.src;
    image.alt = item.title;
    lightbox.querySelector('.lightbox-caption').innerHTML = '';

    const title = document.createElement('strong');
    title.textContent = item.title;
    lightbox.querySelector('.lightbox-caption').appendChild(title);
    if (item.description) {
      const desc = document.createElement('span');
      desc.textContent = item.description;
      lightbox.querySelector('.lightbox-caption').appendChild(desc);
    }

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

  // Swipe support for phones.
  let touchStartX = 0;
  document.addEventListener('touchstart', e => {
    if (lightbox && e.touches.length === 1) touchStartX = e.touches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    if (!lightbox || !e.changedTouches.length) return;
    const delta = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
  }, { passive: true });

  (async () => {
    const result = await loadManifest();
    renderGallery(result.data, result.url);
  })();
})();
