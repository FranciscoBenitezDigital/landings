// ===== FILE PREVIEW UPDATE =====
    // Purpose: Show selected invoice filename and readiness state
    const fileInput = document.getElementById('fileInput');
    const filename = document.getElementById('filename');
    const status = document.getElementById('status');
    fileInput.addEventListener('change', () => {
      filename.textContent = fileInput.files[0] ? fileInput.files[0].name : 'Sin archivo';
      status.textContent = fileInput.files[0] ? 'Archivo cargado' : 'Listo para analizar';
    });

    // ===== FORM SUBMIT HANDLER =====
    // Purpose: Simulate AI analysis flow for the invoice scanner UI
    document.getElementById('scan').addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = 'Analizando con IA...';
      setTimeout(() => { status.textContent = 'Listo para enviar a Sheets'; }, 900);
    });