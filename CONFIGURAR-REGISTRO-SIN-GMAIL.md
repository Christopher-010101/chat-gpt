# Configurar registro sin confirmación de Gmail

Este proyecto usa Supabase Auth. El código de la página no puede desactivar por sí solo la confirmación de correo: es un ajuste de seguridad del proyecto en Supabase.

## Pasos desde el celular

1. Abre https://supabase.com/dashboard e inicia sesión.
2. Selecciona el proyecto de D'Paniagua Technology.
3. Entra en **Authentication**.
4. Abre **Sign In / Providers** (en algunas versiones aparece como **Providers**).
5. Selecciona **Email**.
6. Busca **Confirm email** o **Enable email confirmations** y desactívalo.
7. Pulsa **Save changes**.

Luego, en tu página:
1. Abre el formulario de registro.
2. Crea una cuenta con un correo válido y una contraseña de al menos 6 caracteres.
3. Supabase debe devolver una sesión al registrarse y la página permitirá entrar sin esperar un Gmail.

## Importante

- No necesitas configurar SMTP si no vas a enviar correos de confirmación.
- Al desactivar la confirmación, cualquier persona puede registrarse usando una dirección de correo que no haya verificado. Usa contraseñas seguras y protege el panel administrativo con un rol `admin` asignado manualmente desde el SQL Editor.
- Esto no desactiva los correos de recuperación de contraseña; para esos mensajes sí será conveniente configurar un proveedor SMTP si quieres entregabilidad confiable.
- Si después de guardar el cambio sigue apareciendo que la cuenta no inicia sesión, revisa Authentication → Users. Si el correo ya existe, no intentes registrarlo repetidamente: cambia a **Entrar** y usa la contraseña de esa cuenta.
- Si aparece `email rate limit exceeded`, espera a que se restablezca el límite antes de volver a solicitar correos. Con confirmación desactivada no debería necesitarse un correo para el alta nueva.
