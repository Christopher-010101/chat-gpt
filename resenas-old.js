(async()=>{
 const list=document.querySelector("#reviewsList"),form=document.querySelector("#reviewForm");if(!list||!form)return;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 async function load(){let rows=[];if(window.DP.db){const {data,error}=await window.DP.db.from("reviews").select("id,display_name,rating,body,created_at,is_verified").eq("is_visible",true).order("created_at",{ascending:false});if(!error)rows=data||[]}else rows=[{id:1,display_name:"Cliente de demostración",rating:5,body:"Excelente atención y buena orientación al elegir mis equipos. (Reseña de muestra)",created_at:new Date().toISOString()}];
 list.innerHTML=rows.length?rows.map(r=>`<article class="review-card"><header><div><b>${esc(r.display_name)}</b><div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5-r.rating)}</div></div><span class="review-date">${new Date(r.created_at).toLocaleDateString("es-DO")}</span></header><p>${esc(r.body)}</p>${r.is_verified?'<span class="small">Compra verificada</span>':''}</article>`).join(""):'<div class="empty">Todavía no hay reseñas publicadas.</div>';
 const avg=rows.length?rows.reduce((a,r)=>a+r.rating,0)/rows.length:0;document.querySelector("#reviewAverage").textContent=rows.length?avg.toFixed(1)+"/5":"—";document.querySelector("#reviewCount").textContent=rows.length+" reseña(s)"}
 form.addEventListener("submit",async e=>{e.preventDefault();const name=form.display_name.value.trim(),body=form.body.value.trim(),rating=Number(form.rating.value);if(name.length<2||body.length<10||rating<1||rating>5){window.DP.toast("Completa los campos. La opinión debe tener al menos 10 caracteres.");return}
 if(!window.DP.db){window.DP.toast("Las reseñas requieren configurar Supabase y una cuenta.");return}
 const {data:{user}}=await window.DP.db.auth.getUser();if(!user){location.href="login.html?next=resenas.html";return}
 const {error}=await window.DP.db.from("reviews").insert({user_id:user.id,display_name:name,rating,body});if(error){window.DP.toast("No se pudo publicar: "+error.message);return}form.reset();window.DP.toast("Reseña enviada para revisión");load()});
 load();
})();
