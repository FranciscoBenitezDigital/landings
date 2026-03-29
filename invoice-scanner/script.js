// Global variables for data management
        let currentFile = null;
        let lastExtractedData = null;
        let isProcessing = false;

        // UI Element References
        const dropZone = document.getElementById('drop-zone');
        const fileInput = document.getElementById('file-input');
        const uploadPrompt = document.getElementById('upload-prompt');
        const previewContainer = document.getElementById('preview-container');
        const imagePreview = document.getElementById('image-preview');
        const fileNameLabel = document.getElementById('file-name');
        const btnAnalyze = document.getElementById('btn-analyze');
        const removeFileBtn = document.getElementById('remove-file');
        const resultsSection = document.getElementById('results-section');
        const itemsBody = document.getElementById('items-body');
        const btnSheets = document.getElementById('btn-sheets');

        // ===== DRAG AND DROP HANDLERS =====
        // Purpose: Provide interactive file upload experience
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            }, false);
        });

        dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'));
        dropZone.addEventListener('dragover', () => dropZone.classList.add('drag-over'));
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', (e) => {
            dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length) handleFileUpload(files[0]);
        });

        dropZone.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) handleFileUpload(e.target.files[0]);
        });

        // ===== FILE PREVIEW LOGIC =====
        // Purpose: Read file and display to user before processing
        function handleFileUpload(file) {
            if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
                showToast("Tipo de archivo no soportado", "error");
                return;
            }

            currentFile = file;
            fileNameLabel.textContent = file.name;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = file.type === 'application/pdf' ? 'https://via.placeholder.com/300x400?text=PDF+Document' : e.target.result;
                uploadPrompt.classList.add('hidden');
                previewContainer.classList.remove('hidden');
                btnAnalyze.disabled = false;
            };
            reader.readAsDataURL(file);
        }

        removeFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            resetUploadState();
        });

        function resetUploadState() {
            currentFile = null;
            fileInput.value = '';
            uploadPrompt.classList.remove('hidden');
            previewContainer.classList.add('hidden');
            btnAnalyze.disabled = true;
            resultsSection.classList.add('hidden');
        }

        // ===== CLAUDE VISION API INTEGRATION =====
        // Purpose: Extract structured data from invoice image
        btnAnalyze.addEventListener('click', async () => {
            if (!currentFile || isProcessing) return;

            setLoading(true, 'btn');
            
            try {
                // Convert file to base64 for the API
                const base64Data = await fileToBase64(currentFile);
                const mediaType = currentFile.type;
                const base64String = base64Data.split(',')[1];

                // Note: In a real production app, the API Key should be handled securely (Backend/Proxy)
                // For this demo, we assume the environment supports direct call or we use a provided endpoint
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'REPLACE_WITH_YOUR_KEY', // Platform handles this usually
                        'anthropic-version': '2023-06-01',
                        'dangerously-allow-browser': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 1500,
                        system: 'Eres un extractor de datos de facturas. Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra. Estructura exacta: {"proveedor":"","cliente":"","numero_factura":"","fecha":"","moneda":"MXN","items":[{"descripcion":"","cantidad":"","precio_unitario":"","total_item":""}],"subtotal":"","iva":"","descuento":"0","total":"","notas":""}. Si un campo no existe usa cadena vacía.',
                        messages: [{
                            role: 'user',
                            content: [
                                { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64String } },
                                { type: 'text', text: 'Extrae todos los datos de esta factura en el formato JSON especificado.' }
                            ]
                        }]
                    })
                });

                if (!response.ok) throw new Error('Error al conectar con el servidor de análisis');

                const result = await response.json();
                const rawContent = result.content[0].text;
                const cleanedJson = rawContent.replace(/```json|```/g, '').trim();
                lastExtractedData = JSON.parse(cleanedJson);

                renderResults(lastExtractedData);
                showToast("Análisis completado con éxito", "success");
            } catch (error) {
                console.error(error);
                showToast("Error al analizar la factura. Inténtalo de nuevo.", "error");
            } finally {
                setLoading(false, 'btn');
            }
        });

        // Helper: Convert File to Base64
        function fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }

        // ===== RESULTS RENDERING =====
        // Purpose: Update UI with extracted JSON data
        function renderResults(data) {
            document.getElementById('res-vendor').textContent = data.proveedor || 'N/A';
            document.getElementById('res-client').textContent = data.cliente || 'N/A';
            document.getElementById('res-invoice').textContent = data.numero_factura || 'N/A';
            document.getElementById('res-date').textContent = data.fecha || 'N/A';
            document.getElementById('res-currency').textContent = data.moneda || 'MXN';
            
            document.getElementById('res-subtotal').textContent = `${data.subtotal} ${data.moneda}`;
            document.getElementById('res-iva').textContent = `${data.iva} ${data.moneda}`;
            document.getElementById('res-discount').textContent = `${data.descuento} ${data.moneda}`;
            document.getElementById('res-total').textContent = `${data.total} ${data.moneda}`;

            itemsBody.innerHTML = '';
            data.items.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="px-6 py-4 border-b text-corporate-gray font-medium">${index + 1}</td>
                    <td class="px-6 py-4 border-b font-medium">${item.descripcion}</td>
                    <td class="px-6 py-4 border-b text-center">${item.cantidad}</td>
                    <td class="px-6 py-4 border-b text-right">${item.precio_unitario}</td>
                    <td class="px-6 py-4 border-b text-right font-bold text-corporate-blue">${item.total_item}</td>
                `;
                itemsBody.appendChild(row);
            });

            resultsSection.classList.remove('hidden');
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }

        // ===== GOOGLE SHEETS INTEGRATION =====
        // Purpose: Save data via PaymeGPT MCP to Sheets
        btnSheets.addEventListener('click', async () => {
            if (!lastExtractedData || isProcessing) return;

            setLoading(true, 'sheets');

            try {
                // Map items to the required 5-column format
                const rowData = {
                    Fecha: lastExtractedData.fecha,
                    "N° Factura": lastExtractedData.numero_factura,
                    Proveedor: lastExtractedData.proveedor,
                    Cliente: lastExtractedData.cliente,
                    Moneda: lastExtractedData.moneda,
                    Subtotal: lastExtractedData.subtotal,
                    IVA: lastExtractedData.iva,
                    Descuento: lastExtractedData.descuento,
                    Total: lastExtractedData.total
                };

                // Add up to 5 concepts
                for (let i = 0; i < 5; i++) {
                    const item = lastExtractedData.items[i] || {};
                    rowData[`Concepto${i+1}`] = item.descripcion || '';
                    rowData[`Cant${i+1}`] = item.cantidad || '';
                    rowData[`PU${i+1}`] = item.precio_unitario || '';
                    rowData[`Total${i+1}`] = item.total_item || '';
                }

                // Call Anthropic API with MCP tools
                const response = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': 'REPLACE_WITH_YOUR_KEY',
                        'anthropic-version': '2023-06-01',
                        'dangerously-allow-browser': 'true'
                    },
                    body: JSON.stringify({
                        model: 'claude-3-5-sonnet-20241022',
                        max_tokens: 1000,
                        messages: [{
                            role: 'user',
                            content: `Guarda estos datos en la Google Sheet llamada "Facturas": ${JSON.stringify(rowData)}`
                        }],
                        mcp_servers: [{
                            url: 'https://paymegpt.com/mcp'
                        }]
                    })
                });

                if (!response.ok) throw new Error('Error al guardar en Google Sheets');
                
                showToast("Datos guardados en Google Sheets correctamente", "success");
            } catch (error) {
                console.error(error);
                showToast("Error al guardar en Google Sheets", "error");
            } finally {
                setLoading(false, 'sheets');
            }
        });

        // ===== UI UTILITIES =====
        
        // Function: showToast()
        // Purpose: Display success/error feedback to user
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const content = document.getElementById('toast-content');
            const msgEl = document.getElementById('toast-message');
            
            msgEl.textContent = message;
            content.className = type === 'success' 
                ? 'bg-corporate-green text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3' 
                : 'bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3';

            toast.classList.remove('translate-y-20', 'opacity-0');
            toast.classList.add('translate-y-0', 'opacity-100');

            setTimeout(() => {
                toast.classList.add('translate-y-20', 'opacity-0');
                toast.classList.remove('translate-y-0', 'opacity-100');
            }, 4000);
        }

        // Function: setLoading()
        // Purpose: Manage button states during async operations
        function setLoading(loading, type) {
            isProcessing = loading;
            
            if (type === 'btn') {
                const text = document.getElementById('btn-text');
                const loader = document.getElementById('btn-loader');
                if (loading) {
                    text.textContent = 'Procesando...';
                    loader.classList.remove('hidden');
                    btnAnalyze.classList.add('opacity-75');
                } else {
                    text.textContent = 'Analizar Factura';
                    loader.classList.add('hidden');
                    btnAnalyze.classList.remove('opacity-75');
                }
            } else if (type === 'sheets') {
                const text = document.getElementById('sheets-text');
                const loader = document.getElementById('sheets-loader');
                const icon = document.getElementById('sheets-icon');
                if (loading) {
                    text.textContent = 'Guardando...';
                    loader.classList.remove('hidden');
                    icon.classList.add('hidden');
                    btnSheets.classList.add('opacity-75');
                } else {
                    text.textContent = 'Guardar en Google Sheets';
                    loader.classList.add('hidden');
                    icon.classList.remove('hidden');
                    btnSheets.classList.remove('opacity-75');
                }
            }
        }