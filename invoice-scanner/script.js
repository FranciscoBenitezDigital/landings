let imageBase64=null,imageMediaType=null,extractedData=null;
const zone=document.getElementById('upload-zone');
zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('drag-over');});
zone.addEventListener('dragleave',()=>zone.classList.remove('drag-over'));
zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('drag-over');if(e.dataTransfer.files[0])handleFile(e.dataTransfer.files[0]);});
document.getElementById('file-input').addEventListener('change',e=>{if(e.target.files[0])handleFile(e.target.files[0]);});
function handleFile(file){
  if(!file.type.startsWith('image/')){showToast('error','Formato inválido','Solo JPG, PNG o WebP');return;}
  const reader=new FileReader();
  reader.onload=ev=>{
    const result=ev.target.result;
    imageMediaType=file.type;imageBase64=result.split(',')[1];
    document.getElementById('preview-img').src=result;
    document.getElementById('file-name').textContent=file.name;
    document.getElementById('preview-wrap').style.display='block';
    document.getElementById('upload-zone').style.display='none';
    document.getElementById('btn-analyze').disabled=false;
  };
  reader.readAsDataURL(file);
}
function removeFile(){
  imageBase64=imageMediaType=extractedData=null;
  document.getElementById('preview-wrap').style.display='none';
  document.getElementById('upload-zone').style.display='block';
  document.getElementById('btn-analyze').disabled=true;
  document.getElementById('results-card').style.display='none';
  document.getElementById('btn-sheets').style.display='none';
  document.getElementById('file-input').value='';
}
async function compressImage(base64,mimeType){
  return new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>{
      const maxDim=1800;let scale=1;
      if(img.width>maxDim||img.height>maxDim)scale=Math.min(maxDim/img.width,maxDim/img.height);
      const canvas=document.createElement('canvas');
      canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);
      canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
      const tryQ=q=>{
        const out=canvas.toDataURL('image/jpeg',q);
        const bytes=(out.length-'data:image/jpeg;base64,'.length)*0.75;
        if(bytes<=4*1024*1024||q<=0.3)resolve({base64:out.split(',')[1],mimeType:'image/jpeg'});
        else tryQ(q-0.1);
      };
      tryQ(0.85);
    };
    img.src='data:'+mimeType+';base64,'+base64;
  });
}
async function analyzeInvoice(){
  const apiKey=document.getElementById('apiKey').value.trim();
  if(!apiKey){showToast('error','API Key requerida','Ingresa tu Anthropic API Key');return;}
  if(!imageBase64)return;
  const btn=document.getElementById('btn-analyze');
  btn.disabled=true;btn.textContent='Analizando...';
  setStatus(true,'Optimizando imagen...');
  try{
    const compressed=await compressImage(imageBase64,imageMediaType);
    setStatus(true,'Extrayendo datos con IA...');
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1500,
        system:'Eres un extractor de datos de facturas. Responde ÚNICAMENTE con JSON válido, sin markdown, sin texto extra. Estructura exacta: {"proveedor":"","cliente":"","numero_factura":"","fecha":"","moneda":"MXN","items":[{"descripcion":"","cantidad":"","precio_unitario":"","total_item":""}],"subtotal":"","iva":"","descuento":"0","total":"","notas":""}. Si un campo no existe usa cadena vacía o "0" para montos.',
        messages:[{role:'user',content:[
          {type:'image',source:{type:'base64',media_type:compressed.mimeType,data:compressed.base64}},
          {type:'text',text:'Extrae todos los datos de esta factura.'}
        ]}]
      })
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error?.message||'Error en la API');
    const raw=data.content.map(c=>c.text||'').join('');
    const clean=raw.replace(/```json|```/g,'').trim();
    extractedData=JSON.parse(clean);
    setStatus(false);renderResults(extractedData);
    showToast('success','Listo',`${extractedData.items?.length||0} concepto(s) extraído(s)`);
  }catch(err){
    setStatus(false);showToast('error','Error',err.message||'Intenta de nuevo');
  }finally{
    btn.disabled=false;btn.textContent='Analizar Factura';
  }
}
function renderResults(d){
  document.getElementById('meta-grid').innerHTML=[
    {k:'Proveedor',v:d.proveedor},{k:'Cliente',v:d.cliente},
    {k:'N° Factura',v:d.numero_factura},{k:'Fecha',v:d.fecha},
    {k:'Moneda',v:d.moneda||'MXN'},...(d.notas?[{k:'Notas',v:d.notas}]:[])
  ].map(m=>`<div class="meta-item"><span class="meta-key">${m.k}</span><span class="meta-val">${m.v||'—'}</span></div>`).join('');
  document.getElementById('items-body').innerHTML=(d.items||[]).map(i=>`
    <tr><td class="td-desc">${i.descripcion||'—'}</td><td>${i.cantidad||'1'}</td>
    <td>${fmt(i.precio_unitario,d.moneda)}</td><td>${fmt(i.total_item,d.moneda)}</td></tr>`).join('');
  let html='';
  if(d.subtotal)html+=row('Subtotal',fmt(d.subtotal,d.moneda),'');
  if(d.descuento&&d.descuento!=='0')html+=row('Descuento','-'+fmt(d.descuento,d.moneda),'descuento');
  if(d.iva&&d.iva!=='0')html+=row('IVA',fmt(d.iva,d.moneda),'');
  html+=row('TOTAL',fmt(d.total,d.moneda),'grand');
  document.getElementById('totals').innerHTML=html;
  document.getElementById('results-card').style.display='block';
  document.getElementById('btn-sheets').style.display='flex';
}
function row(label,value,cls){return `<div class="total-row ${cls}"><span class="lbl">${label}</span><span class="val">${value}</span></div>`;}
function fmt(val,moneda='MXN'){const n=parseFloat(val);if(isNaN(n))return val||'—';return `$${n.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})}`;}
async function sendToSheets(){
  if(!extractedData)return;
  const apiKey=document.getElementById('apiKey').value.trim();
  if(!apiKey){showToast('error','API Key requerida','Ingresa tu API Key');return;}
  const btn=document.getElementById('btn-sheets');
  btn.disabled=true;btn.innerHTML='<div class="spinner" style="border-top-color:#16A34A;border-color:rgba(22,163,74,0.2)"></div> Guardando...';
  setStatus(true,'Enviando a Google Sheets...');
  const items=extractedData.items||[];
  const conceptoCols=Array.from({length:5},(_,i)=>{const it=items[i]||{};return `Concepto_${i+1}: "${it.descripcion||''}", Cant_${i+1}: "${it.cantidad||''}", PU_${i+1}: "${it.precio_unitario||''}", Total_${i+1}: "${it.total_item||''}"`}).join('\n  ');
  const prompt=`Usa la herramienta de Google Sheets para agregar una fila a la hoja "Facturas" con estos datos exactos:\n\n  Fecha: "${extractedData.fecha||''}"\n  N_Factura: "${extractedData.numero_factura||''}"\n  Proveedor: "${extractedData.proveedor||''}"\n  Cliente: "${extractedData.cliente||''}"\n  Moneda: "${extractedData.moneda||'MXN'}"\n  Subtotal: "${extractedData.subtotal||'0'}"\n  IVA: "${extractedData.iva||'0'}"\n  Descuento: "${extractedData.descuento||'0'}"\n  Total: "${extractedData.total||'0'}"\n  ${conceptoCols}\n\nSi la hoja no existe, créala primero con esos encabezados. Confirma el resultado en español.`;
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:prompt}],mcp_servers:[{type:'url',url:'https://paymegpt.com/mcp',name:'paymegpt-mcp'}]})
    });
    const data=await res.json();
    if(!res.ok)throw new Error(data.error?.message||'Error al conectar');
    setStatus(false);showToast('success','¡Guardado!','Fila agregada en Google Sheets');
  }catch(err){
    setStatus(false);showToast('error','Error',err.message);
  }finally{
    btn.disabled=false;btn.innerHTML='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> Guardar en Google Sheets';
  }
}
function setStatus(show,msg=''){const bar=document.getElementById('status-bar');bar.style.display=show?'flex':'none';document.getElementById('status-msg').textContent=msg;}
let toastTimer;
function showToast(type,title,msg){const el=document.getElementById('toast');document.getElementById('toast-title').textContent=title;document.getElementById('toast-msg').textContent=msg;el.className=`toast ${type} show`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),4000);}