CORRECCIÓN DEL SISTEMA DE RESEÑAS

1. Se normalizaron las rutas de reseñas a nombres ASCII: resenas.html, css/resenas.css, js/resenas.js y admin/resenas.html.
2. El formulario general guarda reseñas vinculadas al usuario autenticado y las deja pendientes (is_visible=false) para moderación.
3. El formulario de cada producto guarda product_id y solo funciona para productos reales existentes en Supabase. Los productos de demostración no tienen UUID ni registro en la base de datos.
4. El panel de administrador permite aprobar/ocultar/eliminar reseñas y muestra los errores devueltos por Supabase.

IMPORTANTE: En Supabase > SQL Editor, ejecutar database/fix_resenas.sql una vez. Verificar que el usuario administrador tenga role='admin' en public.profiles.

Para enviar reseñas, el cliente debe iniciar sesión. La reseña no se muestra públicamente hasta que un administrador pulse Publicar en el panel.
