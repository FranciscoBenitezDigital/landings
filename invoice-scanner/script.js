tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#1E3A5F',
                        success: '#28A745',
                        background: '#F8F9FA',
                    },
                    fontFamily: {
                        sans: ['Inter', 'sans-serif'],
                    },
                }
            }
        }

// ===== STATE MANAGEMENT =====
    let currentBase64 = null;
    let currentMimeType = null;
    let extractedData = null;

    // ===== DOM ELEMENTS =====
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    const imagePreview = document.getElementById('imagePreview');
    const imageNameLabel = document.getElementById('imageName');
    const removeImageBtn = document.getElementById('removeImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultsSection = document.getElementById('resultsSection');
    const statusMsg = document.getElementById('statusMsg');
    const apiKeyInput = document.getElementById('apiKey');
    const saveSheetsBtn = document.getElementById('saveSheetsBtn');

    // ===== UI HELPERS =====
    
    // Function: showToast()
    // Purpose: Display temporary notification to user
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast-in pointer-events-auto px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 text-white font-medium ${type === 'success' ? 'bg-success' : type === 'error' ? 'bg-red-500' : 'bg-primary'}`;
        
        const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';
        toast.innerHTML = `<span class="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 font-black">${icon}</span> <span>${message}</span>`;
        
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(20px)';
            toast.style.transition = 'all 0.5s ease-out';
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    }

    // Function: updateStatus()
    // Purpose: Show current process stage
    function updateStatus(text) {
        statusMsg.innerText = text;
    }

    // ===== IMAGE PROCESSING =====

    // Function: compressImage() - AS REQUESTED
    // Purpose: Resize and compress image to fit API limits (4MB)
    async function compressImage(base64, mimeType) { 
        return new Promise((resolve) => { 
            const img = new Image(); 
            img.onload = () => { 
                const maxDim = 1800; 
                let scale = 1; 
                if (img.width > maxDim || img.height > maxDim) { 
                    scale = Math.min(maxDim / img.width, maxDim / img.height); 
                } 
                const canvas = document.createElement('canvas'); 
                canvas.width = Math.round(img.width * scale); 
                canvas.height = Math.round(img.height * scale); 
                canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height); 
                const tryQ = (q) => { 
                    const out = canvas.toDataURL('image/jpeg', q); 
                    const bytes = (out.length - 'data:image/jpeg;base64,'.length) * 0.75; 
                    if (bytes <= 4 * 1024 * 1024 || q <= 0.3) 
                        resolve({ base64: out.split(',')[1], mimeType: 'image/jpeg' }); 
                    else 
                        tryQ(q - 0.1); 
                }; 
                tryQ(0.85); 
            }; 
            img.src = 'data:' + mimeType + ';base64,' + base64; 
        });
    }

    // Function: handleFileSelection()
    // Purpose: Read selected file and show preview
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            showToast('Por favor sube solo archivos de imagen', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            currentBase64 = e.target.result.split(',')[1];
            currentMimeType = file.type;
            
            imagePreview.src = e.target.result;
            imageNameLabel.innerText = file.name;
            
            uploadPlaceholder.classList.add('hidden');
            previewContainer.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            extractedData = null;
        };
        reader.readAsDataURL(file);
    }

    // Drag & Drop listeners
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => { if (e.target.files.length) handleFile(e.target.files[0]); });

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentBase64 = null;
        previewContainer.classList.add('hidden');
        uploadPlaceholder.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        fileInput.value = '';
    });

    // ===== API INTEGRATION =====

    // Function: runAnalysis()
    // Purpose: Coordinate compression and Claude Vision API call
    async function runAnalysis() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            showToast('Ingresa tu API Key de Anthropic', 'error');
            apiKeyInput.focus();
            return;
        }
        if (!currentBase64) {
            showToast('Sube una imagen de factura primero', 'error');
            return;
        }

        analyzeBtn.disabled = true;
        document.getElementById('btnText').innerText = 'Procesando...';
        document.getElementById('btnLoader').classList.remove('hidden');
        
        try {
            updateStatus('Optimizando imagen...');
            // PASO A — Compresión de imagen
            const compressed = await compressImage(currentBase64, currentMimeType);
            
            updateStatus('Analizando contenido con IA (Claude Vision)...');
            // PASO B — Llamada a Claude Vision
            const response = await fetch('https://api.anthropic.com/v1/messages', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-api-key': apiKey, 
                    'anthropic-version': '2023-06-01', 
                    'anthropic-dangerous-direct-browser-access': 'true' 
                }, 
                body: JSON.stringify({ 
                    model: 'claude-3-5-sonnet-20241022', // Standard production model
                    max_tokens: 1000, 
                    system: 'Eres un extractor de datos de facturas. Responde ÚNICAMENTE con JSON válido sin markdown ni texto extra. Estructura exacta: {"proveedor":"","cliente":"","numero_factura":"","fecha":"","moneda":"MXN","items":[{"descripcion":"","cantidad":"","precio_unitario":"","total_item":""}],"subtotal":"","iva":"","descuento":"0","total":"","notas":""}', 
                    messages: [{ 
                        role: 'user', 
                        content: [ 
                            { type: 'image', source: { type: 'base64', media_type: compressed.mimeType, data: compressed.base64 }}, 
                            { type: 'text', text: 'Extrae todos los datos de esta factura en el formato JSON especificado.' } 
                        ]
                    }] 
                }) 
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error?.message || 'Error en la API');
            }

            const data = await response.json();
            const text = data.content[0].text;
            const clean = text.replace(/```json|```/g,'').trim();
            const parsed = JSON.parse(clean);
            
            extractedData = parsed;
            renderResults(parsed);
            showToast('Factura procesada con éxito', 'success');
            
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
        } finally {
            analyzeBtn.disabled = false;
            document.getElementById('btnText').innerText = 'Analizar Factura';
            document.getElementById('btnLoader').classList.add('hidden');
            updateStatus('');
        }
    }

    // Function: renderResults()
    // Purpose: Display extracted JSON data in the UI
    function renderResults(data) {
        document.getElementById('res-proveedor').innerText = data.proveedor || 'No detectado';
        document.getElementById('res-numero').innerText = data.numero_factura || 'N/A';
        document.getElementById('res-fecha').innerText = data.fecha || 'N/A';
        document.getElementById('res-moneda').innerText = data.moneda || 'MXN';
        
        const itemsBody = document.getElementById('res-items-body');
        itemsBody.innerHTML = '';
        
        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const tr = document.createElement('tr');
                tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';
                tr.innerHTML = `
                    <td class="px-4 py-3 font-medium text-slate-700">${item.descripcion || 'Concepto'}</td>
                    <td class="px-4 py-3 text-slate-500">${item.cantidad || '1'}</td>
                    <td class="px-4 py-3 text-slate-500">${item.precio_unitario || '-'}</td>
                    <td class="px-4 py-3 font-semibold text-slate-800">${item.total_item || '-'}</td>
                `;
                itemsBody.appendChild(tr);
            });
        } else {
            itemsBody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-slate-400 italic">No se encontraron conceptos detallados</td></tr>';
        }

        document.getElementById('res-subtotal').innerText = data.subtotal || '$0.00';
        document.getElementById('res-iva').innerText = data.iva || '$0.00';
        document.getElementById('res-total').innerText = data.total || '$0.00';
        document.getElementById('res-notas').innerText = data.notas || 'Sin notas adicionales.';
        
        if (data.descuento && data.descuento !== "0") {
            document.getElementById('row-descuento').classList.remove('hidden');
            document.getElementById('res-descuento').innerText = `-${data.descuento}`;
        } else {
            document.getElementById('row-descuento').classList.add('hidden');
        }

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Function: saveToSheets()
    // Purpose: Use MCP tool via Claude to append data to Google Sheets
    async function saveToSheets() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey || !extractedData) return;

        saveSheetsBtn.disabled = true;
        document.getElementById('saveBtnText').innerText = 'Sincronizando...';
        document.getElementById('saveBtnLoader').classList.remove('hidden');

        try {
            // PASO C — Botón Google Sheets
            const response = await fetch('https://api.anthropic.com/v1/messages', { 
                method: 'POST', 
                headers: { 
                    'Content-Type': 'application/json', 
                    'x-api-key': apiKey, 
                    'anthropic-version': '2023-06-01', 
                    'anthropic-dangerous-direct-browser-access': 'true' 
                }, 
                body: JSON.stringify({ 
                    model: 'claude-3-5-sonnet-20241022', 
                    max_tokens: 1000, 
                    mcp_servers: [{ type: 'url', url: 'https://paymegpt.com/mcp', name: 'paymegpt-mcp' }],
                    messages: [{ 
                        role: 'user', 
                        content: `Usa la herramienta de Google Sheets para agregar una fila a la hoja "Facturas". 
                        Columnas a llenar con estos datos:
                        Fecha: ${extractedData.fecha}
                        N°Factura: ${extractedData.numero_factura}
                        Proveedor: ${extractedData.proveedor}
                        Cliente: ${extractedData.cliente}
                        Moneda: ${extractedData.moneda}
                        Subtotal: ${extractedData.subtotal}
                        IVA: ${extractedData.iva}
                        Descuento: ${extractedData.descuento}
                        Total: ${extractedData.total}
                        ${extractedData.items.slice(0, 5).map((it, i) => `Concepto_${i+1}: ${it.descripcion}, Cantidad_${i+1}: ${it.cantidad}, PrecioUnit_${i+1}: ${it.precio_unitario}, Total_${i+1}: ${it.total_item}`).join('\n')}
                        
                        Confirma cuando esté listo.`
                    }] 
                }) 
            });

            if (!response.ok) throw new Error('Error al conectar con el servicio de Sheets');

            showToast('Sincronizado con Google Sheets con éxito', 'success');
        } catch (error) {
            console.error(error);
            showToast('Error al guardar: ' + error.message, 'error');
        } finally {
            saveSheetsBtn.disabled = false;
            document.getElementById('saveBtnText').innerText = 'Guardar en Google Sheets';
            document.getElementById('saveBtnLoader').classList.add('hidden');
        }
    }

    // Event Listeners for main actions
    analyzeBtn.addEventListener('click', runAnalysis);
    saveSheetsBtn.addEventListener('click', saveToSheets);