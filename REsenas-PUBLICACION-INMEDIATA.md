# Reseñas de producto con publicación inmediata

Desde el botón **Detalles** de cada producto, el cliente que haya iniciado sesión puede seleccionar de 1 a 5 estrellas y escribir su comentario. Al enviar, la reseña se guarda vinculada al `product_id` y queda visible inmediatamente; ya no requiere aprobación administrativa.

## Activación obligatoria en Supabase

Si ya habías instalado el proyecto, abre Supabase → SQL Editor, pega y ejecuta el contenido de:

`database/migracion_resenas_publicacion_inmediata.sql`

Si estás instalando desde cero, usa `database/schema.sql` y después `database/policies.sql`.

## Reglas

- Solo usuarios autenticados pueden publicar.
- Cada reseña se vincula al producto abierto en Detalles.
- Un usuario puede publicar una reseña por producto (índice único).
- Las reseñas nuevas se muestran inmediatamente.
- `is_verified` permanece en `false`; no se afirma que sea compra verificada.
- Las reseñas generales enviadas desde la página general conservan su flujo independiente de moderación.
- Los productos de demostración locales (`demo-*`) no aceptan reseñas persistentes; publica primero el producto desde el administrador para que tenga un ID real en Supabase.
