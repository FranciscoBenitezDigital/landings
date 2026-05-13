// ==========================================================================
    // CURSOR GLOW TRACKING
    // Function: updateCursorGlow(event)
    // Purpose: Moves the radial TechBlue background glow based on pointer position.
    // Trigger: Mouse movement across the document.
    // ==========================================================================
    function updateCursorGlow(event) {
      const x = `${event.clientX}px`;
      const y = `${event.clientY}px`;
      document.documentElement.style.setProperty("--cursor-x", x);
      document.documentElement.style.setProperty("--cursor-y", y);
    }

    // ==========================================================================
    // MOBILE MENU TOGGLE
    // Function: toggleMobileMenu()
    // Purpose: Opens and closes the responsive navigation menu on mobile devices.
    // Trigger: Click on the hamburger button in the sticky header.
    // ==========================================================================
    function toggleMobileMenu() {
      const menu = document.getElementById("mobileNavMenu");
      const toggle = document.getElementById("navMenuToggle");
      const isOpen = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute("aria-label", isOpen ? "Cerrar menú" : "Abrir menú");
    }

    // ==========================================================================
    // MOBILE MENU CLOSE ON LINK CLICK
    // Function: closeMobileMenu()
    // Purpose: Closes mobile navigation after selecting an anchor link.
    // Trigger: Click on any mobile navigation anchor.
    // ==========================================================================
    function closeMobileMenu() {
      const menu = document.getElementById("mobileNavMenu");
      const toggle = document.getElementById("navMenuToggle");
      menu.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Abrir menú");
    }

    // ==========================================================================
    // SCROLL REVEAL ANIMATIONS
    // Function: initializeScrollReveal()
    // Purpose: Adds visible class to sections/cards as they enter the viewport.
    // Trigger: DOMContentLoaded with IntersectionObserver.
    // ==========================================================================
    function initializeScrollReveal() {
      const revealElements = document.querySelectorAll(".reveal-on-scroll");

      if (!("IntersectionObserver" in window)) {
        revealElements.forEach(function revealImmediately(element) {
          element.classList.add("is-visible");
        });
        return;
      }

      const observer = new IntersectionObserver(function handleIntersect(entries) {
        entries.forEach(function revealEntry(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.16,
        rootMargin: "0px 0px -60px 0px"
      });

      revealElements.forEach(function observeElement(element) {
        observer.observe(element);
      });
    }

    // ==========================================================================
    // PREMIUM CARD POINTER TILT
    // Function: initializeCardTilt()
    // Purpose: Adds subtle pointer-responsive tilt to glass cards on desktop.
    // Trigger: Mouse movement over selected interactive cards.
    // ==========================================================================
    function initializeCardTilt() {
      const interactiveCards = document.querySelectorAll(".glass-card, .hero-visual-card");

      interactiveCards.forEach(function attachTilt(card) {
        card.addEventListener("mousemove", function handleCardMove(event) {
          if (window.matchMedia("(max-width: 768px)").matches) return;

          const rect = card.getBoundingClientRect();
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const rotateY = ((x / rect.width) - 0.5) * 5;
          const rotateX = ((0.5 - (y / rect.height)) * 5);

          card.style.transform = `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener("mouseleave", function resetCardTilt() {
          card.style.transform = "";
        });
      });
    }

    // ==========================================================================
    // PAGE INTERACTION INITIALIZER
    // Function: initializePageInteractions()
    // Purpose: Wires up motion, menu, reveal, and microinteraction behaviors.
    // Trigger: DOMContentLoaded event.
    // ==========================================================================
    function initializePageInteractions() {
      document.addEventListener("mousemove", updateCursorGlow);

      const menuToggle = document.getElementById("navMenuToggle");
      const mobileLinks = document.querySelectorAll(".mobile-nav-link");

      if (menuToggle) {
        menuToggle.addEventListener("click", toggleMobileMenu);
      }

      mobileLinks.forEach(function attachCloseHandler(link) {
        link.addEventListener("click", closeMobileMenu);
      });

      initializeScrollReveal();
      initializeCardTilt();
    }

    document.addEventListener("DOMContentLoaded", initializePageInteractions);