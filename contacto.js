document.querySelector("#contactForm")?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.currentTarget;
  const values = Object.fromEntries(new FormData(form));
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email);
  const validName = values.name.trim().length >= 2;
  const validMessage = values.message.trim().length >= 10;

  if (!validEmail || !validName || !validMessage) {
    window.DP.toast("Verifica nombre, correo y mensaje (mínimo 10 caracteres).");
    return;
  }

  if (!window.DP.db) {
    window.DP.toast("Configura Supabase para almacenar el mensaje.");
    return;
  }

  const { error } = await window.DP.db.from("contact_messages").insert({
    name: values.name.trim(),
    email: values.email.trim(),
    phone: values.phone.trim(),
    subject: values.subject.trim(),
    message: values.message.trim()
  });

  if (error) {
    window.DP.toast("No se pudo enviar: " + error.message);
    return;
  }

  form.reset();
  window.DP.toast("Mensaje enviado. Gracias por contactarnos.");
});
