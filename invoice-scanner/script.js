var API_KEY = 'ANTHROPIC_API_KEY_PLACEHOLDER';
var MODEL   = 'claude-sonnet-4-20250514';
var imageB64 = null, imageMime = null, extracted = null;

// File input — evento directo, sin DOMContentLoaded
document.getElementById('file-input').onchange = function() {
  var file = this.files && this.files[0];
  if (!file) return;
  if (!file.type.match(/^image\//)) { toast('err','Formato inválido','Solo JPG, PNG o WebP'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var result = e.target.result;
    imageMime = file.type;
    imageB64  = result.split(',')[1];
    document.getElementById('preview-img').src = result;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('preview-section').style.display = 'block';
    document.querySelector('.upload-label').style.display = 'none';
    document.getElementById('btn-analyze').disabled = false;
  };
  reader.readAsDataURL(file);
};

function removeFile() {
  imageB64 = imageMime = extracted = null;
  document.getElementById('preview-section').style.display = 'none';
  document.querySelector('.upload-label').style.display = 'flex';
  document.getElementById('btn-analyze').disabled = true;
  document.getElementById('results-card').style.display = 'none';
  document.getElementById('btn-sheets').style.display = 'none';
  document.getElementById('file-input').value = '';
}

function compressImage(b64, mime) {
  return new Promise(function(resolve) {
    var img = new Image();
    img.onload = function() {
      var maxDim = 1800, scale = 1;
      if (img.width > maxDim || img.height > maxDim)
        scale = Math.min(maxDim / img.width, maxDim / img.height);
      var canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      function tryQ(q) {
        var out   = canvas.toDataURL('image/jpeg', q);
        var bytes = (out.length - 'data:image/jpeg;base64,'.length) * 0.75;
        if (bytes <= 4 * 1024 * 1024 || q <= 0.3)
          resolve({ b64: out.split(',')[1], mime: 'image/jpeg' });
        else tryQ(q - 0.1);
      }
      tryQ(0.85);
    };
    img.src = 'data:' + mime + ';base64,' + b64;
  });
}

function analyzeInvoice() {
  if (!imageB64) return;
  var btn = document.getElementById('btn-analyze');
  btn.disabled = true; btn.textContent = 'Analizando...';
  setStatus(true, 'Optimizando imagen...');

  compressImage(imageB64, imageMime).then(function(compressed) {
    setStatus(true, 'Leyendo factura con IA...');
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1500,
        system: 'Eres un extractor de datos de facturas. Responde ÚNICAMENTE con JSON válido sin markdown ni texto extra. Estructura: {"proveedor":"","cliente":"","numero_factura":"","fecha":"","moneda":"MXN","items":[{"descripcion":"","cantidad":"","precio_unitario":"","total_item":""}],"subtotal":"","iva":"","descuento":"0","total":"","notas":""}',
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type: compressed.mime, data: compressed.b64 } },
          { type: 'text',  text: 'Extrae todos los datos de esta factura.' }
        ]}]
      })
    });
  }).then(function(res) {
    return res.json().then(function(data) {
      if (!res.ok) throw new Error(data.error && data.error.message || 'Error API');
      return data;
    });
  }).then(function(data) {
    var raw   = (data.content || []).map(function(c){ return c.text || ''; }).join('');
    var clean = raw.replace(/```json|```/g, '').trim();
    extracted = JSON.parse(clean);
    setStatus(false);
    renderResults(extracted);
    toast('ok', 'Listo', (extracted.items || []).length + ' concepto(s) extraído(s)');
  }).catch(function(err) {
    setStatus(false);
    toast('err', 'Error', err.message || 'Intenta de nuevo');
  }).finally(function() {
    btn.disabled = false; btn.textContent = 'Analizar Factura';
  });
}

function renderResults(d) {
  var meta = [
    { k:'Proveedor',  v: d.proveedor },
    { k:'Cliente',    v: d.cliente },
    { k:'N° Factura', v: d.numero_factura },
    { k:'Fecha',      v: d.fecha },
    { k:'Moneda',     v: d.moneda || 'MXN' }
  ];
  if (d.notas) meta.push({ k:'Notas', v: d.notas });
  document.getElementById('meta-grid').innerHTML = meta.map(function(m) {
    return '<div class="meta-item"><span class="meta-k">'+m.k+'</span><span class="meta-v">'+(m.v||'—')+'</span></div>';
  }).join('');

  document.getElementById('items-body').innerHTML = (d.items || []).map(function(i) {
    return '<tr><td class="td-desc">'+(i.descripcion||'—')+'</td><td>'+(i.cantidad||'1')+'</td><td>'+fmtN(i.precio_unitario)+'</td><td>'+fmtN(i.total_item)+'</td></tr>';
  }).join('');

  var html = '';
  if (d.subtotal) html += trow('Subtotal', fmtN(d.subtotal), '');
  if (d.descuento && d.descuento !== '0') html += trow('Descuento', '−'+fmtN(d.descuento), 'disc');
  if (d.iva && d.iva !== '0') html += trow('IVA', fmtN(d.iva), '');
  html += trow('TOTAL', fmtN(d.total), 'grand');
  document.getElementById('totals').innerHTML = html;

  document.getElementById('results-card').style.display = 'block';
  document.getElementById('btn-sheets').style.display   = 'flex';
}

function trow(l, v, cls) {
  return '<div class="t-row '+cls+'"><span class="lbl">'+l+'</span><span class="val">'+v+'</span></div>';
}

function fmtN(val) {
  var n = parseFloat(val);
  if (isNaN(n)) return val || '—';
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sendToSheets() {
  if (!extracted) return;
  var btn = document.getElementById('btn-sheets');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner spinner-green"></div> Guardando...';
  setStatus(true, 'Enviando a Google Sheets...');

  var items = extracted.items || [];
  var cols = '';
  for (var i = 0; i < 5; i++) {
    var it = items[i] || {};
    cols += 'Concepto_'+(i+1)+': "'+(it.descripcion||'')+'", Cant_'+(i+1)+': "'+(it.cantidad||'')+'", PU_'+(i+1)+': "'+(it.precio_unitario||'')+'", Total_'+(i+1)+': "'+(it.total_item||'')+'"\n  ';
  }

  var prompt = 'Usa Google Sheets para agregar una fila a la hoja "Facturas":\n\n'
    + '  Fecha: "'+  (extracted.fecha||'')         +'"\n'
    + '  N_Factura: "'+(extracted.numero_factura||'')+'"\n'
    + '  Proveedor: "'+(extracted.proveedor||'')    +'"\n'
    + '  Cliente: "' +(extracted.cliente||'')       +'"\n'
    + '  Moneda: "'  +(extracted.moneda||'MXN')     +'"\n'
    + '  Subtotal: "'+(extracted.subtotal||'0')     +'"\n'
    + '  IVA: "'     +(extracted.iva||'0')          +'"\n'
    + '  Descuento: "'+(extracted.descuento||'0')   +'"\n'
    + '  Total: "'   +(extracted.total||'0')        +'"\n  '
    + cols
    + '\nSi la hoja no existe, créala con esos encabezados. Confirma en español.';

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
      mcp_servers: [{ type: 'url', url: 'https://paymegpt.com/mcp', name: 'paymegpt-mcp' }]
    })
  }).then(function(res) {
    return res.json().then(function(d) {
      if (!res.ok) throw new Error(d.error && d.error.message || 'Error');
      return d;
    });
  }).then(function() {
    setStatus(false);
    toast('ok', '¡Guardado!', 'Fila agregada en Google Sheets');
  }).catch(function(err) {
    setStatus(false);
    toast('err', 'Error', err.message);
  }).finally(function() {
    btn.disabled = false;
    btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> Guardar en Google Sheets';
  });
}

function setStatus(show, msg) {
  document.getElementById('status-bar').style.display = show ? 'flex' : 'none';
  if (msg) document.getElementById('status-msg').textContent = msg;
}

var tTimer;
function toast(type, title, msg) {
  var el = document.getElementById('toast');
  document.getElementById('t-title').textContent = title;
  document.getElementById('t-msg').textContent   = msg;
  el.className = 'show ' + type;
  clearTimeout(tTimer);
  tTimer = setTimeout(function(){ el.className = ''; }, 4500);
}