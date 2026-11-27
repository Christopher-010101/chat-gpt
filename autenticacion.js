(async()=>{
 const db=window.DP?.db;
 const form=document.querySelector('#loginForm');
 if(!form)return;
 if(!db){
  const msg=document.querySelector('[data-auth-required]');
  if(msg)msg.textContent='Configura las credenciales públicas de Supabase en js/supabase.js para habilitar las cuentas.';
  return;
 }
 const nameField=document.querySelector('#nameField');
 const nameInput=form.elements.full_name;
 const submit=document.querySelector('#authSubmit');
 const toggle=document.querySelector('#authModeToggle');
 const feedback=document.querySelector('#authFeedback');
 const message=document.querySelector('#authMessage');
 let creating=false;
 const showMessage=(text,ok=false)=>{
  feedback.textContent=text;
  feedback.classList.toggle('success',ok);
  feedback.classList.toggle('notice',!!text&&!ok);
 };
 toggle?.addEventListener('click',()=>{
  creating=!creating;
  nameField?.classList.toggle('hidden',!creating);
  nameInput.required=creating;
  submit.textContent=creating?'Crear cuenta':'Entrar';
  toggle.textContent=creating?'Ya tengo una cuenta':'Crear una cuenta';
  message.textContent=creating?'Regístrate para realizar pedidos y publicar reseñas.':'¿No tienes cuenta? Puedes crear una gratis.';
  form.elements.password.autocomplete=creating?'new-password':'current-password';
  showMessage('');
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=form.elements.email.value.trim();
  const password=form.elements.password.value;
  if(password.length<6)return showMessage('La contraseña debe tener al menos 6 caracteres.');
  submit.disabled=true;
  submit.textContent=creating?'Creando cuenta…':'Entrando…';
  showMessage('');
  try{
   if(creating){
    const fullName=nameInput.value.trim();
    if(fullName.length<2)throw new Error('Escribe tu nombre completo.');
    const {data,error}=await db.auth.signUp({
     email,password,
     options:{data:{full_name:fullName}}
    });
    if(error)throw error;
    if(data.session){
     showMessage('¡Cuenta creada! Ya puedes utilizar tu cuenta.',true);
     setTimeout(()=>location.href=new URLSearchParams(location.search).get('next')||'index.html',900);
    }else{
     // Supabase no devolvió una sesión: normalmente sigue activa la confirmación
     // de correo. El cambio debe hacerse en el Dashboard de Supabase.
     showMessage('La cuenta fue creada, pero Supabase no inició sesión automáticamente. Para permitir el acceso sin Gmail, desactiva “Confirm email” en Authentication → Sign In / Providers → Email → Save changes. Después vuelve a iniciar sesión con este correo y contraseña.',true);
     creating=false;nameField?.classList.add('hidden');nameInput.required=false;
     submit.textContent='Entrar';toggle.textContent='Crear una cuenta';
     message.textContent='Si la confirmación de correo está desactivada en Supabase, podrás entrar directamente.';
    }
   }else{
    const {error}=await db.auth.signInWithPassword({email,password});
    if(error)throw error;
    location.href=new URLSearchParams(location.search).get('next')||'index.html';
   }
  }catch(error){
   const raw=String(error.message||'');
   const lower=raw.toLowerCase();
   if(lower.includes('email rate limit')||lower.includes('rate limit')){
    showMessage('Supabase ha limitado temporalmente los correos de registro. Espera un rato antes de volver a intentarlo. No pulses varias veces. Si continúa, revisa Authentication → Rate Limits y el proveedor de correo en Supabase.');
   }else if(lower.includes('already registered')||lower.includes('already been registered')){
    showMessage('Este correo ya tiene una cuenta. Cambia a “Entrar” e inicia sesión.');
   }else if(lower.includes('invalid login credentials')){
    showMessage('Correo o contraseña incorrectos. Verifica los datos o crea una cuenta.');
   }else{showMessage(raw||'No se pudo completar la operación.');}
  }
  finally{submit.disabled=false;if(submit.textContent.endsWith('…'))submit.textContent=creating?'Crear cuenta':'Entrar';}
 });
 document.querySelector('#logoutBtn')?.addEventListener('click',async()=>{await db.auth.signOut();location.href='../index.html'});
 const {data:{user}}=await db.auth.getUser();
 if(user){document.querySelectorAll('[data-user-email]').forEach(e=>e.textContent=user.email);document.querySelectorAll('[data-logged-in]').forEach(e=>e.classList.remove('hidden'));}
})();
