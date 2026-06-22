const slides = Array.from(document.querySelectorAll(".slide"));
    const counter = document.getElementById("counter");
    const progressFill = document.getElementById("progressFill");
    const controls = document.getElementById("controls");
    const notesToggle = document.getElementById("notesToggle");
    let notesWindow = null;
    let currentSlide = 0;
    let hideTimer = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function addFooters() {
      slides.forEach((slide, index) => {
        const inner = slide.querySelector(".inner");
        if (!inner || index === 0 || index === slides.length - 1) return;
        const footer = document.createElement("div");
        footer.className = "footer";
        footer.innerHTML = `<span>Francisco Benítez Digital</span><span>${String(index + 1).padStart(2, "0")}</span>`;
        inner.appendChild(footer);
      });
    }

    function showSlide(index) {
      const nextIndex = Math.max(0, Math.min(index, slides.length - 1));
      slides.forEach((slide, i) => {
        slide.classList.toggle("active", i === nextIndex);
      });
      currentSlide = nextIndex;
      counter.textContent = `${currentSlide + 1} / ${slides.length}`;
      progressFill.style.width = `${((currentSlide + 1) / slides.length) * 100}%`;
      document.title = `${slides[currentSlide].dataset.title || "Presentación"} · tâas`;
      updateNotesWindow();
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    function toggleFullscreen() {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    function revealControls() {
      controls.classList.remove("hidden");
      notesToggle.style.opacity = "1";
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        controls.classList.add("hidden");
        notesToggle.style.opacity = "0.35";
      }, 2600);
    }

    function notesDocumentHtml() {
      return `<!doctype html>
<html lang="es-MX">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  
  
</head>
<body>
  <header>
    <h1 id="title">Notas del orador</h1>
    <div id="counter"></div>
  </header>
  <main>
    <div id="note"></div>
    <div class="actions">
      <button type="button" onclick="window.opener && window.opener.prevSlide()">Anterior</button>
      <button type="button" onclick="window.opener && window.opener.nextSlide()">Siguiente</button>
      <button class="secondary" type="button" onclick="window.close()">Cerrar notas</button>
    </div>
    <small>Esta ventana se sincroniza con la diapositiva activa. Atajo en la presentación: tecla N.</small>
  </main>
</body>
</html>`;
    }

    function openNotesWindow() {
      if (notesWindow && !notesWindow.closed) {
        notesWindow.focus();
        updateNotesWindow();
        return;
      }
      notesWindow = window.open("", "speakerNotes", "width=620,height=740,resizable=yes,scrollbars=yes");
      if (!notesWindow) {
        alert("El navegador bloqueó la ventana de notas. Permite ventanas emergentes para este archivo.");
        return;
      }
      notesWindow.document.open();
      notesWindow.document.write(notesDocumentHtml());
      notesWindow.document.close();
      setTimeout(updateNotesWindow, 80);
    }

    function updateNotesWindow() {
      if (!notesWindow || notesWindow.closed) return;
      const note = slides[currentSlide].dataset.notes || "Sin notas para esta diapositiva.";
      const title = slides[currentSlide].dataset.title || "Diapositiva";
      const titleEl = notesWindow.document.getElementById("title");
      const counterEl = notesWindow.document.getElementById("counter");
      const noteEl = notesWindow.document.getElementById("note");
      if (titleEl) titleEl.textContent = title;
      if (counterEl) counterEl.textContent = `Diapositiva ${currentSlide + 1} de ${slides.length}`;
      if (noteEl) noteEl.textContent = note;
    }

    document.getElementById("firstBtn").addEventListener("click", () => showSlide(0));
    document.getElementById("prevBtn").addEventListener("click", prevSlide);
    document.getElementById("nextBtn").addEventListener("click", nextSlide);
    document.getElementById("lastBtn").addEventListener("click", () => showSlide(slides.length - 1));
    document.getElementById("fullscreenBtn").addEventListener("click", toggleFullscreen);

    notesToggle.addEventListener("click", () => {
      openNotesWindow();
      revealControls();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "ArrowRight" || event.key === " " || event.key === "PageDown") {
        event.preventDefault();
        nextSlide();
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        prevSlide();
      }
      if (event.key === "Home") showSlide(0);
      if (event.key === "End") showSlide(slides.length - 1);
      if (event.key.toLowerCase() === "f") toggleFullscreen();
      if (event.key.toLowerCase() === "n") openNotesWindow();
      revealControls();
    });

    document.addEventListener("mousemove", revealControls);
    document.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0].screenX;
      touchStartY = event.changedTouches[0].screenY;
      revealControls();
    }, { passive: true });

    document.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].screenX - touchStartX;
      const dy = event.changedTouches[0].screenY - touchStartY;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        dx < 0 ? nextSlide() : prevSlide();
      }
    }, { passive: true });

    addFooters();
    showSlide(0);
    revealControls();