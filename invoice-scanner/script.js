// ===== FORM SUBMIT HANDLER =====
    // Purpose: Prevent default submission for the internal demo flow
    document.getElementById('carga').addEventListener('submit', function (e) {
      e.preventDefault();
      alert('Factura enviada al flujo interno.');
    });