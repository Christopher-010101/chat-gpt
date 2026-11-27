(async()=>{
 const db=window.DP?.db;
 const params=new URLSearchParams(location.search);
 const productId=params.get('id');
 const host=document.getElementById('productDetail');
 const reviewList=document.getElementById('reviewList');
 const summary=document.getElementById('reviewSummary');
 const form=document.getElementById('productReviewForm');
 const authMessage=document.getElementById('reviewAuthMessage');
 const submit=document.getElementById('submitReview');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let product=null, session=null;

 if(!productId){host.innerHTML='<p>No se indicó qué producto quieres consultar. <a href="index.html">Volver al inicio</a>.</p>';form.hidden=true;return;}

 if(db){
  const {data,error}=await db.from('products').select('*,categories(name,slug)').eq('id',productId).maybeSingle();
  if(!error&&data)product={...data,image:data.image_url,category_slug:data.categories?.slug,category_name:data.categories?.name};
 }
 if(!product){
  product=(window.DP.demoProducts||[]).find(p=>String(p.id)===productId)||null;
  if(product)product={...product,category_name:product.category_slug};
 }
 if(!product){
  host.innerHTML='<div class="empty"><h2>Producto no encontrado</h2><p>Comprueba el enlace o vuelve a la categoría.</p><a class="btn btn-primary" href="index.html">Volver al inicio</a></div>';form.hidden=true;return;
 }

 document.title=product.name+" | D'Paniagua Technology";
 document.getElementById('detailCategory').textContent=product.category_name||'Producto';
 const image=product.image||product.image_url||product.fallback_image||'assets/img/accesorios.svg';
 const gallery=[image,...(product.image_urls||[])].filter((src,index,all)=>src&&all.indexOf(src)===index);
 host.innerHTML = `
  <article class="detail-product">
   <div class="detail-gallery">
    <img
     id="detailMainImage"
     class="detail-product-image"
     src="${esc(image)}"
     alt="${esc(product.name)}"
     onerror="this.onerror=null;this.src='assets/img/accesorios.svg'"
    >
    ${gallery.length > 1 ? `
     <div class="detail-thumbs">
      ${gallery.map((src, index) => `
       <button
        type="button"
        data-gallery-image="${esc(src)}"
        class="${index === 0 ? "selected" : ""}"
        aria-label="Ver imagen ${index + 1}"
       >
        <img src="${esc(src)}" alt="">
       </button>
      `).join("")}
     </div>
    ` : ""}
   </div>
   <div class="detail-product-info">
    <span class="eyebrow">${esc(product.brand || "D'Paniagua Technology")}</span>
    <h1>${esc(product.name)}</h1>
    <p>${esc(product.description || "Consulta las características y disponibilidad de este producto.")}</p>
    <div class="price">${window.DP.money(product.price)}</div>
    ${product.compare_at_price ? `
     <p class="small"><s>${window.DP.money(product.compare_at_price)}</s></p>
    ` : ""}
    <p class="stock ${product.stock > 0 ? "" : "out"}">
     ${product.stock > 0 ? `Disponible · ${product.stock} unidades` : "Agotado"}
    </p>
    <div class="detail-features">
     ${(product.features || []).map((feature) => `
      <span class="detail-feature">${esc(feature)}</span>
     `).join("")}
    </div>
    <div class="detail-actions">
     <button class="primary" id="detailAdd" ${product.stock <= 0 ? "disabled" : ""}>
      Añadir al carrito
     </button>
     <a class="btn btn-outline" href="${esc((product.category_slug || "index") + ".html")}">
      Volver a la categoría
     </a>
    </div>
   </div>
  </article>
 `;
 host.querySelectorAll("[data-gallery-image]").forEach((button)=>button.addEventListener("click",()=>{
  document.getElementById("detailMainImage").src=button.dataset.galleryImage;
  host.querySelectorAll("[data-gallery-image]").forEach((thumb)=>thumb.classList.toggle("selected",thumb===button));
 }));
 document.getElementById('detailAdd')?.addEventListener('click',()=>window.DP.addToCart({...product,image}));

 async function refreshSession(){
  if(!db){session=null;authMessage.innerHTML='El servicio de cuentas no está conectado. Configura Supabase para publicar reseñas.';submit.disabled=true;return;}
  const {data,error}=await db.auth.getSession();
  session=data?.session||null;
  if(error){authMessage.textContent='No se pudo comprobar tu sesión. Vuelve a iniciar sesión.';submit.disabled=true;}
  else if(session){authMessage.classList.add('logged');authMessage.textContent='Has iniciado sesión. Puedes publicar tu reseña y aparecerá inmediatamente.';submit.disabled=false;}
  else{authMessage.classList.remove('logged');authMessage.innerHTML='Para publicar una reseña, primero <a href="login.html?next='+encodeURIComponent('producto.html?id='+encodeURIComponent(productId))+'">inicia sesión o crea una cuenta</a>.';submit.disabled=false;}
 }
 await refreshSession();

 async function loadReviews(){
  if(!db||!product.id||String(product.id).startsWith('demo-')){
   summary.innerHTML = `
    <strong>— / 5</strong>
    <span class="review-stars">☆☆☆☆☆</span>
    <span>0 reseñas</span>
   `;
   reviewList.innerHTML='<p class="small">Este producto de demostración aún no está guardado en Supabase. Cuando lo agregues desde el administrador, podrá recibir reseñas.</p>';
   form.hidden=true;return;
  }
  const {data,error}=await db.from('reviews').select('id,display_name,rating,body,created_at,is_verified').eq('product_id',product.id).eq('is_visible',true).order('created_at',{ascending:false});
  if(error){summary.textContent='';reviewList.innerHTML='<p class="small">No se pudieron cargar las reseñas. Ejecuta database/migracion_resenas_publicacion_inmediata.sql en Supabase.</p>';return;}
  const rows=data||[],avg=rows.length?rows.reduce((n,r)=>n+Number(r.rating),0)/rows.length:0;
  summary.innerHTML = `
   <strong>${rows.length ? avg.toFixed(1) : "—"} / 5</strong>
   <span class="review-stars">${rows.length
     ? "★".repeat(Math.round(avg)) + "☆".repeat(5 - Math.round(avg))
     : "☆☆☆☆☆"}</span>
   <span>${rows.length} reseña(s)</span>
  `;
  reviewList.innerHTML = rows.length
   ? rows.map((review) => `
    <article class="review-entry">
     <b>${esc(review.display_name)}</b>
     <span class="review-stars">${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</span>
     <p>${esc(review.body)}</p>
     <small>
      ${new Date(review.created_at).toLocaleDateString("es-DO")}
      ${review.is_verified ? " · Compra verificada" : ""}
     </small>
    </article>
   `).join("")
   : '<p class="small">Todavía no hay reseñas para este producto. ¡Sé el primero en opinar!</p>';
 }
 await loadReviews();

 form.addEventListener('submit',async e=>{
  e.preventDefault();
  if(!db){window.DP.toast('No hay conexión con Supabase.');return;}
  const {data:{session:currentSession},error:sessionError}=await db.auth.getSession();
  if(sessionError||!currentSession?.user){authMessage.innerHTML='Tu sesión no está activa. <a href="login.html?next='+encodeURIComponent('producto.html?id='+encodeURIComponent(productId))+'">Inicia sesión</a> y vuelve a publicar.';return;}
  if(!product.id||String(product.id).startsWith('demo-')){window.DP.toast('Este producto aún no está guardado en Supabase. Agrégalo desde el administrador para habilitar reseñas.');return;}
  const body=form.elements.body.value.trim(),rating=Number(form.elements.rating.value);
  if(body.length<10){window.DP.toast('Escribe al menos 10 caracteres.');return;}
  submit.disabled=true;submit.textContent='Publicando…';
  try{
   const {data:profile}=await db.from('profiles').select('full_name').eq('id',currentSession.user.id).maybeSingle();
   const {error}=await db.from('reviews').insert({user_id:currentSession.user.id,product_id:product.id,display_name:profile?.full_name||currentSession.user.email?.split('@')[0]||'Cliente',rating,body,is_visible:true,is_verified:false});
   if(error){window.DP.toast(error.code==='23505'?'Ya publicaste una reseña para este producto.':error.message||'No se pudo publicar la reseña.');return;}
   form.reset();window.DP.toast('¡Tu reseña se publicó correctamente!');await loadReviews();
  }catch(err){window.DP.toast(err.message||'Ocurrió un error al publicar.');}
  finally{submit.disabled=false;submit.textContent='Publicar reseña';}
 });
})();
