# D'Paniagua Technology

Proyecto académico Full Stack con HTML5, CSS3, JavaScript puro, Supabase Auth y PostgreSQL.

> **Importante:** el catálogo y los registros de `database/datos_prueba.sql` usan modelos comerciales como referencia; los precios y existencias son datos ficticios de demostración. No representan inventario real ni ventas reales. Las direcciones, teléfono, correo y testimonios también son ilustrativos. Las fotografías de productos se cargan desde sus fuentes públicas y requieren conexión a Internet; cada tarjeta tiene una ilustración local de respaldo si una imagen externa deja de estar disponible.

## 1. Descomprimir y abrir

1. Descomprime `D-PANIAGUA-TECHNOLOGY.zip`.
2. Abre la carpeta `D-PANIAGUA-TECHNOLOGY` en Visual Studio Code.
3. Instala la extensión **Live Server** (recomendado) y pulsa *Go Live* sobre `index.html`.
4. No abras los HTML mediante `file://`: el servidor local evita problemas de módulos, rutas y políticas del navegador.

## 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com/).
2. En **Project Settings → API**, copia Project URL y la clave pública `anon`/`publishable`.
3. Abre `js/supabase.js` y sustituye:
   - `https://TU-PROYECTO.supabase.co`
   - `TU_CLAVE_ANON_O_PUBLISHABLE`
4. Usa únicamente la clave pública en el navegador. **Nunca** pongas `service_role`, secretos ni contraseñas en JavaScript.

## 3. Crear tablas y políticas

En Supabase abre **SQL Editor → New query** y ejecuta los archivos que aún no hayas aplicado, en este orden:

1. `database/schema.sql`
2. `database/policies.sql`
3. `database/datos_prueba.sql` (opcional, contiene productos de demostración)
4. `database/migracion_metodos_pago.sql`
5. `database/migracion_comercio_admin.sql`

La última migración agrega combos, dirección de entrega, historial de pedidos e inventario, estados de publicación y operaciones transaccionales de checkout y administración. Está preparada para conservar las filas existentes. En los pedidos anteriores, el sistema no repone inventario al cancelarlos porque no puede saber si se había reservado.

Los scripts crean perfiles, categorías, productos, pedidos, líneas de pedido, reseñas y mensajes de contacto; incluyen relaciones, restricciones, índices, trigger de perfil y RLS. El archivo de datos carga seis productos de referencia con URLs de fotografías y puede ejecutarse nuevamente para actualizar el catálogo sin duplicar esos artículos.

## 4. Crear el primer administrador de forma segura

1. En **Authentication → Users**, crea el usuario administrador con correo de tu propiedad y una contraseña robusta.
2. Copia el UUID de ese usuario.
3. En SQL Editor ejecuta, sustituyendo el UUID:
   ```sql
   update public.profiles
   set role = 'admin'
   where id = 'UUID-DEL-USUARIO';
   ```
4. Inicia sesión en `login.html` y entra a `admin/dashboard.html`.

El registro automático asigna siempre `customer`. No existe un formulario público para autoproclamarse administrador. El cambio de rol se realiza desde el entorno confiable de Supabase.

## 5. Iniciar la web

- Conecta Supabase como se explica arriba.
- Inicia Live Server desde `index.html`.
- Usa las páginas HTML independientes para navegar por categorías, reseñas, asistente, contacto y administración.
- Si Supabase no está configurado, la portada y el catálogo usan una vista previa local de productos ficticios. Los pedidos, autenticación, reseñas y mensajes requieren backend conectado.

## 6. Funcionalidades incluidas

- Páginas HTML independientes: inicio, siete categorías, reseñas, asistente, contacto, login, carrito y seis vistas administrativas.
- Identidad visual responsive negra/roja, navbar translúcido, banner SVG local, tarjetas, estados hover y navegación.
- Catálogo: lectura de productos publicados desde Supabase, búsqueda, filtro por categoría y orden por precio; fallback de demostración claramente rotulado.
- Carrito persistente en `localStorage`, agregar, eliminar, cantidades y cálculo de total.
- Checkout con autenticación y validación de stock consultado en Supabase.
- Reseñas: usuario autenticado, validación, publicación inmediata y moderación administrativa.
- Asistente conversacional por reglas, con recomendaciones tomadas del catálogo publicado y disponibilidad.
- Supabase Auth: inicio/cierre de sesión y comprobación de rol en el panel.
- Administración: estadísticas basadas en Supabase, edición completa de productos, inventario, pedidos, usuarios, reseñas, actividad reciente y combos.
- Checkout: dirección de entrega guardada con el pedido y reserva transaccional de inventario para productos y combos.
- Contacto: validación de campos y persistencia en `contact_messages`.
- Scripts SQL con PK, FK, CHECK, índices, trigger de perfiles y RLS.

## 7. Funcionalidades que requieren configuración externa

- Proyecto Supabase y credenciales públicas.
- Crear usuario(s) en Supabase Auth y promover el primer admin desde SQL Editor.
- Datos reales, fotografías reales, precios, inventario, dirección, correo, teléfono y redes oficiales.
- La librería `@supabase/supabase-js` se carga desde CDN; se requiere conexión a Internet para Auth/DB.
- Despliega la función administrativa de usuarios desde la carpeta del proyecto con Supabase CLI:
  ```sh
  supabase functions deploy admin-users --project-ref TU_PROJECT_REF
  ```
  La función usa las variables seguras del entorno de Supabase y nunca expone `service_role` al navegador.
- Para producción: almacenamiento de imágenes en Supabase Storage, correo transaccional y CAPTCHA/rate limiting para el formulario público de contacto.

## 8. Seguridad y límites conocidos

- RLS está activado en las tablas protegidas y los permisos se basan en `auth.uid()` y `public.is_admin()`.
- Los visitantes solo leen productos publicados y categorías. Clientes solo consultan sus pedidos y crean reseñas propias.
- Los usuarios no pueden cambiar su rol mediante el cliente.
- El checkout de esta versión crea pedidos mediante una función RPC que vuelve a consultar precios y stock y reserva inventario dentro de una transacción. Las líneas y los totales no se pueden escribir directamente desde el navegador.
- Contacto público requiere CAPTCHA o rate limiting contra spam.
- La administración de imágenes en Storage no se incluye; el CRUD guarda URL de imágenes.
- El asistente es un motor de reglas local, no un modelo generativo ni una API de pago.
- Las tarjetas del catálogo usan fotografías de productos comerciales (Samsung, Lenovo, LG y Sony) alojadas por fuentes públicas; las ilustraciones SVG locales se conservan como respaldo si una fotografía externa no carga.

## 9. Pruebas sugeridas para la defensa

1. Abrir todas las páginas y comprobar enlaces del navbar/footer.
2. Añadir artículos desde una categoría, navegar a otra y comprobar persistencia del carrito.
3. Conectar Supabase, registrar un cliente en Auth y probar login.
4. Publicar una reseña: debe quedar oculta hasta que un admin la modere.
5. Enviar un formulario de contacto y comprobar la fila en `contact_messages`.
6. Probar el asistente con una consulta y presupuesto; compara solo productos publicados disponibles.
7. Crear un administrador desde SQL y comprobar acceso al dashboard.
8. Entrar con usuario cliente a `/admin/dashboard.html`: la interfaz deniega acceso y RLS impide operaciones admin.
9. Probar CRUD de productos y cambios de estado de pedidos con rol admin.
10. Revisar consola y pestaña Network en escritorio y móvil.

## 10. Tecnologías

- HTML5 semántico, CSS moderno y JavaScript ES6.
- Supabase JS v2 vía CDN para Auth y consultas PostgreSQL.
- PostgreSQL, triggers, funciones auxiliares y Row Level Security.
- No se utiliza framework de frontend.


## Registro y métodos de pago (actualización)
- Si aparece `email rate limit exceeded`, Supabase ha limitado temporalmente los correos de autenticación. Espera antes de reintentar; revisa Authentication → Rate Limits y el proveedor SMTP/email en Supabase. El frontend muestra ahora un mensaje explicativo y evita inducir reintentos repetidos.
- Ejecuta `database/migracion_metodos_pago.sql` y después `database/migracion_comercio_admin.sql` para habilitar el pedido con dirección, combos e inventario transaccional.
- Contra entrega registra el pedido con pago pendiente; el administrador lo confirma después de validar el cobro.
- WhatsApp abre una conversación con el carrito preparado al número 829-672-6146.
- PayPal y tarjeta permanecen sin cobro hasta integrar una pasarela y su validación en servidor. La tienda no marca esos pagos como realizados ni crea un pedido por esos métodos mientras no estén conectados.
- Nunca solicites ni almacenes números de tarjeta o CVV en el frontend.
