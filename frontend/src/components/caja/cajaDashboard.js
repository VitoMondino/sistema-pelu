import React, { useEffect, useState } from 'react';
import {
  abrirCaja,
  cerrarCaja,
  registrarMovimientoCaja,
  obtenerCajaActual,
  obtenerHistorialCajas,
  // eliminé obtenerClientes importado porque la definimos acá
} from '../../api';
import { Button, Form, Table, Alert, Row, Col, Badge } from 'react-bootstrap';

// Función para obtener clientes desde /clientes
const obtenerClientes = async () => {
  try {
    const response = await fetch('/clientes');
    if (!response.ok) throw new Error('Error al obtener clientes');
    const data = await response.json();
    return { data };
  } catch (error) {
    throw error;
  }
};

const CajaDashboard = () => {
  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [montoApertura, setMontoApertura] = useState('');
  const usuarioId = JSON.parse(localStorage.getItem('user'))?.id || 1;
  const [descripcion, setDescripcion] = useState('');
  const [montoMovimiento, setMontoMovimiento] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('cobro_cliente');
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [historialCajas, setHistorialCajas] = useState([]);
  const [pageHistorial, setPageHistorial] = useState(1);
  const [totalPagesHistorial, setTotalPagesHistorial] = useState(1);

  const [movimientosPorCaja, setMovimientosPorCaja] = useState({});

  const cargarCaja = async () => {
    try {
      const res = await obtenerCajaActual();
      if (res.data.success) {
        setCaja(res.data.data?.caja);
        setMovimientos(res.data.data?.movimientos || []);
      }
    } catch (err) {
      setError('Error al obtener la caja.');
    }
  };

  const cargarHistorialCajas = async (pagina = 1) => {
    try {
      const res = await obtenerHistorialCajas({ page: pagina, limit: 10 });
      if (res.data.success) {
        setHistorialCajas(res.data.data.cajas);
        setPageHistorial(res.data.data.pagination.page);
        setTotalPagesHistorial(res.data.data.pagination.pages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar historial de cajas.');
    }
  };

  const cargarClientes = async () => {
    try {
      const res = await obtenerClientes();
      if (res.data.success) {
        setClientes(res.data.data.clientes || []);
      } else {
        setClientes([]);
      }
    } catch (err) {
      setError('Error al cargar clientes');
      setClientes([]);
    }
  };

  const handleAbrirCaja = async () => {
    try {
      await abrirCaja({
        monto_apertura: parseFloat(montoApertura),
        usuario_id: usuarioId,
        observaciones: 'Apertura diaria',
      });
      setSuccessMsg('Caja abierta correctamente');
      setMontoApertura('');
      await cargarCaja();
      await cargarHistorialCajas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir la caja.');
    }
  };

  const handleRegistrarMovimiento = async () => {
    if (!montoMovimiento || isNaN(montoMovimiento) || parseFloat(montoMovimiento) <= 0) {
      setError('Por favor, ingrese un monto válido para el movimiento.');
      return;
    }
    if (!descripcion.trim()) {
      setError('Por favor, ingrese una descripción para el movimiento.');
      return;
    }
    if (tipoMovimiento === 'cobro_cliente' && !clienteSeleccionado) {
      setError('Por favor, seleccione un cliente para el cobro.');
      return;
    }

    try {
      const payload = {
        tipo_movimiento: tipoMovimiento,
        monto: parseFloat(montoMovimiento),
        descripcion,
        usuario_id: usuarioId,
      };

      if (tipoMovimiento === 'cobro_cliente') {
        payload.cliente_id = clienteSeleccionado;
      }

      await registrarMovimientoCaja(payload);

      setSuccessMsg('Movimiento registrado');
      setDescripcion('');
      setMontoMovimiento('');
      setClienteSeleccionado('');
      await cargarCaja();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar movimiento.');
    }
  };

  const handleCerrarCaja = async () => {
    const monto = prompt('Monto de cierre:');
    if (!monto) return;
    try {
      await cerrarCaja({
        caja_id: caja.id,
        usuario_id: usuarioId,
        monto_cierre: parseFloat(monto),
        observaciones: 'Cierre manual',
      });
      setSuccessMsg('Caja cerrada correctamente');
      await cargarCaja();
      await cargarHistorialCajas();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar caja.');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const renderPaginacionHistorial = () => {
    const items = [];
    for (let i = 1; i <= totalPagesHistorial; i++) {
      items.push(
        <Button
          key={i}
          size="sm"
          variant={i === pageHistorial ? 'primary' : 'light'}
          className="me-1"
          onClick={() => cargarHistorialCajas(i)}
        >
          {i}
        </Button>
      );
    }
    return items;
  };

  const toggleMovimientosCaja = async (cajaId) => {
    if (movimientosPorCaja[cajaId]) {
      setMovimientosPorCaja((prev) => {
        const copy = { ...prev };
        delete copy[cajaId];
        return copy;
      });
    } else {
      try {
        const res = await obtenerHistorialCajas({ page: 1, limit: 1000 });
        if (res.data.success) {
          const caja = res.data.data.cajas.find((c) => c.id === cajaId);
          setMovimientosPorCaja((prev) => ({ ...prev, [cajaId]: caja?.movimientos || [] }));
        }
      } catch (err) {
        setError('Error al cargar movimientos de la caja.');
      }
    }
  };

  useEffect(() => {
    cargarCaja();
    cargarHistorialCajas();
  }, []);

  // CORRECCIÓN: El array de dependencias debe ser constante para evitar el warning
  useEffect(() => {
    if (tipoMovimiento === 'cobro_cliente') {
      cargarClientes();
    } else {
      setClientes([]);
      setClienteSeleccionado('');
    }
  }, [tipoMovimiento]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Caja</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" onClose={() => setSuccessMsg(null)} dismissible>
          {successMsg}
        </Alert>
      )}

      {!caja ? (
        <>
          <Form.Control
            type="number"
            placeholder="Monto de apertura"
            value={montoApertura}
            onChange={(e) => setMontoApertura(e.target.value)}
            className="mb-2"
          />
          <Button onClick={handleAbrirCaja}>Abrir Caja</Button>
        </>
      ) : (
        <>
          <h5 className="mt-3">
            Caja Abierta el {new Date(caja.fecha_apertura).toLocaleString()}{' '}
            <Badge bg="success">Caja Abierta</Badge>
          </h5>
          <p>
            Saldo actual: <strong>{formatCurrency(caja.saldo_actual)}</strong>
          </p>

          <Form className="mb-4">
            <Row>
              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Tipo de Movimiento</Form.Label>
                  <Form.Select value={tipoMovimiento} onChange={(e) => setTipoMovimiento(e.target.value)}>
                    <option value="cobro_cliente">Cobro Cliente</option>
                    <option value="compra_proveedor">Compra Proveedor</option>
                    <option value="ajuste_positivo">Ajuste Positivo</option>
                    <option value="ajuste_negativo">Ajuste Negativo</option>
                    <option value="retiro">Retiro</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {tipoMovimiento === 'cobro_cliente' && (
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select
                      value={clienteSeleccionado}
                      onChange={(e) => setClienteSeleccionado(e.target.value)}
                    >
                      <option value="">-- Seleccione Cliente --</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={4}>
                <Form.Label>Monto</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Monto"
                  value={montoMovimiento}
                  onChange={(e) => setMontoMovimiento(e.target.value)}
                />
              </Col>

              <Col md={12}>
                <Form.Label>Descripción</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Descripción"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </Col>
            </Row>

            <div className="mt-3">
              <Button onClick={handleRegistrarMovimiento}>Registrar Movimiento</Button>
              <Button variant="danger" className="ms-2" onClick={handleCerrarCaja}>
                Cerrar Caja
              </Button>
            </div>
          </Form>

          <h4>Movimientos de Caja</h4>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th>Método de Pago</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => (
                <tr key={m.id}>
                  <td>{new Date(m.fecha_movimiento).toLocaleString()}</td>
                  <td>
                    <Badge
                      bg={
                        m.tipo_movimiento.includes('ajuste')
                          ? 'warning'
                          : m.tipo_movimiento === 'cobro_cliente'
                          ? 'success'
                          : 'danger'
                      }
                    >
                      {m.tipo_movimiento}
                    </Badge>
                  </td>
                  <td style={{ color: parseFloat(m.monto_con_signo) < 0 ? 'red' : 'green' }}>
                    {formatCurrency(m.monto_con_signo)}
                  </td>
                  <td>{m.descripcion}</td>
                  <td>{m.metodo_pago || '-'}</td>
                  <td>{m.usuario || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      <h4 className="mt-4">Historial de Cajas</h4>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha Apertura</th>
            <th>Fecha Cierre</th>
            <th>Monto Apertura</th>
            <th>Monto Cierre</th>
            <th>Usuario Apertura</th>
            <th>Usuario Cierre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {historialCajas.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td>
              <td>{new Date(c.fecha_apertura).toLocaleString()}</td>
              <td>{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleString() : '-'}</td>
              <td>{formatCurrency(c.monto_apertura)}</td>
              <td>{c.monto_cierre ? formatCurrency(c.monto_cierre) : '-'}</td>
              <td>{c.usuario_apertura}</td>
              <td>{c.usuario_cierre || '-'}</td>
              <td>
                <Button size="sm" onClick={() => toggleMovimientosCaja(c.id)}>
                  {movimientosPorCaja[c.id] ? 'Ocultar Movimientos' : 'Ver Movimientos'}
                </Button>
              </td>
            </tr>
          ))}
          {historialCajas.map(
            (c) =>
              movimientosPorCaja[c.id] && (
                <tr key={'movimientos-' + c.id}>
                  <td colSpan={8}>
                    <Table bordered size="sm">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Tipo</th>
                          <th>Monto</th>
                          <th>Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {movimientosPorCaja[c.id].map((mov) => (
                          <tr key={mov.id}>
                            <td>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                            <td>{mov.tipo_movimiento}</td>
                            <td>{formatCurrency(mov.monto_con_signo)}</td>
                            <td>{mov.descripcion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </td>
                </tr>
              )
          )}
        </tbody>
      </Table>

      <div className="d-flex justify-content-center mt-3">{renderPaginacionHistorial()}</div>
    </div>
  );
};

export default CajaDashboard;
