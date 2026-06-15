/* ===========================================================
   Dar Safra — app logic
   =========================================================== */

/* ---------- Language ---------- */
const SUPPORTED_LANGS = ['it', 'en', 'fr', 'es'];
let currentLanguage = 'it';

function detectLanguage() {
  const browserLang = (navigator.language || 'it').split('-')[0].toLowerCase();
  return SUPPORTED_LANGS.includes(browserLang) ? browserLang : 'it';
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'it';
  currentLanguage = lang;
  try { localStorage.setItem('darsafra_lang', lang); } catch (e) {}
  document.documentElement.setAttribute('lang', lang);
  applyTranslations();
  updateLangButtons();
}

function applyTranslations() {
  const dict = translations[currentLanguage] || translations.it;
  document.querySelectorAll('[data-translate]').forEach(el => {
    const key = el.getAttribute('data-translate');
    if (dict[key] !== undefined) el.textContent = dict[key];
  });
}

function updateLangButtons() {
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLanguage);
  });
}

/* ---------- Mobile menu ---------- */
function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const links = document.getElementById('navLinks');
  toggle.addEventListener('click', () => links.classList.toggle('active'));
  document.querySelectorAll('.nav-links a').forEach(a =>
    a.addEventListener('click', () => links.classList.remove('active'))
  );
}

/* ---------- Navbar scroll state ---------- */
function initNavScroll() {
  const nav = document.querySelector('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- Carousels ---------- */
const carouselTimers = {};

function showSlide(name, index) {
  const c = document.querySelector(`.carousel[data-space="${name}"]`);
  if (!c) return;
  const slides = c.querySelectorAll('.carousel-slide');
  const dots = c.querySelectorAll('.dot');
  const n = slides.length;
  index = ((index % n) + n) % n;
  slides.forEach((s, i) => s.classList.toggle('active', i === index));
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  c.dataset.current = index;
}
function curIndex(name) {
  const c = document.querySelector(`.carousel[data-space="${name}"]`);
  return parseInt(c.dataset.current || '0', 10);
}
function nextSlide(name) { showSlide(name, curIndex(name) + 1); resetTimer(name); }
function prevSlide(name) { showSlide(name, curIndex(name) - 1); resetTimer(name); }
function goToSlide(name, i) { showSlide(name, i); resetTimer(name); }
function resetTimer(name) {
  clearInterval(carouselTimers[name]);
  carouselTimers[name] = setInterval(() => showSlide(name, curIndex(name) + 1), 6000);
}
function initCarousels() {
  document.querySelectorAll('.carousel').forEach(c => {
    const name = c.dataset.space;
    c.dataset.current = 0;
    resetTimer(name);
  });
}

/* ---------- Gallery + lightbox ---------- */
const GALLERY = [
  'foto/16.avif','foto/13.avif','foto/27.avif','foto/18.avif','foto/8.avif','foto/5.avif',
  'foto/11.avif','foto/6.avif','foto/21.avif','foto/9.avif','foto/12.avif','foto/10.avif',
  'foto/30.avif','foto/29.avif','foto/28.avif','foto/24.avif','foto/26.avif','foto/22.jpg',
  'foto/25.jpg','foto/23.avif','foto/19.avif','foto/20.jpg','foto/7.avif','foto/4.avif',
  'foto/2.avif','foto/3.avif','foto/14.avif','foto/15.jpg','foto/17.webp','foto/1.jpg'
];
let lightboxIndex = 0;

function renderGallery() {
  const grid = document.getElementById('galleryGrid');
  grid.innerHTML = '';
  GALLERY.forEach((src, i) => {
    const item = document.createElement('button');
    item.className = 'gallery-item';
    item.type = 'button';
    item.setAttribute('aria-label', 'Foto ' + (i + 1));
    item.innerHTML = `<img src="${src}" alt="Dar Safra — foto ${i + 1}" loading="lazy">
      <span class="gallery-overlay"><span class="gallery-plus">+</span></span>`;
    item.addEventListener('click', () => openLightbox(i));
    grid.appendChild(item);
  });
}
function openLightbox(i) {
  lightboxIndex = i;
  updateLightbox();
  document.getElementById('lightbox').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('active');
  document.body.style.overflow = '';
}
function updateLightbox() {
  const img = document.getElementById('lightboxImage');
  img.classList.remove('changing'); void img.offsetWidth; img.classList.add('changing');
  img.src = GALLERY[lightboxIndex];
  document.getElementById('lightboxCount').textContent = (lightboxIndex + 1) + ' / ' + GALLERY.length;
}
function nextImage() { lightboxIndex = (lightboxIndex + 1) % GALLERY.length; updateLightbox(); }
function prevImage() { lightboxIndex = (lightboxIndex - 1 + GALLERY.length) % GALLERY.length; updateLightbox(); }

function initLightbox() {
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', prevImage);
  document.getElementById('lightboxNext').addEventListener('click', nextImage);
  const lb = document.getElementById('lightbox');
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('active')) return;
    if (e.key === 'ArrowRight') nextImage();
    if (e.key === 'ArrowLeft') prevImage();
    if (e.key === 'Escape') closeLightbox();
  });
  let sx = 0;
  lb.addEventListener('touchstart', e => { sx = e.changedTouches[0].screenX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - sx;
    if (dx < -50) nextImage(); if (dx > 50) prevImage();
  }, { passive: true });
}

/* ---------- Map ---------- */
function initMap() {
  if (typeof L === 'undefined') return;
  const map = L.map('mapid', { scrollWheelZoom: false }).setView([35.787028, -5.809694], 16);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap', maxZoom: 19
  }).addTo(map);
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#C0683B';
  L.circleMarker([35.787028, -5.809694], {
    radius: 12, fillColor: accent, color: 'white', weight: 3, opacity: 1, fillOpacity: 1
  }).addTo(map).bindPopup(
    '<div style="font-family: var(--heading-font, serif); font-size:1.15rem; font-weight:600;">Dar Safra</div>' +
    '<div style="font-size:.85rem; margin-top:.25rem;">Medina · Tangeri</div>'
  ).openPopup();
  map.dragging.disable(); map.touchZoom.disable(); map.doubleClickZoom.disable();
  map.on('focus', () => map.scrollWheelZoom.enable());
  map.on('blur', () => map.scrollWheelZoom.disable());
}

/* ===========================================================
   TWEAKS — visual directions
   =========================================================== */
const HERO_PHOTOS = {
  rooftop: 'foto/16.avif',
  salotto: 'foto/8.avif',
  vista: 'foto/27.avif',
  terrazza: 'foto/26.avif'
};

function applyTweaks(t) {
  const root = document.documentElement;
  if (t.theme) root.setAttribute('data-theme', t.theme);
  if (t.headingFont) root.setAttribute('data-font', t.headingFont);
  if (t.heroPhoto) {
    const url = HERO_PHOTOS[t.heroPhoto] || HERO_PHOTOS.rooftop;
    const hero = document.querySelector('.hero');
    if (hero) hero.style.setProperty('--hero-img', `url('${url}')`);
  }
}

function buildTweaksPanel() {
  const t = Object.assign({}, window.DS_TWEAKS);
  const panel = document.createElement('div');
  panel.id = 'tweaksPanel';
  panel.className = 'tweaks-panel';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div class="tw-head">
      <span>Tweaks</span>
      <button class="tw-close" id="twClose" aria-label="Chiudi">&times;</button>
    </div>
    <div class="tw-body">
      <div class="tw-group">
        <label class="tw-label">Direzione visiva</label>
        <div class="tw-seg" data-key="theme">
          <button data-val="classico">Classico</button>
          <button data-val="editoriale">Editoriale</button>
          <button data-val="mediterraneo">Mediterraneo</button>
        </div>
        <p class="tw-hint" id="twThemeHint"></p>
      </div>
      <div class="tw-group">
        <label class="tw-label">Carattere dei titoli</label>
        <div class="tw-seg" data-key="headingFont">
          <button data-val="crimson">Crimson</button>
          <button data-val="cormorant">Cormorant</button>
        </div>
      </div>
      <div class="tw-group">
        <label class="tw-label">Foto principale</label>
        <div class="tw-seg tw-seg-wrap" data-key="heroPhoto">
          <button data-val="rooftop">Rooftop</button>
          <button data-val="salotto">Salotto</button>
          <button data-val="vista">Vista mare</button>
          <button data-val="terrazza">Terrazza</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(panel);

  const hints = {
    classico: 'Terracotta e blu profondo: l\u2019identità attuale, più curata.',
    editoriale: 'Inchiostro e carta, tipografia ampia. Tono da rivista.',
    mediterraneo: 'Azzurro zellige, bianco e sole. Luminoso e arioso.'
  };

  function syncButtons() {
    panel.querySelectorAll('.tw-seg').forEach(seg => {
      const key = seg.dataset.key;
      seg.querySelectorAll('button').forEach(b =>
        b.classList.toggle('active', b.dataset.val === t[key]));
    });
    document.getElementById('twThemeHint').textContent = hints[t.theme] || '';
  }

  panel.querySelectorAll('.tw-seg').forEach(seg => {
    const key = seg.dataset.key;
    seg.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        t[key] = btn.dataset.val;
        applyTweaks(t);
        syncButtons();
        persistTweaks({ [key]: btn.dataset.val });
      });
    });
  });

  document.getElementById('twClose').addEventListener('click', () => {
    panel.style.display = 'none';
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  });

  syncButtons();
  return panel;
}

function persistTweaks(edits) {
  try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits }, '*'); } catch (e) {}
}

function initTweaks() {
  applyTweaks(window.DS_TWEAKS);
  // Register listener BEFORE announcing availability.
  window.addEventListener('message', (e) => {
    const d = e.data || {};
    if (d.type === '__activate_edit_mode') {
      (document.getElementById('tweaksPanel') || buildTweaksPanel()).style.display = 'flex';
    } else if (d.type === '__deactivate_edit_mode') {
      const p = document.getElementById('tweaksPanel');
      if (p) p.style.display = 'none';
    }
  });
  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
}

/* ---------- Boot ---------- */
document.addEventListener('DOMContentLoaded', () => {
  let saved = null;
  try { saved = localStorage.getItem('darsafra_lang'); } catch (e) {}
  setLanguage(saved || detectLanguage());
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang'))));
  initMenu();
  initNavScroll();
  initCarousels();
  renderGallery();
  initLightbox();
  initTweaks();
  initMap();
});
