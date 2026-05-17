// ===== INTERSECTION OBSERVER: Fade-in on scroll =====
  // Purpose: Animate section headings and cards as they enter the viewport
  // Trigger: Element crosses 10% of viewport
  (function() {
    // Add fade-in-scroll class to all major section children
    const targets = document.querySelectorAll(
      '[data-section] h2, [data-section] .card-dark, [data-section] .stat-card, [data-section] .kpi-card, [data-section] .phase-card, [data-section] .callout-gold, [data-section] .quote-box'
    );

    // Apply initial hidden state
    targets.forEach(function(el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Create observer
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    // Observe each target
    targets.forEach(function(el) {
      observer.observe(el);
    });
  })();

  // ===== STAGGER ANIMATION for grid items =====
  // Purpose: Add sequential delay to grid cards for visual richness
  (function() {
    const grids = document.querySelectorAll('.grid');
    grids.forEach(function(grid) {
      const children = grid.children;
      Array.from(children).forEach(function(child, index) {
        child.style.transitionDelay = (index * 0.08) + 's';
      });
    });
  })();

  // ===== TABLE SCROLL HINT ACCESSIBILITY =====
  // Purpose: Keep mobile table wrappers keyboard-focusable and communicate horizontal scrolling through aria labels
  // Trigger: Runs once on page load for table regions
  (function() {
    const tableRegions = document.querySelectorAll('.table-scroll-region');
    tableRegions.forEach(function(region) {
      region.addEventListener('scroll', function() {
        if (region.scrollLeft > 12) {
          region.setAttribute('data-user-scrolled', 'true');
        }
      }, { passive: true });
    });
  })();