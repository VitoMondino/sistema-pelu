-- Crear la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS peluqueria_db;
USE peluqueria_db;

-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
);

-- Insertar usuario por defecto
INSERT IGNORE INTO usuarios (nombre_usuario, contrasena) VALUES ('MVsalonUrbano', 'Tunumero200105+'); -- Considerar hashear la contraseña en una implementación real

-- Tabla de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NOT NULL UNIQUE,
    fecha_cumpleanos DATE,
    notas TEXT NULL -- Nuevo campo para notas del cliente
);

-- Tabla de Servicios
CREATE TABLE IF NOT EXISTS servicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_servicio VARCHAR(255) NOT NULL UNIQUE,
    precio DECIMAL(10, 2) NOT NULL
);

-- Tabla de Turnos
CREATE TABLE IF NOT EXISTS turnos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    servicio_id INT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    estado ENUM('Pendiente', 'Realizado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    recordatorio_enviado BOOLEAN NOT NULL DEFAULT FALSE, -- Nuevo campo
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (servicio_id) REFERENCES servicios(id) ON DELETE CASCADE
);

-- Tabla de Stock
CREATE TABLE IF NOT EXISTS stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(255) NOT NULL UNIQUE,
    cantidad INT NOT NULL DEFAULT 0,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    precio_venta DECIMAL(10, 2) NOT NULL,
    stock_minimo INT NOT NULL DEFAULT 0 -- Nuevo campo para stock mínimo
);

-- Tabla de Movimientos de Stock (Nueva)
CREATE TABLE IF NOT EXISTS movimientos_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    producto_id INT NOT NULL,
    tipo_movimiento ENUM('entrada_manual', 'salida_manual', 'ajuste_positivo', 'ajuste_negativo', 'venta', 'venta_anulada', 'uso_interno', 'compra_proveedor', 'devolucion_proveedor') NOT NULL,
    cantidad_movida INT NOT NULL, -- Positivo para entradas/ajustes positivos, negativo para salidas/ajustes negativos
    motivo VARCHAR(255) NULL,
    precio_unitario_movimiento DECIMAL(10, 2) NULL, -- Opcional, para registrar costo en compras o ventas
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    turno_id INT NULL, -- Para vincular a una venta o anulación de venta específica
    FOREIGN KEY (producto_id) REFERENCES stock(id) ON DELETE CASCADE, -- O ON DELETE RESTRICT si se prefiere no borrar productos con movimientos
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL -- Si se borra un turno, que no borre el movimiento de stock
);
