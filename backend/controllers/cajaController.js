const db = require('../db');

const cajaController = {
    // 1. ABRIR CAJA
    abrirCaja: async (req, res) => {
        try {
            const { monto_apertura, usuario_id, observaciones } = req.body;

            if (!monto_apertura || !usuario_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Monto de apertura y usuario son requeridos'
                });
            }

            const cajaAbierta = await db.query('SELECT id FROM cajas WHERE estado = "abierta"');

            if (cajaAbierta.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe una caja abierta. Debe cerrarla antes de abrir una nueva.'
                });
            }

            const resultCaja = await db.query(`
                INSERT INTO cajas (fecha_apertura, monto_apertura, usuario_apertura_id, observaciones)
                VALUES (NOW(), ?, ?, ?)`,
                [monto_apertura, usuario_id, observaciones || null]
            );

            const cajaId = resultCaja.insertId;

            await db.query(`
                INSERT INTO movimientos_caja 
                (caja_id, tipo_movimiento, monto, descripcion, usuario_id, fecha_movimiento)
                VALUES (?, 'apertura', ?, 'Apertura de caja', ?, NOW())`,
                [cajaId, monto_apertura, usuario_id]
            );

            res.json({
                success: true,
                message: 'Caja abierta exitosamente',
                data: {
                    caja_id: cajaId,
                    monto_apertura,
                    fecha_apertura: new Date()
                }
            });

        } catch (error) {
            console.error('Error al abrir caja:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 2. CERRAR CAJA
    cerrarCaja: async (req, res) => {
        try {
            const { caja_id, usuario_id, monto_cierre, observaciones } = req.body;

            if (!caja_id || !usuario_id || monto_cierre === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de caja, usuario y monto de cierre son requeridos'
                });
            }

            const result = await db.query(
                'CALL CerrarCaja(?, ?, ?, ?)',
                [caja_id, usuario_id, monto_cierre, observaciones || null]
            );

            res.json({
                success: true,
                message: 'Caja cerrada exitosamente',
                data: result[0][0]
            });

        } catch (error) {
            console.error('Error al cerrar caja:', error);
            if (error.code === 'ER_SIGNAL_EXCEPTION') {
                res.status(400).json({ success: false, message: error.sqlMessage });
            } else {
                res.status(500).json({ success: false, message: 'Error interno del servidor' });
            }
        }
    },

    // 3. REGISTRAR MOVIMIENTO DE CAJA
    registrarMovimiento: async (req, res) => {
        try {
            const {
                tipo_movimiento, monto, descripcion, metodo_pago = 'efectivo',
                cliente_id, turno_id, proveedor, categoria_gasto_id, usuario_id
            } = req.body;

            if (!tipo_movimiento || !monto || !descripcion || !usuario_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo de movimiento, monto, descripción y usuario son requeridos'
                });
            }

            const cajaAbierta = await db.query('SELECT id FROM cajas WHERE estado = "abierta"');

            if (cajaAbierta.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay una caja abierta para registrar movimientos'
                });
            }

            const cajaId = cajaAbierta[0].id;

            const result = await db.query(`
                INSERT INTO movimientos_caja 
                (caja_id, tipo_movimiento, monto, descripcion, metodo_pago, 
                 cliente_id, turno_id, proveedor, categoria_gasto_id, usuario_id, fecha_movimiento)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [cajaId, tipo_movimiento, monto, descripcion, metodo_pago,
                cliente_id || null, turno_id || null, proveedor || null,
                categoria_gasto_id || null, usuario_id]
            );

            const saldo = await db.query(
                'SELECT ObtenerSaldoCaja(?) as saldo_actual',
                [cajaId]
            );

            res.json({
                success: true,
                message: 'Movimiento registrado exitosamente',
                data: {
                    movimiento_id: result.insertId,
                    saldo_actual: saldo[0].saldo_actual
                }
            });

        } catch (error) {
            console.error('Error al registrar movimiento:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 4. OBTENER CAJA ACTUAL
    obtenerCajaActual: async (req, res) => {
        try {
            const caja = await db.query('SELECT * FROM vista_caja_actual');

            if (caja.length === 0) {
                return res.json({ success: true, message: 'No hay caja abierta', data: null });
            }

            const movimientos = await db.query(`
                SELECT * FROM vista_movimientos_detalle 
                WHERE caja_id = ?
                ORDER BY fecha_movimiento DESC`, [caja[0].id]);

            res.json({
                success: true,
                data: {
                    caja: caja[0],
                    movimientos
                }
            });

        } catch (error) {
            console.error('Error al obtener caja actual:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 5. OBTENER RESUMEN DE CAJA CERRADA
    obtenerResumenCaja: async (req, res) => {
        try {
            const { caja_id } = req.params;

            const caja = await db.query(`
                SELECT c.*, 
                       u_apertura.nombre_usuario as usuario_apertura,
                       u_cierre.nombre_usuario as usuario_cierre
                FROM cajas c
                LEFT JOIN usuarios u_apertura ON c.usuario_apertura_id = u_apertura.id
                LEFT JOIN usuarios u_cierre ON c.usuario_cierre_id = u_cierre.id
                WHERE c.id = ?`, [caja_id]);

            if (caja.length === 0) {
                return res.status(404).json({ success: false, message: 'Caja no encontrada' });
            }

            const movimientos = await db.query(`
                SELECT * FROM vista_movimientos_detalle 
                WHERE caja_id = ?
                ORDER BY fecha_movimiento ASC`, [caja_id]);

            const resumen = await db.query(`
                SELECT 
                    tipo_movimiento,
                    COUNT(*) as cantidad,
                    SUM(monto) as total_monto,
                    metodo_pago
                FROM movimientos_caja 
                WHERE caja_id = ?
                GROUP BY tipo_movimiento, metodo_pago
                ORDER BY tipo_movimiento`, [caja_id]);

            res.json({
                success: true,
                data: {
                    caja: caja[0],
                    movimientos,
                    resumen_por_tipo: resumen
                }
            });

        } catch (error) {
            console.error('Error al obtener resumen de caja:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 6. REPORTE POR FECHAS
    generarReporte: async (req, res) => {
        try {
            const { fecha_desde, fecha_hasta, tipo_movimiento, usuario_id } = req.query;

            if (!fecha_desde || !fecha_hasta) {
                return res.status(400).json({
                    success: false,
                    message: 'Fecha desde y fecha hasta son requeridas'
                });
            }

            let whereClause = 'WHERE DATE(c.fecha_apertura) BETWEEN ? AND ?';
            let params = [fecha_desde, fecha_hasta];

            if (tipo_movimiento) {
                whereClause += ' AND mc.tipo_movimiento = ?';
                params.push(tipo_movimiento);
            }

            if (usuario_id) {
                whereClause += ' AND mc.usuario_id = ?';
                params.push(usuario_id);
            }

            const movimientos = await db.query(`
                SELECT vmd.*, c.estado as estado_caja
                FROM vista_movimientos_detalle vmd
                JOIN cajas c ON vmd.caja_id = c.id
                ${whereClause}
                ORDER BY vmd.fecha_movimiento DESC`, params);

            const resumen = await db.query(`
                SELECT 
                    COUNT(DISTINCT c.id) as total_cajas,
                    COUNT(mc.id) as total_movimientos,
                    SUM(CASE WHEN mc.tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
                             THEN mc.monto ELSE 0 END) as total_ingresos,
                    SUM(CASE WHEN mc.tipo_movimiento IN ('compra_proveedor', 'ajuste_negativo', 'retiro') 
                             THEN mc.monto ELSE 0 END) as total_egresos,
                    SUM(CASE WHEN mc.tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
                             THEN mc.monto ELSE -mc.monto END) as saldo_neto
                FROM cajas c
                LEFT JOIN movimientos_caja mc ON c.id = mc.caja_id
                ${whereClause}`, params);

            res.json({
                success: true,
                data: {
                    movimientos,
                    resumen: resumen[0]
                }
            });

        } catch (error) {
            console.error('Error al generar reporte:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 7. OBTENER CATEGORÍAS DE GASTOS
    obtenerCategoriasGastos: async (req, res) => {
        try {
            const categorias = await db.query(`
                SELECT * FROM categorias_gastos 
                WHERE activo = TRUE 
                ORDER BY nombre
            `);

            res.json({
                success: true,
                data: categorias
            });

        } catch (error) {
            console.error('Error al obtener categorías:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    },

    // 8. HISTORIAL DE CAJAS CON MOVIMIENTOS
    obtenerHistorial: async (req, res) => {
    try {
      let page = parseInt(req.query.page, 10);
      let limit = parseInt(req.query.limit, 10);

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;

      const offset = (page - 1) * limit;

      // Consulta principal, inyectando limit y offset validos directamente
      const cajas = await db.query(`
        SELECT c.*, 
               u_apertura.nombre_usuario as usuario_apertura,
               u_cierre.nombre_usuario as usuario_cierre,
               COUNT(mc.id) as total_movimientos,
               COALESCE(SUM(CASE 
                   WHEN mc.tipo_movimiento IN ('apertura', 'cobro_cliente', 'ajuste_positivo') 
                   THEN mc.monto 
                   ELSE -mc.monto 
               END), c.monto_apertura) as saldo_final
        FROM cajas c
        LEFT JOIN usuarios u_apertura ON c.usuario_apertura_id = u_apertura.id
        LEFT JOIN usuarios u_cierre ON c.usuario_cierre_id = u_cierre.id
        LEFT JOIN movimientos_caja mc ON c.id = mc.caja_id
        GROUP BY c.id
        ORDER BY c.fecha_apertura DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      const cajaIds = cajas.map(c => c.id);

      let movimientos = [];
      if (cajaIds.length > 0) {
        movimientos = await db.query(`
          SELECT * FROM vista_movimientos_detalle 
          WHERE caja_id IN (${cajaIds.map(() => '?').join(',')})
          ORDER BY caja_id DESC, fecha_movimiento DESC
        `, cajaIds);
      }

      const movimientosPorCaja = {};
      for (const mov of movimientos) {
        if (!movimientosPorCaja[mov.caja_id]) movimientosPorCaja[mov.caja_id] = [];
        movimientosPorCaja[mov.caja_id].push(mov);
      }

      const cajasConMovimientos = cajas.map(caja => ({
        ...caja,
        movimientos: movimientosPorCaja[caja.id] || []
      }));

      const totalCount = await db.query('SELECT COUNT(*) as total FROM cajas');

      res.json({
        success: true,
        data: {
          cajas: cajasConMovimientos,
          pagination: {
            page,
            limit,
            total: totalCount[0].total,
            pages: Math.ceil(totalCount[0].total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener historial:', error);
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  },

};

module.exports = cajaController;
