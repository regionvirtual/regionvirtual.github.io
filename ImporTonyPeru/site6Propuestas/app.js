const level=Number(document.querySelector('main')?.dataset.level||0);
const products=[{"name": "Prensatela 5", "cat": "Prensatelas", "code": "DEMO-P01", "img": "foot", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}, {"name": "Prensatela 10", "cat": "Prensatelas", "code": "DEMO-P02", "img": "foot10", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}, {"name": "GB DOX558", "cat": "Agujas", "code": "DEMO-A03", "img": "needle", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}, {"name": "OR DBX1", "cat": "Agujas", "code": "DEMO-A04", "img": "needle-or", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}, {"name": "Piquetera 3", "cat": "Accesorios", "code": "DEMO-AC05", "img": "scissors", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}, {"name": "Plancha Silver Star", "cat": "Planchas", "code": "DEMO-PI06", "img": "iron", "desc": "Producto presentado en el catálogo público de Importony. Consulta con un asesor la referencia comercial, las características, el precio y la compatibilidad con tu equipo."}];
let basket={};
let favorites=[];let favoritesOnly=false;
try {const saved=JSON.parse(localStorage.getItem('importony-favorites')||'[]');if(Array.isArray(saved))favorites=saved.filter(x=>Number.isInteger(x)&&x>=0&&x<products.length)}catch(e){}
const image=p=>`<img src="assets/${p.img}.jpg" alt="${p.name}" style="width:100%;height:100%;object-fit:contain">`;
const icons={info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.3"/>',plus:'<path d="M14 2H5v20h14V7zM14 2v6h5M8 14h8m-4-4v8"/>',zoom:'<circle cx="10" cy="10" r="7"/><path d="m15 15 6 6M7 10h6m-3-3v6"/>',heart:'<path d="M20 5c-3-3-7-1-8 1-1-2-5-4-8-1-5 5 2 11 8 16 6-5 13-11 8-16Z"/>'};
function icon(name){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="21" height="21" aria-hidden="true">${icons[name]}</svg>`}
function action(label,fn,kind,pressed){return `<button class="icon-action outline" title="${label}" aria-label="${label}" ${pressed!==undefined?`aria-pressed="${pressed}"`:''} onclick="${fn}">${icon(kind)}</button>`}
function render(){if(level<2)return;const q=(document.querySelector('#search')?.value||'').trim().toLocaleLowerCase('es');const cat=document.querySelector('#category')?.value||'';let list=products.filter((p,i)=>(!q||`${p.name} ${p.code}`.toLocaleLowerCase('es').includes(q))&&(!cat||cat===p.cat)&&(!favoritesOnly||favorites.includes(i)));const sort=document.querySelector('#sort')?.value;if(sort==='az'||sort==='za')list.sort((a,b)=>(sort==='az'?1:-1)*a.name.localeCompare(b.name,'es',{numeric:true}));document.getElementById('result-count').textContent=`${list.length} productos de muestra`;
document.getElementById('products').innerHTML=list.map(p=>{const i=products.indexOf(p);return `<article class="card"><div class="product-art">${image(p)}</div><div class="card-body"><span class="ref">${p.code} · ${p.cat}</span><h3>${p.name}</h3><p>Precio y disponibilidad por confirmar.</p><div class="item-actions">${action('Ver ficha de '+p.name,`detail(${i})`,'info')}${level>=3?action('Ampliar foto de '+p.name,`zoom(${i})`,'zoom'):''}${level>=4?action('Añadir '+p.name+' a cotización',`add(${i},this)`,'plus'):''}${level===6?action('Guardar '+p.name+' en favoritos',`favorite(${i})`,'heart',favorites.includes(i)):''}</div></div></article>`}).join('')||'<div class="empty"><h3>No hay productos en esta selección</h3><p>Prueba otra búsqueda o guarda un producto con el corazón.</p><button onclick="resetFilters()">Ver todos</button></div>';}
function zoom(i){modal(`<h2>${products[i].name}</h2><div class="zoom-image">${image(products[i])}</div>`)}
function resetFilters(){for(const id of ['search','category','sort']){const el=document.getElementById(id);if(el)el.value=id==='sort'?'default':''}favoritesOnly=false;document.getElementById('favorites-filter')?.setAttribute('aria-pressed','false');render()}
function favorite(i){favorites=favorites.includes(i)?favorites.filter(x=>x!==i):[...favorites,i];try{localStorage.setItem('importony-favorites',JSON.stringify(favorites))}catch(e){modal('<h2>Guardado temporal</h2><p>Este navegador no permite guardar datos. Los favoritos estarán disponibles solo mientras mantengas esta página abierta.</p>')}render()}
function toggleFavorites(){favoritesOnly=!favoritesOnly;document.getElementById('favorites-filter').setAttribute('aria-pressed',String(favoritesOnly));render()}
function modal(html){document.querySelector('#modal-body').innerHTML=html;const d=document.querySelector('#modal');if(!d.open)d.showModal()}
function detail(i){const p=products[i];modal(`<div class="detail-art">${image(p)}</div><div class="eyebrow">${p.code} · Ejemplo</div><h2>${p.name}</h2><p>${p.desc}</p><p><strong>Categoría:</strong> ${p.cat}<br><strong>Precio y disponibilidad:</strong> por confirmar</p><p class="notice">Fotografía del catálogo original. Código DEMO interno de esta presentación; no es una referencia comercial.</p><button onclick="${level>=4?`add(${i});showQuote()`:`previewMessage(${i})`}">${level>=4?'Añadir a mi cotización':'Consultar este producto por WhatsApp'}</button>
      ${level>=4?`<button class="outline" onclick="previewMessage(${i})">Consultar esta pieza en WhatsApp ↗</button>`:''}`)}
function openWhatsApp(message) {
  const address = new URL('https://wa.me/51955171495');
  address.searchParams.set('text', message);
  window.open(address.href, '_blank', 'noopener,noreferrer');
}
function contact() {
  openWhatsApp('Hola, Importony. Busco repuestos o accesorios para mi máquina. ¿Me pueden orientar?');
}
function previewMessage(i) {
  const product = products[i];
  openWhatsApp('Hola, Importony. Quisiera consultar por ' + product.name + ' (' + product.code + ', referencia de demostración). ¿Me confirman precio, disponibilidad y compatibilidad?');
}
function add(i,btn){basket[i]=(basket[i]||0)+1;updateCount();if(btn){btn.classList.add('added');btn.title='Añadido a la cotización';setTimeout(()=>{btn.classList.remove('added');btn.title='Añadir a cotización'},900)}}
function updateCount(){document.querySelector('#basket-count').textContent=Object.values(basket).reduce((a,b)=>a+b,0)}
function qty(i,v){basket[i]=Math.max(1,Math.min(999,Math.floor(Number(v)||1)));updateCount();showQuote()}
function removeItem(i){delete basket[i];updateCount();showQuote()}
function showQuote(){let ids=Object.keys(basket);modal('<div class="eyebrow">Mi solicitud</div><h2>Tu lista de cotización</h2>'+(!ids.length?'<p>Aún no has añadido productos. Explora el catálogo y selecciona las piezas que necesitas.</p><button onclick="document.querySelector(\'#modal\').close()">Volver al catálogo</button>':ids.map(i=>`<div class="quote-row"><div><strong>${products[i].name}</strong><br><small>${products[i].code}</small></div><input type="number" min="1" max="999" value="${basket[i]}" aria-label="Cantidad de ${products[i].name}" onchange="qty(${i},this.value)"><button aria-label="Quitar ${products[i].name}" onclick="removeItem(${i})">✕</button></div>`).join('')+'<p class="notice">Una solicitud reúne varias piezas. El precio, la compatibilidad y la disponibilidad se confirman con un asesor.</p><button onclick="quoteMessage()">Continuar en WhatsApp ↗</button>'))}
function quoteMessage() {
  const lines = Object.keys(basket).map(i => basket[i] + ' × ' + products[i].name + ' (' + products[i].code + ')');
  const fields = [['company','Empresa'],['machine-note','Máquina'],['order-notes','Observaciones']];
  for (const [id, label] of fields) {
    const value = document.getElementById(id)?.value.trim();
    if (value) lines.push(label + ': ' + value);
  }
  openWhatsApp(['Hola, Importony. Solicito una cotización de las siguientes piezas (referencias de demostración):', ...lines, '¿Me confirman precio, disponibilidad y compatibilidad?'].join('\n'));
}

if(level>=5)document.getElementById('category').innerHTML+=[...new Set(products.map(p=>p.cat))].map(c=>`<option>${c}</option>`).join('');
for(const id of ['search','category','sort'])document.getElementById(id)?.addEventListener(id==='search'?'input':'change',render);
render();

for (const tile of document.querySelectorAll('[data-family]')) {
  tile.addEventListener('click', () => {
    resetFilters();
    const selector = document.getElementById('category');
    selector.value = tile.dataset.family;
    selector.dispatchEvent(new Event('change'));
    selector.focus({preventScroll: true});
  });
}
