# Administración de usuarios: modificar y eliminar

La página `admin/usuarios.html` ahora muestra botones **Modificar** y **Eliminar**.

## Qué permite

- Modificar nombre completo y rol (`customer` o `admin`).
- Eliminar cuentas de Auth y su perfil, con comprobación de seguridad.
- No permite eliminar la cuenta del administrador que está usando el panel.
- No permite quitar o eliminar al último administrador.
- No elimina usuarios que tengan pedidos: se conserva el historial de compras y se evita romper la relación `orders.user_id`.

## Activación obligatoria: desplegar la Edge Function

Por seguridad, un navegador NO debe usar `SUPABASE_SERVICE_ROLE_KEY`. Las operaciones administrativas de Auth deben ejecutarse en servidor.

En Supabase Dashboard:
1. Abre tu proyecto.
2. Ve a **Edge Functions** y crea una función llamada exactamente `admin-users`.
3. Copia el contenido de `supabase/functions/admin-users/index.ts` del ZIP en el editor de la función.
4. Despliega la función.
5. En **Edge Functions → Secrets** verifica que estén disponibles `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`. Supabase suele proporcionar estos secretos automáticamente; si no aparecen, configura sus valores en los secretos del proyecto. Nunca pongas la service role key en archivos HTML o JavaScript del navegador.
6. Vuelve al panel admin y abre Usuarios.

La función comprueba el JWT del usuario que llama y confirma en `profiles` que su rol sea `admin` antes de cada operación.

## Nota sobre usuarios con pedidos

La base de datos actual define `orders.user_id` con `ON DELETE RESTRICT`. Por ello, eliminar directamente a alguien con pedidos no es seguro: la función lo bloquea y explica el motivo. Para esos casos, conserva la cuenta o diseña un proceso separado de anonimización que mantenga el historial contable.
