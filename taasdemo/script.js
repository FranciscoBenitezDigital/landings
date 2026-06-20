(function() {
      const dot = document.getElementById('cursorDot');
      if (window.matchMedia('(hover: none)').matches) return;
      document.addEventListener('mousemove', e => {
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
      });
      document.querySelectorAll('a, button, .btn').forEach(el => {
        el.addEventListener('mouseenter', () => dot.classList.add('grow'));
        el.addEventListener('mouseleave', () => dot.classList.remove('grow'));
      });
    })();

    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    });

    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        const circle = document.createElement('span');
        const d = Math.max(this.clientWidth, this.clientHeight);
        const rect = this.getBoundingClientRect();
        circle.style.width = circle.style.height = d + 'px';
        circle.style.left = (e.clientX - rect.left - d/2) + 'px';
        circle.style.top = (e.clientY - rect.top - d/2) + 'px';
        circle.className = 'ripple';
        const existing = this.querySelector('.ripple');
        if (existing) existing.remove();
        this.appendChild(circle);
      });
    });

    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

    function animateCounter(el) {
      const target = parseFloat(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = Math.floor(eased * target);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target + suffix;
      }
      requestAnimationFrame(tick);
    }
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    (function() {
      const canvas = document.getElementById('particles');
      const ctx = canvas.getContext('2d');
      let w, h, particles = [];
      const mouse = { x: -9999, y: -9999 };

      function resize() {
        const hero = canvas.parentElement;
        w = canvas.width = hero.offsetWidth;
        h = canvas.height = hero.offsetHeight;
      }
      function initParticles() {
        const count = Math.min(80, Math.floor(w / 16));
        particles = [];
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 2 + 1
          });
        }
      }
      function draw() {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            p.x += (dx / dist) * 1.4;
            p.y += (dy / dist) * 1.4;
          }
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(214,58,249,0.6)';
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const q = particles[j];
            const ddx = p.x - q.x, ddy = p.y - q.y;
            const d = Math.sqrt(ddx*ddx + ddy*ddy);
            if (d < 110) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(q.x, q.y);
              ctx.strokeStyle = 'rgba(214,58,249,' + (0.14 * (1 - d/110)) + ')';
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      }
      window.addEventListener('resize', () => { resize(); initParticles(); });
      const hero = canvas.parentElement;
      hero.addEventListener('mousemove', e => {
        const rect = hero.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      });
      hero.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
      resize(); initParticles(); draw();
    })();