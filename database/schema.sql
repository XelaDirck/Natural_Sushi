-- ============================================================
-- Natural Sushi - Esquema de Base de Datos
-- ============================================================
-- Ejecutar en MySQL 8.0+ o MariaDB 10.4+
-- ============================================================

DROP DATABASE IF EXISTS natural_sushi;
CREATE DATABASE natural_sushi
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE natural_sushi;

-- ---------- CATEGORÍAS ----------
CREATE TABLE categories (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(80)  NOT NULL UNIQUE,
  slug         VARCHAR(80)  NOT NULL UNIQUE,
  sort_order   INT          NOT NULL DEFAULT 0,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- PRODUCTOS ----------
CREATE TABLE products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  category_id   INT          NOT NULL,
  name          VARCHAR(120) NOT NULL,
  description   TEXT         NULL,
  price         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  image_url     VARCHAR(255) NULL,
  emoji         VARCHAR(10)  NULL,          -- placeholder visual si no hay imagen
  is_featured   TINYINT(1)   NOT NULL DEFAULT 0,
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  INDEX idx_products_active (is_active),
  INDEX idx_products_category (category_id)
) ENGINE=InnoDB;

-- ---------- USUARIOS ADMIN ----------
CREATE TABLE users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(60)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  full_name      VARCHAR(120) NULL,
  role           ENUM('admin','manager') NOT NULL DEFAULT 'admin',
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at  TIMESTAMP    NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------- CONFIGURACIÓN DEL NEGOCIO ----------
CREATE TABLE settings (
  setting_key    VARCHAR(60)  NOT NULL PRIMARY KEY,
  setting_value  TEXT         NULL,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA
-- ============================================================

-- Categorías
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Entradas',   'entradas',   1),
  ('Makis',      'makis',      2),
  ('Rolls',      'rolls',      3),
  ('Especiales', 'especiales', 4),
  ('Bebidas',    'bebidas',    5),
  ('Postres',    'postres',    6);

-- Productos
INSERT INTO products (category_id, name, description, price, emoji, is_featured) VALUES
  (1, 'Gyozas',          'Empanaditas japonesas rellenas de pollo y verduras.',      120.00, '🥟', 1),
  (1, 'Tacos de Salmón', 'Salmón fresco, tampico, aguacate y ajonjolí.',             150.00, '🌮', 1),
  (1, 'Edamames',        'Vainas de soya con sal de mar.',                            80.00, '🫛', 0),
  (1, 'Yakimeshi',       'Arroz frito con verduras, huevo y ajonjolí.',              140.00, '🍚', 1),
  (2, 'Maki California', 'Kanikama, aguacate y pepino cubierto de ajonjolí.',        160.00, '🍣', 1),
  (2, 'Maki Philadelphia','Salmón, queso crema y pepino.',                           180.00, '🍣', 0),
  (3, 'Sushi Roll Especial','Nuestro roll de la casa: salmón, atún y aguacate.',     180.00, '🍱', 1),
  (3, 'Dragon Roll',     'Anguila, aguacate y pepino con salsa dulce.',              210.00, '🐉', 1),
  (4, 'Combo Familiar',  'Selección de 24 piezas variadas para compartir.',          420.00, '🍱', 1),
  (5, 'Limonada Natural','Limón fresco con hierbabuena.',                             60.00, '🍋', 0),
  (5, 'Té Verde',        'Té verde tradicional japonés, caliente o frío.',            45.00, '🍵', 0),
  (6, 'Mochi',           'Bolita de arroz dulce con relleno de helado.',              70.00, '🍡', 1);

-- Usuario admin por defecto
-- Usuario: admin / Contraseña: admin123 (¡cambiar en producción!)
INSERT INTO users (username, password_hash, full_name, role) VALUES
  ('admin', '$2y$10$CZ7qgYUjlGB4L0PYEYMny.rBVFBbZJtylEsuA97uzs3oacZt2vot2', 'Administrador', 'admin');

-- Configuración del negocio
INSERT INTO settings (setting_key, setting_value) VALUES
  ('business_name',      'Natural Sushi'),
  ('whatsapp_number',    '5215512345678'),
  ('phone',              '55 1234 5678'),
  ('address',            'Av. Principal #123, Ciudad de México, México'),
  ('hours',              'Lun - Dom: 12:00 pm - 11:00 pm'),
  ('google_maps_url',    'https://maps.google.com/?q=Ciudad+de+Mexico'),
  ('facebook_url',       'https://facebook.com/naturalsushi'),
  ('instagram_url',      'https://instagram.com/naturalsushi'),
  ('tiktok_url',         'https://tiktok.com/@naturalsushi'),
  ('shipping_cost',      '0');
