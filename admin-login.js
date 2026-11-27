/* Acceso exclusivo al panel administrativo */
(async () => {
    const db = window.DP?.db;
    const form = document.querySelector("#adminLoginForm");
    const notice = document.querySelector("#adminLoginNotice");
    const submit = form?.querySelector('button[type="submit"]');

    if (!db) {
        notice.textContent = "No se pudo conectar con Supabase. Revisa js/supabase.js.";
        return;
    }

    const destination = new URLSearchParams(location.search).get("next");
    const safeNext = destination && /^[a-z-]+\.html$/i.test(destination)
        ? destination
        : "dashboard.html";

    async function checkAdmin(user) {
        if (!user) return false;
        const { data: profile, error } = await db
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

        if (error || profile?.role !== "admin") return false;
        location.replace(safeNext);
        return true;
    }

    // Si ya existe una sesión administrativa, entrar directamente.
    const { data: { user } } = await db.auth.getUser();
    if (user) {
        const isAdmin = await checkAdmin(user);
        if (!isAdmin) {
            notice.textContent = "Esta cuenta no tiene permisos de administrador. Utiliza una cuenta autorizada.";
        }
    }

    form?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = form.email.value.trim();
        const password = form.password.value;
        if (!email || !password) return;

        if (submit) {
            submit.disabled = true;
            submit.textContent = "Verificando…";
        }
        notice.textContent = "Comprobando las credenciales y los permisos…";

        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) {
            notice.textContent = "No se pudo iniciar sesión. Comprueba el correo y la contraseña.";
            if (submit) { submit.disabled = false; submit.textContent = "Entrar como administrador"; }
            return;
        }

        const isAdmin = await checkAdmin(data.user);
        if (!isAdmin) {
            notice.textContent = "Acceso denegado. Tu cuenta no tiene el rol de administrador.";
            await db.auth.signOut();
        }

        if (submit) { submit.disabled = false; submit.textContent = "Entrar como administrador"; }
    });
})();
