# Diagrama relacional — D'Paniagua Technology

El diagrama refleja las tablas y claves foráneas que aparecen en `database/schema.sql`.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "crea perfil"
    PROFILES ||--o{ ORDERS : "realiza"
    PROFILES ||--o{ REVIEWS : "escribe"
    CATEGORIES ||--o{ PRODUCTS : "clasifica"
    PRODUCTS ||--o{ ORDER_ITEMS : "se vende en"
    ORDERS ||--|{ ORDER_ITEMS : "contiene"
    PRODUCTS ||--o{ REVIEWS : "recibe"

    PROFILES {
        uuid id PK,FK
        text full_name
        text role
        timestamptz created_at
    }
    CATEGORIES {
        uuid id PK
        text name UK
        text slug UK
        text description
    }
    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text name
        text brand
        text description
        numeric price
        numeric compare_at_price
        integer stock
        text image_url
        text_array features
        boolean is_published
    }
    ORDERS {
        uuid id PK
        uuid user_id FK
        numeric total
        text status
        timestamptz created_at
    }
    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        integer quantity
        numeric unit_price
    }
    REVIEWS {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        text display_name
        integer rating
        text body
        boolean is_visible
        boolean is_verified
    }
    CONTACT_MESSAGES {
        uuid id PK
        text name
        text email
        text phone
        text subject
        text message
        text status
    }
```

## Relaciones y cardinalidades

- `categories (1) → (N) products`: una categoría puede tener muchos productos; cada producto pertenece a una categoría.
- `profiles (1) → (N) orders`: un cliente puede hacer muchos pedidos; cada pedido pertenece a un perfil.
- `orders (1) → (N) order_items`: un pedido contiene una o varias líneas de productos.
- `products (1) → (N) order_items`: un producto puede aparecer en muchas líneas de pedido.
- `profiles (1) → (N) reviews`: un cliente puede escribir reseñas.
- `products (1) → (N) reviews`: una reseña de producto se vincula a un producto. `product_id` admite NULL para reseñas generales.
- `auth.users (1) → (1) profiles`: el perfil se crea automáticamente mediante el trigger `handle_new_user`.
- `contact_messages` es independiente; no tiene FK en el esquema actual.

## Claves importantes

- PK: identificador único de cada fila.
- FK: referencia a otra tabla.
- UK: valor único.
- `order_items` resuelve la relación muchos-a-muchos entre `orders` y `products`.
