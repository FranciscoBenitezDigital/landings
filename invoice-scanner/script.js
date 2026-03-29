/* ===== DOM ELEMENTS ===== */
        const apiKeyInput = document.getElementById('apiKey');
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const uploadPrompt = document.getElementById('uploadPrompt');
        const previewContainer = document.getElementById('previewContainer');
        const imagePreview = document.getElementById('imagePreview');
        const removeImage = document.getElementById('removeImage');
        const fileNameDisplay = document.getElementById('fileNameDisplay');
        const analyzeBtn = document.getElementById('analyzeBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        const resultsSection = document.getElementById('resultsSection');
        const saveSheetsBtn = document.getElementById('saveSheetsBtn');

        let currentImageData = null;
        let currentMediaType = null;
        let lastParsedData = null;

        /* ===== FILE HANDLING ===== */

        // Trigger file input on click
        dropZone.addEventListener('click', () => {
            if (!currentImageData) fileInput.click();
        });

        // Handle file selection
        fileInput.addEventListener('change', (e) => {
            handleFile(e.target.files[0]);
        });

        // Drag and drop event listeners
        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.add('drop-zone--over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                dropZone.classList.remove('drop-zone--over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            handleFile(e.dataTransfer.files[0]);
        });

        // Remove image action
        removeImage.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUpload();
        });

        /**
         * Function: handleFile(file)
         * Purpose: Process and preview the selected invoice image
         */
        function handleFile(file) {
            if (!file || !file.type.startsWith('image/')) {
                showToast('Por favor sube un archivo de imagen válido', 'error');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                currentImageData = e.target.result.split(',')[1];
                currentMediaType = file.type;
                
                imagePreview.src = e.target.result;
                fileNameDisplay.textContent = file.name;
                
                uploadPrompt.classList.add('hidden-section');
                previewContainer.classList.remove('hidden-section');
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }

        function resetUpload() {
            currentImageData = null;
            currentMediaType = null;
            fileInput.value = '';
            imagePreview.src = '';
            uploadPrompt.classList.remove('hidden-section');
            previewContainer.classList.add('hidden-section');
            analyzeBtn.disabled = true;
            resultsSection.classList.add('hidden-section');
        }

        /* ===== API INTEGRATION ===== */

        /**
         * Function: analyzeInvoice()
         * Purpose: Call Anthropic Claude Vision API to extract invoice data
         */
        async function analyzeInvoice() {
            const apiKey = apiKeyInput.value.trim();
            
            if (!apiKey) {
                showToast('Por favor ingresa tu API Key de Anthropic', 'error');
                return;
            }

            // UI Loading state
            analyzeBtn.disabled = true;
            btnText.textContent = 'Analizando...';
            btnLoader.classList.remove('hidden-section');

            try {
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': apiKey,
                        'anthropic-version': '2023-06-01',
                        'anthropic-dangerous-direct-browser-access': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022', // Updated to latest stable vision model
                        max_tokens: 1500,
                        system: 'Eres un extractor de datos de facturas experto. Responde ÚNICAMENTE con JSON válido sin markdown ni texto adicional. Estructura: {"proveedor":"","cliente":"","numero_factura":"","fecha":"","moneda":"MXN","items":[{"descripcion":"","cantidad":"","precio_unitario":"","total_item":""}],"subtotal":"","iva":"","descuento":"0","total":"","notas":""}',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'image', source: { type: 'base64', media_type: currentMediaType, data: currentImageData } },
                                { type: 'text', text: 'Extrae todos los datos de esta factura en el formato JSON especificado.' }
                            ]
                        }]
                    })
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error?.message || 'Error en la API');
                }

                const data = await response.json();
                const text = data.content[0].text;
                const clean = text.replace(/```json|```/g, '').trim();
                const parsed = JSON.parse(clean);
                
                lastParsedData = parsed;
                renderResults(parsed);
                showToast('Factura procesada con éxito', 'success');
                
            } catch (err) {
                console.error(err);
                showToast(`Error: ${err.message}`, 'error');
            } finally {
                analyzeBtn.disabled = false;
                btnText.textContent = 'Analizar Factura';
                btnLoader.classList.add('hidden-section');
            }
        }

        /**
         * Function: renderResults(data)
         * Purpose: Fill the UI with extracted data from JSON
         */
        function renderResults(data) {
            document.getElementById('resProvider').textContent = data.proveedor || 'N/A';
            document.getElementById('resClient').textContent = data.cliente || 'N/A';
            document.getElementById('resInvoiceNum').textContent = data.numero_factura || 'N/A';
            document.getElementById('resDate').textContent = data.fecha || 'N/A';
            document.getElementById('resCurrency').textContent = data.moneda || 'N/A';
            document.getElementById('resSubtotal').textContent = data.subtotal || '$0.00';
            document.getElementById('resIva').textContent = data.iva || '$0.00';
            document.getElementById('resDiscount').textContent = data.descuento || '$0.00';
            document.getElementById('resTotal').textContent = data.total || '$0.00';
            document.getElementById('resNotes').textContent = data.notas || 'Sin notas adicionales.';

            const tbody = document.getElementById('itemsBody');
            tbody.innerHTML = '';

            if (data.items && Array.isArray(data.items)) {
                data.items.forEach((item, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td class="px-6 py-4 text-gray-400 font-mono text-xs">${index + 1}</td>
                        <td class="px-6 py-4 font-medium">${item.descripcion || '---'}</td>
                        <td class="px-6 py-4 text-center">${item.cantidad || '1'}</td>
                        <td class="px-6 py-4 text-right">${item.precio_unitario || '---'}</td>
                        <td class="px-6 py-4 text-right font-semibold">${item.total_item || '---'}</td>
                    `;
                    tbody.appendChild(row);
                });
            }

            resultsSection.classList.remove('hidden-section');
            window.scrollTo({ top: resultsSection.offsetTop - 50, behavior: 'smooth' });
        }

        /**
         * Function: saveToSheets()
         * Purpose: Use MCP proxy to save data to a Google Sheet
         */
        async function saveToSheets() {
            const apiKey = apiKeyInput.value.trim();
            if (!lastParsedData) return;

            saveSheetsBtn.disabled = true;
            saveSheetsBtn.classList.add('opacity-50');
            
            showToast('Conectando con Google Sheets...', 'info');

            try {
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
                            content: `Usa la herramienta paymegpt-mcp para agregar una nueva fila a la hoja de Google Sheets llamada "Facturas". 
                            Los datos son: 
                            Fecha: ${lastParsedData.fecha}, 
                            N°Factura: ${lastParsedData.numero_factura}, 
                            Proveedor: ${lastParsedData.proveedor}, 
                            Cliente: ${lastParsedData.cliente}, 
                            Moneda: ${lastParsedData.moneda}, 
                            Subtotal: ${lastParsedData.subtotal}, 
                            IVA: ${lastParsedData.iva}, 
                            Descuento: ${lastParsedData.descuento}, 
                            Total: ${lastParsedData.total}.
                            
                            Además, por cada concepto de la factura, llena las columnas:
                            ${lastParsedData.items.slice(0, 5).map((item, i) => `Concepto_${i+1}: ${item.descripcion}, Cantidad_${i+1}: ${item.cantidad}, PrecioUnit_${i+1}: ${item.precio_unitario}, Total_${i+1}: ${item.total_item}`).join(', ')}
                            
                            Responde solo confirmando si la operación fue exitosa.`
                        }]
                    })
                });

                if (response.ok) {
                    showToast('Datos guardados exitosamente en Google Sheets', 'success');
                } else {
                    throw new Error('No se pudo guardar en Google Sheets');
                }
            } catch (err) {
                showToast(`Error: ${err.message}`, 'error');
            } finally {
                saveSheetsBtn.disabled = false;
                saveSheetsBtn.classList.remove('opacity-50');
            }
        }

        /* ===== UI UTILITIES ===== */

        function showToast(message, type = 'info') {
            const toast = document.getElementById('toast');
            const toastContent = document.getElementById('toastContent');
            const toastMsg = document.getElementById('toastMessage');
            const toastIcon = document.getElementById('toastIcon');

            toastMsg.textContent = message;
            
            // Icon & Color based on type
            if (type === 'error') {
                toastContent.className = 'bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3';
                toastIcon.innerHTML = '❌';
            } else if (type === 'success') {
                toastContent.className = 'bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3';
                toastIcon.innerHTML = '✅';
            } else {
                toastContent.className = 'bg-gray-800 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3';
                toastIcon.innerHTML = 'ℹ️';
            }

            // Animate in
            toast.classList.remove('translate-y-24', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            // Hide after 4 seconds
            setTimeout(() => {
                toast.classList.add('translate-y-24', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, 4000);
        }

        // Bind Analyze Button
        analyzeBtn.addEventListener('click', analyzeInvoice);
        
        // Bind Save Button
        saveSheetsBtn.addEventListener('click', saveToSheets);