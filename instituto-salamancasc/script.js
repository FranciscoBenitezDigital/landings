tailwind.config = {
    theme: {
      extend: {
        colors: {
          brand: {
            red: '#E30613',
            redDark: '#B8050F',
            navy: '#0F172A',
            beige: '#F7F1E8',
            gold: '#C9A646',
            light: '#F5F5F5'
          }
        },
        fontFamily: {
          serif: ['Playfair Display', 'serif'],
          sans: ['Inter', 'sans-serif']
        }
      }
    }
  }

// Menú móvil
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMenuBtn = document.getElementById('closeMenuBtn');
  const menuOverlay = document.getElementById('menuOverlay');
  const body = document.body;
  function openMenu() { mobileMenu.classList.add('open'); menuOverlay.classList.add('active'); body.style.overflow = 'hidden'; }
  function closeMenu() { mobileMenu.classList.remove('open'); menuOverlay.classList.remove('active'); body.style.overflow = ''; }
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (closeMenuBtn) closeMenuBtn.addEventListener('click', closeMenu);
  if (menuOverlay) menuOverlay.addEventListener('click', closeMenu);
  document.querySelectorAll('.mob-link').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mobileMenu.classList.contains('open')) closeMenu(); });

  // Navbar scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => { if (window.scrollY > 30) navbar.classList.add('scrolled'); else navbar.classList.remove('scrolled'); });

  // Reveal + counter
  const observer = new IntersectionObserver(entries => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); const counter = e.target.querySelector('.counter'); if (counter && !counter.dataset.done) { counter.dataset.done = '1'; const target = +counter.dataset.target; let n = 0; const step = Math.max(1, Math.ceil(target / 50)); const tick = setInterval(() => { n += step; if (n >= target) { n = target; clearInterval(tick); } counter.textContent = n; }, 30); } } }); }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Galería filtros
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  filterBtns.forEach(btn => { btn.addEventListener('click', () => { filterBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); const f = btn.dataset.filter; galleryItems.forEach(item => { const show = f === 'all' || item.dataset.cat === f; item.style.display = show ? '' : 'none'; }); }); });

  // Lightbox
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightboxImg');
  galleryItems.forEach(item => { item.addEventListener('click', () => { lbImg.src = item.dataset.img; lb.classList.add('active'); }); });
  document.getElementById('lightboxClose').addEventListener('click', () => lb.classList.remove('active'));
  lb.addEventListener('click', e => { if (e.target === lb) lb.classList.remove('active'); });

  // FAQ acordeón
  document.querySelectorAll('.acc-trigger').forEach(t => { t.addEventListener('click', () => { const item = t.parentElement; const wasOpen = item.classList.contains('open'); document.querySelectorAll('.acc-item').forEach(i => i.classList.remove('open')); if (!wasOpen) item.classList.add('open'); }); });

  // Parallax
  const px = document.getElementById('parallaxImg');
  if (px) { window.addEventListener('scroll', () => { const rect = px.getBoundingClientRect(); if (rect.top < window.innerHeight && rect.bottom > 0) { px.style.transform = `translateY(${(rect.top - window.innerHeight / 2) * 0.05}px)`; } }); }

  // Botón volver arriba
  const goTopBtn = document.getElementById('goTopBtn');
  window.addEventListener('scroll', () => { if (window.scrollY > 400) goTopBtn.classList.add('show'); else goTopBtn.classList.remove('show'); });
  goTopBtn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });