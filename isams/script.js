// SLIDESHOW
let cur = 0;
const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.hero-dot');
function goTo(i) {
  slides[cur].classList.remove('active'); dots[cur].classList.remove('active');
  cur = i; slides[cur].classList.add('active'); dots[cur].classList.add('active');
}
dots.forEach((d,i) => d.addEventListener('click', () => goTo(i)));
const heroAutoMs = window.innerWidth <= 768 ? 3200 : 5500;
setInterval(() => goTo((cur + 1) % slides.length), heroAutoMs);

// REVEAL ON SCROLL
const obs = new IntersectionObserver(e => e.forEach(x => { if(x.isIntersecting) x.target.classList.add('visible'); }), { threshold: 0.1 });
document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => obs.observe(el));

// COUNTER
const cObs = new IntersectionObserver(e => {
  e.forEach(x => {
    if(x.isIntersecting && !x.target.dataset.done) {
      x.target.dataset.done = 1;
      const t = +x.target.dataset.target, dur = 1800, step = t/(dur/16); let v = 0;
      const tick = setInterval(() => { v += step; if(v >= t){v=t;clearInterval(tick);} x.target.textContent = Math.floor(v).toLocaleString(); }, 16);
    }
  });
}, { threshold: 0.4 });
document.querySelectorAll('.counter').forEach(el => cObs.observe(el));

// FORM
function handleSubmit(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.form-submit');
  btn.textContent = '✓ Solicitud Enviada';
  btn.style.background = 'var(--green-cta)';
  setTimeout(() => { btn.textContent = 'Enviar Solicitud →'; btn.style.background = ''; e.target.reset(); }, 3200);
  setTimeout(() => { window.open('https://api.whatsapp.com/send?phone=573185820553&text=Hola!%20Envié%20formulario%20de%20interés%20en%20ISAMS.', '_blank'); }, 600);
}