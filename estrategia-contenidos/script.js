function updateCursorGlow(event) {
      document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
    }

    function toggleMobileMenu() {
      const menu = document.getElementById("mobileNavMenu");
      const toggle = document.getElementById("navMenuToggle");
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    }

    function closeMobileMenu() {
      const menu = document.getElementById("mobileNavMenu");
      const toggle = document.getElementById("navMenuToggle");
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
    }

    function initializeScrollReveal() {
      const revealElements = document.querySelectorAll(".reveal-on-scroll");

      if (!("IntersectionObserver" in window)) {
        revealElements.forEach((element) => element.classList.add("is-visible"));
        return;
      }

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.16,
        rootMargin: "0px 0px -60px 0px"
      });

      revealElements.forEach((element) => observer.observe(element));
    }

    function initializeCardTilt() {
      const interactiveCards = document.querySelectorAll(".glass-card, .hero-visual-card");

      interactiveCards.forEach((card) => {
        card.addEventListener("mousemove", (event) => {
          if (window.matchMedia("(max-width: 768px)").matches) return;

          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const rotateY = ((x / rect.width) - 0.5) * 5;
          const rotateX = ((0.5 - (y / rect.height)) * 5);

          card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener("mouseleave", () => {
          card.style.transform = "";
        });
      });
    }

    document.addEventListener("DOMContentLoaded", () => {
      document.addEventListener("mousemove", updateCursorGlow);

      const menuToggle = document.getElementById("navMenuToggle");
      const mobileLinks = document.querySelectorAll(".mobile-nav-link");

      if (menuToggle) {
        menuToggle.addEventListener("click", toggleMobileMenu);
      }

      mobileLinks.forEach((link) => link.addEventListener("click", closeMobileMenu));

      initializeScrollReveal();
      initializeCardTilt();
    });