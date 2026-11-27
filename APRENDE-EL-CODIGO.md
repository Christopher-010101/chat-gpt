# Aprende el código de D'Paniagua Technology

Guía de estudio basada en los archivos actuales del proyecto.

## 1. Cómo está organizado

- `index.html` y páginas HTML: estructura y contenido.
- `css/`: colores, tamaños, distribución y diseño adaptable.
- `js/`: comportamiento, consultas, carrito, autenticación y panel.
- `database/schema.sql`: tablas, relaciones y restricciones.
- `database/policies.sql`: reglas RLS que controlan quién puede leer o modificar datos.
- `supabase/functions/`: operaciones que deben ejecutarse de forma segura en el servidor.

## 2. Los lenguajes

### HTML — estructura

Ejemplo de `admin/productos.html`:

```html
<form id="productCreate">
  <input name="name" placeholder="Nombre del producto" required>
  <input name="price" type="number" required>
  <button type="submit">Guardar producto</button>
</form>
```

`form` agrupa campos; `name` identifica cada dato; `required` obliga a completarlo; `id` permite que JavaScript encuentre el formulario.

### CSS — apariencia

Ejemplo:

```css
.product-card {
  border-radius: 16px;
  padding: 18px;
}
```

Cambia la apariencia de los elementos con clase `product-card`.

### JavaScript — comportamiento

Ejemplo:

```js
const precio = Number(formData.get("price"));
```

Lee el precio del formulario y lo convierte de texto a número antes de guardarlo.

## 3. Conexión con Supabase

Archivo: `js/supabase.js`.

- `SUPABASE_URL`: dirección del proyecto Supabase.
- `SUPABASE_ANON_KEY` (clave publicable): permite conectar el navegador, pero no sustituye las políticas RLS.
- `createClient(...)`: crea el cliente.
- `window.DP.db`: deja el cliente disponible para los otros archivos JavaScript.

Nunca pongas claves secretas o `service_role` en el navegador.

## 4. Cómo se registran los productos

Archivo: `admin/productos.html` contiene el formulario.
Archivo: `js/admin.js`, función `productsPage()`, carga categorías y registra los datos.

Al guardar se envía un objeto a `products` con:
- `name`: nombre.
- `brand`: marca.
- `category_id`: ID de la categoría seleccionada.
- `price`: precio actual.
- `compare_at_price`: precio anterior opcional.
- `stock`: unidades disponibles.
- `image_url`: enlace directo a la fotografía.
- `features`: características como arreglo de texto.
- `description`: descripción.
- `is_published`: si aparece en la tienda.

## 5. Agregar un producto desde el panel

1. Inicia sesión con un usuario cuyo `profiles.role` sea `admin`.
2. Abre Administración → Productos.
3. Escribe el nombre y la marca.
4. Escoge una categoría de la lista.
5. Escribe precio, precio anterior si aplica y stock inicial.
6. Pega el enlace directo de la imagen en `URL de imagen`.
7. Escribe características separadas por comas, por ejemplo: `128 GB, 8 GB RAM, AMOLED`.
8. Escribe una descripción.
9. Deja marcada la casilla de publicar si quieres que se vea en la tienda.
10. Pulsa Guardar producto.

### ¿Cómo conseguir el enlace de una imagen?

- Usa una imagen propia o una imagen cuyo uso tengas autorizado.
- En una página de imágenes, abre la imagen original y copia la dirección de la imagen, no la dirección de la página de producto.
- El enlace debe ser público, estable y comenzar por `https://`.
- Pruébalo abriéndolo en otra pestaña: debe mostrar la imagen sin pedir inicio de sesión.
- Algunos sitios bloquean el uso externo o cambian sus URL. Si no carga, usa una imagen alojada en un servicio/almacenamiento que controles, como Supabase Storage, y pega su URL pública.
- Recomendación: formato JPG, PNG o WebP; evita enlaces que caduquen o URL de búsqueda.

## 6. Qué ocurre después de guardar

1. JavaScript valida el formulario.
2. `db.from("products").insert(v)` envía el registro a Supabase.
3. PostgreSQL valida campos, claves foráneas y restricciones.
4. RLS decide si el usuario administrador puede insertar.
5. La página de categoría consulta productos publicados y muestra la imagen de `image_url`.

## 7. El stock

El stock inicial se introduce en el formulario. Al registrar un pedido contra entrega, la función SQL `create_order_and_decrease_stock` comprueba existencias y las reduce de forma transaccional. No reduzcas el stock desde el navegador: las ventas simultáneas deben validarse en la base de datos.

## 8. Ruta de estudio en cinco lecciones

1. HTML: identifica `form`, `input`, `select`, `button`, `id` y `name`.
2. CSS: localiza `.product-card`, `.admin-main` y las reglas `@media`.
3. JavaScript: estudia `productsPage()`, `FormData`, `Number()` y `db.from(...).insert(...)`.
4. SQL: estudia `categories`, `products`, `orders`, `order_items` y `reviews`.
5. Seguridad: estudia `policies.sql`, RLS, `auth.uid()` y la Edge Function.

## 9. Ejercicio para practicar

Registra un producto de prueba:
- Nombre: Mi celular de prueba
- Marca: Marca de prueba
- Categoría: Celulares
- Precio: 5000
- Stock: 3
- Imagen: una URL pública de una imagen que tengas derecho a utilizar
- Características: 128 GB, 6 GB RAM
- Publicado: sí

Después revisa que aparezca en la página Celulares, abre Ver detalles y confirma que se muestre la misma fotografía.
