# Natural Sushi — Sitio web

Sitio web para restaurante de comida japonesa con **menú digital**, **carrito**, **pedidos por WhatsApp** y **panel administrativo**. Diseño responsive con tema oscuro y acentos verdes.

## Stack

- **PHP 8+** — lógica del servidor y API REST
- **MySQL 8+ / MariaDB 10.4+** — base de datos
- **HTML5** — estructura de las vistas
- **CSS3 + Bootstrap 5** — estilos y responsive
- **JavaScript (vanilla)** — carrito, filtros, panel admin
- **Sin dependencias PHP externas** — solo PDO (incluido en PHP)

## Estructura

```
natural-sushi/
├── public/                    ← vistas (páginas)
│   ├── index.html             ← inicio
│   ├── menu.html              ← menú digital
│   ├── carrito.html           ← carrito
│   ├── contacto.html          ← contacto + mapa
│   ├── nosotros.html          ← sobre nosotros
│   └── admin.html             ← login + panel admin
│
├── partials/                  ← componentes reutilizables
│   ├── navbar.html
│   └── footer.html
│
├── assets/
│   ├── css/styles.css         ← estilo global
│   ├── js/
│   │   ├── main.js            ← utilidades, carga de partials, carrito
│   │   ├── home.js            ← destacados
│   │   ├── menu.js            ← menú + filtros + búsqueda
│   │   ├── cart.js            ← carrito + envío WhatsApp
│   │   ├── contacto.js        ← formulario contacto
│   │   └── admin.js           ← login + CRUD
│   └── img/
│
├── app/                       ← código PHP (POO)
│   ├── config/Database.php    ← conexión centralizada PDO
│   ├── models/
│   │   ├── Product.php
│   │   ├── Category.php
│   │   └── User.php
│   ├── controllers/
│   │   ├── ProductController.php
│   │   ├── CategoryController.php
│   │   └── AuthController.php
│   └── helpers/ResponseHelper.php
│
├── api/                       ← endpoints JSON
│   ├── products.php
│   ├── categories.php
│   ├── auth.php
│   └── settings.php
│
├── database/schema.sql        ← esquema + seed
├── config.example.php         ← plantilla de configuración
├── .htaccess                  ← protección de archivos sensibles
└── README.md
```

## Instalación

### 1. Copia los archivos al servidor
Colócalos en la raíz de tu servidor (XAMPP: `htdocs/natural-sushi/`, MAMP: `htdocs/natural-sushi/`, hosting: `public_html/`).

### 2. Crea la base de datos
Desde phpMyAdmin o consola MySQL:

```bash
mysql -u root -p < database/schema.sql
```

Esto crea la base `natural_sushi`, todas las tablas y datos de ejemplo (categorías, 12 productos, usuario admin).

### 3. Configura las credenciales
Copia `config.example.php` como `config.php` y edita:

```php
return [
    'host'     => '127.0.0.1',
    'port'     => 3306,
    'database' => 'natural_sushi',
    'username' => 'root',      // tu usuario MySQL
    'password' => '',          // tu contraseña
];
```

### 4. Configura tu número de WhatsApp
En la tabla `settings`, edita `whatsapp_number` con tu número en formato internacional sin `+`:

```sql
UPDATE settings SET setting_value = '5215512345678' WHERE setting_key = 'whatsapp_number';
```

### 5. Abre el sitio
Navega a `http://localhost/natural-sushi/public/index.html`.

Para el panel admin: `http://localhost/natural-sushi/public/admin.html`
- Usuario: `admin`
- Contraseña: `admin123`

**⚠️ Cambia la contraseña antes de subir a producción.** Para generar un nuevo hash:

```bash
php -r "echo password_hash('tu_password_seguro', PASSWORD_BCRYPT).PHP_EOL;"
```

Y ejecuta:
```sql
UPDATE users SET password_hash = '$2y$10$...' WHERE username = 'admin';
```

## Funcionalidades

### Sitio público
- ✅ Inicio con hero, destacados y CTA a WhatsApp
- ✅ Menú digital con categorías, búsqueda y filtros
- ✅ Carrito persistente (localStorage) con cantidades editables
- ✅ **Envío del pedido por WhatsApp** (sin pagos en línea)
- ✅ Página de contacto con Google Maps embebido y formulario
- ✅ Página "Nosotros" con historia y estadísticas
- ✅ Responsive completo (móvil, tablet, escritorio)

### Panel administrativo
- ✅ Login con sesión segura (PHP session + regenerate_id)
- ✅ CRUD de productos (crear, editar, activar/desactivar, eliminar)
- ✅ CRUD de categorías
- ✅ Gestión de precios y platillos destacados
- ✅ Imágenes por URL o emoji-placeholder si no hay foto

## Sistema de pedidos por WhatsApp

El sitio **no procesa pagos** — solo genera un mensaje pre-armado y lo envía por WhatsApp al negocio. Ejemplo:

```
Hola, quiero hacer un pedido:

• 2 × Sushi Roll Especial — $360
• 1 × Gyozas — $120
• 1 × Limonada Natural — $60

Total estimado: $540

(Pago en local o al recibir)
```

Se abre en la app oficial de WhatsApp usando el enlace `wa.me/<numero>?text=...`.

## Seguridad

- **Consultas preparadas (PDO)** en todas las operaciones — previene SQL Injection
- **Contraseñas con bcrypt** (`password_hash` / `password_verify`)
- **Sesiones HttpOnly + SameSite** para el panel admin
- **`session_regenerate_id`** después del login (previene fixation)
- **Rate limiting básico** en login (8 intentos por sesión)
- **`display_errors = 0`** en producción — logs internos, mensajes amigables al usuario
- **Validación en cliente y servidor** de todos los formularios
- **Config fuera de `public/`** — credenciales de BD nunca expuestas
- **`.htaccess`** bloquea acceso directo a `app/`, `database/` y archivos sensibles

## API REST

Todos los endpoints devuelven JSON. Las mutaciones requieren sesión activa.

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/products.php` | Lista productos activos |
| GET | `/api/products.php?featured=1` | Solo destacados |
| GET | `/api/products.php?all=1` | Todos (requiere auth) |
| GET | `/api/products.php?id=1` | Un producto |
| POST | `/api/products.php` | Crear (auth) |
| PUT | `/api/products.php` | Actualizar (auth) |
| DELETE | `/api/products.php?id=1` | Eliminar (auth) |
| GET | `/api/categories.php` | Lista categorías activas |
| POST/PUT/DELETE | `/api/categories.php` | CRUD (auth) |
| POST | `/api/auth.php?action=login` | Login |
| POST | `/api/auth.php?action=logout` | Logout |
| GET | `/api/auth.php?action=me` | Sesión actual |
| GET | `/api/settings.php` | Config del negocio |

## Próximas mejoras sugeridas

- Subida de imágenes al servidor (actualmente solo URLs)
- Registro de pedidos en base de datos (auditoría)
- Panel de pedidos recibidos
- Promociones y cupones
- PWA para experiencia móvil nativa
