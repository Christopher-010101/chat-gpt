# Productos en páginas individuales y reseñas

- Las páginas `celulares.html`, `laptops.html`, `tablets.html`, `televisores.html`, `electrodomesticos.html`, `accesorios.html` y `ofertas.html` siguen siendo listados por categoría.
- El botón **Ver detalles** de cada tarjeta abre `producto.html?id=IDENTIFICADOR`. Así, cada producto tiene su propia URL y ficha individual, no una ventana modal.
- La ficha individual muestra imagen, descripción, precio, disponibilidad, características, botón para añadir al carrito y reseñas vinculadas al ID exacto del producto.
- Para publicar una reseña, el cliente debe iniciar sesión. El aviso ahora cambia según el estado real de sesión y el enlace de acceso regresa al detalle del producto.
- Para reseñas persistentes, el producto debe existir en `public.products` (producto creado desde el panel). Los productos locales `demo-*` sirven de muestra y no pueden guardar reseñas.
- En Supabase ejecuta `database/migracion_resenas_publicacion_inmediata.sql` para permitir inserción de reseñas con `is_visible=true`. La publicación inmediata requiere que RLS permita la operación.
