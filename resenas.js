/* Reseñas generales: envío autenticado y moderación por administrador. */
(async () => {
  const list = document.querySelector('#reviewsList');
  const form = document.querySelector('#reviewForm');
  if (!list || !form) return;

  const db = window.DP?.db;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);

  async function loadReviews() {
    if (!db) {
      list.innerHTML = '<div class="empty">Las reseñas estarán disponibles cuando Supabase esté conectado.</div>';
      document.querySelector('#reviewAverage').textContent = '—';
      document.querySelector('#reviewCount').textContent = '0 reseñas';
      return;
    }
    const { data, error } = await db.from('reviews')
      .select('id,display_name,rating,body,created_at,is_verified')
      .eq('is_visible', true)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error cargando reseñas:', error);
      list.innerHTML = `<div class="empty">No se pudieron cargar las reseñas: ${esc(error.message)}</div>`;
      return;
    }
    const rows = data || [];
    list.innerHTML = rows.length ? rows.map(r => `
      <article class="review-card">
        <header><div><b>${esc(r.display_name)}</b><div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div></div>
        <span class="review-date">${new Date(r.created_at).toLocaleDateString('es-DO')}</span></header>
        <p>${esc(r.body)}</p>${r.is_verified ? '<span class="small">Compra verificada</span>' : ''}
      </article>`).join('') : '<div class="empty">Todavía no hay reseñas aprobadas.</div>';
    const avg = rows.length ? rows.reduce((sum, r) => sum + Number(r.rating), 0) / rows.length : 0;
    document.querySelector('#reviewAverage').textContent = rows.length ? `${avg.toFixed(1)}/5` : '—';
    document.querySelector('#reviewCount').textContent = `${rows.length} reseña(s)`;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!db) return window.DP.toast('No hay conexión con Supabase.');
    const name = form.elements.namedItem('display_name').value.trim();
    const body = form.elements.namedItem('body').value.trim();
    const rating = Number(form.elements.namedItem('rating').value);
    if (name.length < 2 || body.length < 10 || rating < 1 || rating > 5) {
      return window.DP.toast('Escribe tu nombre, selecciona una calificación y agrega al menos 10 caracteres.');
    }
    const { data: { user }, error: authError } = await db.auth.getUser();
    if (authError) return window.DP.toast(`No se pudo verificar tu sesión: ${authError.message}`);
    if (!user) {
      location.href = `login.html?next=${encodeURIComponent('resenas.html')}`;
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    const { error } = await db.from('reviews').insert({
      user_id: user.id, display_name: name, rating, body,
      is_visible: false, is_verified: false
    });
    submit.disabled = false;
    if (error) {
      console.error('Error publicando reseña:', error);
      return window.DP.toast(`No se pudo enviar la reseña: ${error.message}`);
    }
    form.reset();
    window.DP.toast('Reseña enviada. El administrador debe aprobarla antes de publicarse.');
  });

  await loadReviews();
})();
