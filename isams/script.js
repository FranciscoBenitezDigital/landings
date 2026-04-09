// ===================== HERO SLIDESHOW =====================
let currentSlide = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');

function goToSlide(idx) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = idx;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}
dots.forEach((dot, i) => dot.addEventListener('click', () => goToSlide(i)));
setInterval(() => goToSlide((currentSlide + 1) % slides.length), 5000);

// ===================== NAVBAR SCROLL =====================
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 80);
});

// ===================== REVEAL ON SCROLL =====================
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => observer.observe(el));

// ===================== COUNTER ANIMATION =====================
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.counted) {
      e.target.dataset.counted = true;
      const target = +e.target.dataset.target;
      const dur = 2000, step = target / (dur / 16);
      let current = 0;
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        e.target.textContent = Math.floor(current).toLocaleString();
      }, 16);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObserver.observe(el));

// ===================== PARTICLES =====================
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 20; i++) {
  const p = document.createElement('div');
  p.className = 'particle';
  p.style.cssText = `left:${Math.random()*100}%;width:${Math.random()*3+1}px;height:${Math.random()*3+1}px;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;`;
  particlesContainer.appendChild(p);
}

// ===================== FORM SUBMIT =====================
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = '✓ Solicitud Enviada';
  btn.style.background = 'linear-gradient(135deg,#22c55e,#16a34a)';
  setTimeout(() => {
    btn.textContent = 'Enviar Solicitud →';
    btn.style.background = '';
    e.target.reset();
  }, 3500);
  setTimeout(() => {
    window.open('https://api.whatsapp.com/send?phone=573185820553&text=Hola!%20Acabo%20de%20enviar%20un%20formulario%20de%20inter%C3%A9s%20en%20ISAMS.%20Quiero%20m%C3%A1s%20informaci%C3%B3n.', '_blank');
  }, 500);
}