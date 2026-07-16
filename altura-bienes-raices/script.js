const SHEET_URL = "https://paymegpt.com/api/public/landing-pages/5439/sheet-data";
let PROPIEDADES = [];

function money(n){
  const num = parseInt(n, 10) || 0;
  return "$" + num.toLocaleString("es-MX");
}

function cardHTML(p){
  const destacada = (p.Destacada || "").trim().toLowerCase() === "si";
  const terreno = parseInt(p.M2_Terreno,10) > 0 ? `<span><b>${p.M2_Terreno}</b> m² terreno</span>` : "";
  return `
    <div class="card">
      <div class="card-img" style="background-image:url('${p.Imagen_URL}')">
        ${destacada ? '<div class="badge-destacada">Destacada</div>' : ''}
      </div>
      <div class="card-body">
        <div class="card-top">
          <div>
            <div class="card-title">${p.Titulo}</div>
            <div class="card-loc">${p.Colonia}, ${p.Ciudad}</div>
          </div>
          <div class="card-price">${money(p.Precio)}</div>
        </div>
        <div class="card-desc">${p.Descripcion}</div>
        <div class="spec-stamp">
          <span><b>${p.Tipo}</b></span>
          <span><b>${p.Recamaras}</b> rec</span>
          <span><b>${p.Banos}</b> baños</span>
          <span><b>${p.Estacionamientos}</b> autos</span>
          <span><b>${p.M2_Construccion}</b> m² const.</span>
          ${terreno}
        </div>
        <div class="card-cta"><a href="#contacto">Solicitar información →</a></div>
      </div>
    </div>`;
}

function render(list){
  const el = document.getElementById('listado');
  document.getElementById('filter-count').textContent = list.length + ' de ' + PROPIEDADES.length + ' propiedades';
  if(!list.length){
    el.innerHTML = '<div class="empty-state">No hay propiedades que coincidan con esos filtros. Prueba ajustando el rango de precio o recámaras.</div>';
    return;
  }
  const ordenadas = [...list].sort((a,b)=>{
    const da = (a.Destacada||'').toLowerCase()==='si' ? 1 : 0;
    const db = (b.Destacada||'').toLowerCase()==='si' ? 1 : 0;
    return db - da;
  });
  el.innerHTML = ordenadas.map(cardHTML).join('');
}

function applyFilters(){
  const precioVal = document.getElementById('f-precio').value.split('-').map(Number);
  const recMin = parseInt(document.getElementById('f-recamaras').value, 10) || 0;
  const tipo = document.getElementById('f-tipo').value;

  const filtradas = PROPIEDADES.filter(p=>{
    const precio = parseInt(p.Precio,10) || 0;
    const rec = parseInt(p.Recamaras,10) || 0;
    let ok = true;
    if(precioVal.length === 2 && (precioVal[0] !== 0 || precioVal[1] !== 0)){
      ok = ok && precio >= precioVal[0] && precio <= precioVal[1];
    }
    if(recMin) ok = ok && rec >= recMin;
    if(tipo) ok = ok && p.Tipo === tipo;
    return ok;
  });
  render(filtradas);
}

['f-precio','f-recamaras','f-tipo'].forEach(id=>{
  document.getElementById(id).addEventListener('change', applyFilters);
});
document.getElementById('reset-filters').addEventListener('click', ()=>{
  document.getElementById('f-precio').value = '0';
  document.getElementById('f-recamaras').value = '0';
  document.getElementById('f-tipo').value = '';
  applyFilters();
});

fetch(SHEET_URL)
  .then(r => r.json())
  .then(data => {
    PROPIEDADES = Array.isArray(data) ? data : (data.rows || data.data || []);
    document.getElementById('stat-total').textContent = PROPIEDADES.length;
    render(PROPIEDADES);
  })
  .catch(err => {
    document.getElementById('listado').innerHTML = '<div class="empty-state">No se pudo cargar el catálogo en este momento.</div>';
    console.error(err);
  });