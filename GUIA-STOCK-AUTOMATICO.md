# Descuento automático de inventario

## Qué hace

Al completar un pedido contra entrega desde el carrito:
- Supabase vuelve a consultar los precios y existencias reales.
- Bloquea los registros de productos para evitar que dos compras simultáneas vendan la última unidad dos veces.
- Comprueba que todos los productos estén publicados y tengan stock suficiente.
- Crea el pedido y sus artículos.
- Descuenta las cantidades del inventario dentro de la misma transacción.
- Si algo falla, no crea el pedido ni descuenta parcialmente el stock.

## Activación obligatoria en Supabase

1. Abre Supabase → SQL Editor → New query.
2. Copia todo el contenido de `database/migracion_stock_automatico.sql`.
3. Pulsa Run.
4. Sustituye los archivos del proyecto por esta versión del ZIP y publica el sitio.

## Importante sobre métodos de pago

Esta versión descuenta inventario al crear pedidos contra entrega. PayPal y tarjeta no deben descontar stock al abrir una página de pago: el descuento debe ocurrir después de que el proveedor confirme el pago en una función de servidor/webhook. WhatsApp solo abre una conversación para coordinar y tampoco descuenta stock automáticamente en esta versión.

Si el pedido se cancela después de haberse creado, debe implementarse una operación administrativa que restituya el stock una sola vez. No restaures stock editando manualmente el estado sin esa lógica.
