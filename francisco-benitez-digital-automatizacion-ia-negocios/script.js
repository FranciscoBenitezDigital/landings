tailwind.config={theme:{extend:{colors:{navy:'#080F22',cyan:'#00D9FF',teal:'#36D6B5'},fontFamily:{display:['Space Grotesk','sans-serif'],body:['Inter','sans-serif']}}}}

(function(){
    var bg=document.getElementById('heroBg');
    if(!bg)return;
    var ticking=false;
    function update(){
      var y=window.pageYOffset||document.documentElement.scrollTop;
      bg.style.transform='translateY('+(y*0.4)+'px)';
      ticking=false;
    }
    window.addEventListener('scroll',function(){
      if(!ticking){window.requestAnimationFrame(update);ticking=true;}
    },{passive:true});
    update();
  })();

// ======================== CALCULADORA V2 ========================
const USD_TO_MXN = 17.5;
let currentCurrency = 'MXN';
let ticketMXN = 0; // fuente de verdad en MXN (evita errores de redondeo al cambiar de moneda)

// Supuestos del modelo
const NIGHT_QUALITY = 0.75; // los leads nocturnos suelen cerrar menos que los normales
const COMEBACK = 0.5;       // escenario conservador: la mitad vuelve a escribir al dia siguiente
const RECOVERY = 0.5;       // recuperacion ilustrativa con chatbot

const industryData = {
  realestate: { after: 0.42, noReply: 0.36 },
  tourism: { after: 0.46, noReply: 0.34 },
  health: { after: 0.33, noReply: 0.28 },
  education: { after: 0.38, noReply: 0.31 },
  services: { after: 0.34, noReply: 0.30 },
  ecommerce: { after: 0.50, noReply: 0.26 },
  other: { after: 0.35, noReply: 0.30 }
};

function formatMoney(amountMXN) {
  let value = amountMXN;
  if (currentCurrency === 'USD') value = amountMXN / USD_TO_MXN;
  const symbol = currentCurrency === 'USD' ? 'USD $' : '$';
  return symbol + Math.round(value).toLocaleString('en-US');
}

function formatMoneyRange(lowMXN, highMXN) {
  const a = formatMoney(lowMXN), b = formatMoney(highMXN);
  return a === b ? a : a + ' – ' + b;
}

function fmt1(n) {
  return (Math.round(n * 10) / 10).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
}

function updateCurrencySymbol() {
  const symbolSpan = document.getElementById('currencySymbol');
  if (symbolSpan) symbolSpan.textContent = currentCurrency === 'USD' ? 'USD $' : '$';
}

function writeTicketInput() {
  const input = document.getElementById('ticket');
  if (!ticketMXN) { input.value = ''; return; }
  if (currentCurrency === 'USD') input.value = (ticketMXN / USD_TO_MXN).toFixed(2);
  else input.value = String(Math.round(ticketMXN * 100) / 100);
}

function toggleCurrency(currency) {
  if (currency === currentCurrency) return;
  currentCurrency = currency;
  updateCurrencySymbol();
  writeTicketInput();
  const btnMXN = document.getElementById('btnMXN'), btnUSD = document.getElementById('btnUSD'), note = document.getElementById('currencyNote');
  if (currency === 'USD') {
    btnUSD.style.background = 'linear-gradient(90deg,#00D9FF,#36D6B5)'; btnUSD.style.color = '#080F22';
    btnMXN.style.background = 'transparent'; btnMXN.style.color = '#94A3B8';
    if (note) note.classList.remove('hidden');
  } else {
    btnMXN.style.background = 'linear-gradient(90deg,#00D9FF,#36D6B5)'; btnMXN.style.color = '#080F22';
    btnUSD.style.background = 'transparent'; btnUSD.style.color = '#94A3B8';
    if (note) note.classList.add('hidden');
  }
  calc();
}

function readTicket() {
  let v = parseFloat(document.getElementById('ticket').value);
  if (isNaN(v) || v < 0) v = 0;
  ticketMXN = currentCurrency === 'USD' ? v * USD_TO_MXN : v;
}

function calc() {
  const industry = document.getElementById('industry').value;
  const ind = industryData[industry] || industryData.other;
  const leads = parseFloat(document.getElementById('leads').value) || 0;
  const closePercent = parseFloat(document.getElementById('close').value) || 0;
  const close = closePercent / 100;
  document.getElementById('leadsVal').textContent = leads;
  document.getElementById('closeVal').textContent = closePercent + '%';

  const afterHours = leads * 30 * ind.after;
  const unanswered = afterHours * ind.noReply;
  const lostHigh = unanswered * close * NIGHT_QUALITY;
  const lostLow = lostHigh * (1 - COMEBACK);

  const monthlyHigh = lostHigh * ticketMXN;
  const monthlyLow = lostLow * ticketMXN;

  document.getElementById('monthly').textContent = formatMoneyRange(monthlyLow, monthlyHigh);
  document.getElementById('daily').textContent = formatMoneyRange(monthlyLow / 30, monthlyHigh / 30);
  document.getElementById('annual').textContent = formatMoneyRange(monthlyLow * 12, monthlyHigh * 12);
  document.getElementById('afterH').textContent = Math.round(afterHours);
  document.getElementById('lostC').textContent = (fmt1(lostLow) === fmt1(lostHigh)) ? fmt1(lostHigh) : fmt1(lostLow) + ' – ' + fmt1(lostHigh);

  const hasLoss = monthlyHigh > 0;
  document.getElementById('barBefore').style.width = hasLoss ? '100%' : '0%';
  document.getElementById('barAfter').style.width = hasLoss ? ((1 - RECOVERY) * 100) + '%' : '0%';

  const concl = document.getElementById('conclusion');
  if (!hasLoss) {
    concl.textContent = 'Mueve los controles de la izquierda para ver tu estimación.';
  } else {
    concl.textContent = 'Estimamos que podrías estar dejando de ganar entre ' + formatMoneyRange(monthlyLow, monthlyHigh) + ' al mes. Un chatbot IA 24/7 podría ayudarte a recuperar una parte (ilustrativamente ~' + Math.round(RECOVERY * 100) + '%, o sea ' + formatMoneyRange(monthlyLow * RECOVERY, monthlyHigh * RECOVERY) + ' al mes) al responder siempre a tiempo.';
  }
}

document.getElementById('industry').addEventListener('input', calc);
document.getElementById('leads').addEventListener('input', calc);
document.getElementById('ticket').addEventListener('input', () => { readTicket(); calc(); });
document.getElementById('close').addEventListener('input', calc);
updateCurrencySymbol();
readTicket();
calc();

// ======================== RESTO DE SCRIPTS ========================
document.getElementById('hamburger').addEventListener('click', () => {
  const m = document.getElementById('mobileMenu');
  m.classList.toggle('hidden'); m.classList.toggle('flex');
});
document.querySelectorAll('#mobileMenu a').forEach(a => a.addEventListener('click', () => {
  const m = document.getElementById('mobileMenu'); m.classList.add('hidden'); m.classList.remove('flex');
}));

const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 40) { header.style.background = 'rgba(8,15,34,.85)'; header.style.backdropFilter = 'blur(14px)'; }
  else { header.style.background = 'transparent'; header.style.backdropFilter = 'none'; }
});

if (window.matchMedia('(min-width:768px)').matches) {
  const dot = document.getElementById('cursorDot'), ring = document.getElementById('cursorRing');
  let mx = 0, my = 0, rx = 0, ry = 0;
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx + 'px'; dot.style.top = my + 'px'; });
  function loop() { rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18; ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; requestAnimationFrame(loop); }
  loop();
  document.querySelectorAll('a, button, input, select').forEach(el => {
    el.addEventListener('mouseenter', () => { ring.style.width = '54px'; ring.style.height = '54px'; });
    el.addEventListener('mouseleave', () => { ring.style.width = '38px'; ring.style.height = '38px'; });
  });
}

const canvas = document.getElementById('particles'), ctx = canvas.getContext('2d');
let particles = [];
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
window.addEventListener('resize', resize);
function initParticles() {
  particles = [];
  const count = Math.min(80, Math.floor(innerWidth / 18));
  for (let i = 0; i < count; i++) particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, c: Math.random() > 0.5 ? '0,217,255' : '54,214,181' });
}
initParticles();
function drawParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fillStyle = 'rgba(' + p.c + ',.7)'; ctx.fill();
  });
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 120) { ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.strokeStyle = 'rgba(0,217,255,' + (0.12 * (1 - d / 120)) + ')'; ctx.lineWidth = 0.6; ctx.stroke(); }
    }
  }
  requestAnimationFrame(drawParticles);
}
drawParticles();

const glow = document.getElementById('heroGlow');
if (glow) {
  window.addEventListener('mousemove', e => {
    const x = (e.clientX / innerWidth - 0.5) * 40, y = (e.clientY / innerHeight - 0.5) * 40;
    glow.style.transform = `translate(${x}px, ${y}px)`;
  });
}

const revObs = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); revObs.unobserve(en.target); } });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      const el = en.target, target = +el.dataset.target;
      let cur = 0;
      const step = target / 60;
      const tick = () => {
        cur += step;
        if (cur < target) { el.textContent = Math.floor(cur).toLocaleString('en-US'); requestAnimationFrame(tick); }
        else { el.textContent = target.toLocaleString('en-US'); }
      };
      tick();
      counterObs.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));