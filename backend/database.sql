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

-- Extensión del schema existente para Sistema de Caja
USE peluqueria_db;

-- Tabla de Cajas (Sesiones de caja diarias)
CREATE TABLE IF NOT EXISTS cajas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_apertura DATETIME NOT NULL,
    fecha_cierre DATETIME NULL,
    monto_apertura DECIMAL(10, 2) NOT NULL,
    monto_cierre DECIMAL(10, 2) NULL,
    usuario_apertura_id INT NOT NULL,
    usuario_cierre_id INT NULL,
    estado ENUM('abierta', 'cerrada') NOT NULL DEFAULT 'abierta',
    observaciones TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_apertura_id) REFERENCES usuarios(id),
    FOREIGN KEY (usuario_cierre_id) REFERENCES usuarios(id)
);

-- Tabla de Movimientos de Caja
CREATE TABLE IF NOT EXISTS movimientos_caja (
    id INT AUTO_INCREMENT PRIMARY KEY,
    caja_id INT NOT NULL,
    tipo_movimiento ENUM('apertura', 'cobro_cliente', 'compra_proveedor', 'ajuste_positivo', 'ajuste_negativo', 'retiro') NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    descripcion TEXT NOT NULL,
    metodo_pago ENUM('efectivo', 'transferencia', 'tarjeta_debito', 'tarjeta_credito') NOT NULL DEFAULT 'efectivo',
    
    -- Referencias opcionales según el tipo de movimiento
    cliente_id INT NULL, -- Para cobros a clientes
    turno_id INT NULL, -- Para vincular con servicios realizados
    proveedor VARCHAR(255) NULL, -- Para compras a proveedores
    
    -- Campos de auditoría
    usuario_id INT NOT NULL,
    fecha_movimiento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (caja_id) REFERENCES cajas(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (turno_id) REFERENCES turnos(id) ON DELETE SET NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    
    -- Índices para mejorar performance
    INDEX idx_caja_fecha (caja_id, fecha_movimiento),
    INDEX idx_tipo_movimiento (tipo_movimiento),
    INDEX idx_cliente (cliente_id),
    INDEX idx_fecha (fecha_movimiento)
);

-- Tabla para Tipos de Gastos/Compras (Opcional - para categorizar mejor)
CREATE TABLE IF NOT EXISTS categorias_gastos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT NULL,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar categorías básicas
INSERT IGNORE INTO categorias_gastos (nombre, descripcion) VALUES 
('Productos', 'Compra de productos para el salón'),
('Servicios', 'Servicios externos (limpieza, mantenimiento, etc.)'),
('Equipamiento', 'Herramientas y equipos'),
('Gastos Generales', 'Gastos varios del negocio'),
('Impuestos', 'Pagos de impuestos y tasas');

-- Agregar campo opcional para categorizar gastos
ALTER TABLE movimientos_caja 
ADD COLUMN categoria_gasto_id INT NULL,
ADD FOREIGN KEY (categoria_gasto_id) REFERENCES categorias_gastos(id) ON DELETE SET NULL;

-- Vista para resumen de caja actual
CREATE OR REPLACE VIEW vista_caja_actual AS
SELECT 
    c.*,
    u_apertura.nombre_usuario as usuario_apertura,
    u_cierre.nombre_usuario as usuario_cierre,
    COALESCE(SUM(CASE 
        WHEN mc.tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
        THEN mc.monto 
        ELSE -mc.monto 
    END), c.monto_apertura) as saldo_actual,
    COUNT(mc.id) as total_movimientos
FROM cajas c
LEFT JOIN usuarios u_apertura ON c.usuario_apertura_id = u_apertura.id
LEFT JOIN usuarios u_cierre ON c.usuario_cierre_id = u_cierre.id
LEFT JOIN movimientos_caja mc ON c.id = mc.caja_id
WHERE c.estado = 'abierta'
GROUP BY c.id;

-- Vista para reportes de movimientos
CREATE OR REPLACE VIEW vista_movimientos_detalle AS
SELECT 
    mc.*,
    c.fecha_apertura,
    c.fecha_cierre,
    CONCAT(cl.nombre, ' ', cl.apellido) as cliente_nombre,
    cl.telefono as cliente_telefono,
    s.nombre_servicio,
    s.precio as precio_servicio,
    u.nombre_usuario,
    cg.nombre as categoria_gasto,
    CASE 
        WHEN mc.tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
        THEN mc.monto 
        ELSE -mc.monto 
    END as monto_con_signo
FROM movimientos_caja mc
JOIN cajas c ON mc.caja_id = c.id
JOIN usuarios u ON mc.usuario_id = u.id
LEFT JOIN clientes cl ON mc.cliente_id = cl.id
LEFT JOIN turnos t ON mc.turno_id = t.id
LEFT JOIN servicios s ON t.servicio_id = s.id
LEFT JOIN categorias_gastos cg ON mc.categoria_gasto_id = cg.id
ORDER BY mc.fecha_movimiento DESC;

-- Procedimiento para cerrar caja
DELIMITER //
CREATE PROCEDURE CerrarCaja(
    IN p_caja_id INT,
    IN p_usuario_cierre_id INT,
    IN p_monto_cierre DECIMAL(10,2),
    IN p_observaciones TEXT
)
BEGIN
    DECLARE v_saldo_calculado DECIMAL(10,2);
    DECLARE v_existe_caja INT DEFAULT 0;
    
    -- Verificar que la caja existe y está abierta
    SELECT COUNT(*) INTO v_existe_caja
    FROM cajas 
    WHERE id = p_caja_id AND estado = 'abierta';
    
    IF v_existe_caja = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'La caja no existe o ya está cerrada';
    END IF;
    
    -- Calcular saldo actual
    SELECT COALESCE(SUM(CASE 
        WHEN tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
        THEN monto 
        ELSE -monto 
    END), 0) INTO v_saldo_calculado
    FROM movimientos_caja 
    WHERE caja_id = p_caja_id;
    
    -- Actualizar la caja
    UPDATE cajas 
    SET 
        fecha_cierre = NOW(),
        monto_cierre = p_monto_cierre,
        usuario_cierre_id = p_usuario_cierre_id,
        estado = 'cerrada',
        observaciones = p_observaciones,
        updated_at = NOW()
    WHERE id = p_caja_id;
    
    -- Retornar información del cierre
    SELECT 
        p_caja_id as caja_id,
        v_saldo_calculado as saldo_calculado,
        p_monto_cierre as monto_declarado,
        (p_monto_cierre - v_saldo_calculado) as diferencia;
        
END //
DELIMITER ;

-- Función para obtener saldo actual de caja
DELIMITER //
CREATE FUNCTION ObtenerSaldoCaja(p_caja_id INT) 
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_saldo DECIMAL(10,2) DEFAULT 0;
    
    SELECT COALESCE(SUM(CASE 
        WHEN tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
        THEN monto 
        ELSE -monto 
    END), 0) INTO v_saldo
    FROM movimientos_caja 
    WHERE caja_id = p_caja_id;
    
    RETURN v_saldo;
END //
DELIMITER ;

-- Trigger para actualizar monto_cierre automáticamente
DELIMITER //
CREATE TRIGGER actualizar_saldo_caja
    AFTER INSERT ON movimientos_caja
    FOR EACH ROW
BEGIN
    DECLARE v_saldo DECIMAL(10,2);
    
    -- Solo actualizar si la caja está abierta
    IF (SELECT estado FROM cajas WHERE id = NEW.caja_id) = 'abierta' THEN
        SET v_saldo = ObtenerSaldoCaja(NEW.caja_id);
        
        UPDATE cajas 
        SET updated_at = NOW()
        WHERE id = NEW.caja_id;
    END IF;
END //
DELIMITER ;

-- Índices adicionales para optimización
CREATE INDEX idx_cajas_fecha_estado ON cajas(fecha_apertura, estado);
CREATE INDEX idx_movimientos_fecha_tipo ON movimientos_caja(fecha_movimiento, tipo_movimiento);

-- Datos de ejemplo (opcional)
-- INSERT INTO cajas (fecha_apertura, monto_apertura, usuario_apertura_id) 
-- VALUES (NOW(), 1000.00, 1);

-- INSERT INTO movimientos_caja (caja_id, tipo_movimiento, monto, descripcion, usuario_id)
-- VALUES (1, 'apertura', 1000.00, 'Apertura de caja', 1);