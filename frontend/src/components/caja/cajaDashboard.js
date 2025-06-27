import React, { useEffect, useState } from 'react';
import {
  abrirCaja,
  cerrarCaja,
  registrarMovimientoCaja,
  obtenerCajaActual,
  obtenerHistorialCajas,
  obtenerClientes,
} from '../../api';
import { Button, Form, Table, Alert, Row, Col, Badge, Spinner } from 'react-bootstrap';

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
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [movimientosPorCaja, setMovimientosPorCaja] = useState({});

  // Nuevos estados para filtro de fechas
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Estado para mostrar u ocultar historial
  const [mostrarHistorial, setMostrarHistorial] = useState(true);

  const cargarCaja = async () => {
    try {
      const res = await obtenerCajaActual();
      if (res.data.success) {
        setCaja(res.data.data?.caja);
        setMovimientos(res.data.data?.movimientos || []);
      }
    } catch {
      setError('Error al obtener la caja.');
    }
  };

  const cargarHistorialCajas = async (pagina = 1) => {
    setLoadingHistorial(true);
    try {
      const params = { page: pagina, limit: 5 };
      if (fechaDesde) params.fecha_desde = fechaDesde;
      if (fechaHasta) params.fecha_hasta = fechaHasta;

      const res = await obtenerHistorialCajas(params);
      if (res.data.success) {
        setHistorialCajas(res.data.data.cajas);
        setPageHistorial(res.data.data.pagination.page);
        setTotalPagesHistorial(res.data.data.pagination.pages);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar historial de cajas.');
    }
    setLoadingHistorial(false);
  };

  const cargarClientes = async () => {
    try {
      const res = await obtenerClientes();
      if (res.data.success) {
        setClientes(res.data.data.clientes || []);
      } else {
        setClientes([]);
      }
    } catch {
      setError('Error al cargar clientes');
      setClientes([]);
    }
  };

  const handleAbrirCaja = async () => {
    if (!montoApertura || isNaN(montoApertura) || parseFloat(montoApertura) <= 0) {
      setError('Ingrese un monto de apertura válido');
      return;
    }
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
      await cargarHistorialCajas(pageHistorial);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar movimiento.');
    }
  };

  const handleCerrarCaja = async () => {
    const monto = prompt('Monto de cierre:');
    if (!monto) return;
    if (isNaN(monto) || parseFloat(monto) < 0) {
      setError('Ingrese un monto válido para cierre');
      return;
    }
    try {
      await cerrarCaja({
        caja_id: caja.id,
        usuario_id: usuarioId,
        monto_cierre: parseFloat(monto),
        observaciones: 'Cierre manual',
      });
      setSuccessMsg('Caja cerrada correctamente');
      await cargarCaja();
      await cargarHistorialCajas(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cerrar caja.');
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const renderPaginacionHistorial = () => {
    if (totalPagesHistorial <= 1) return null;
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

  const toggleMovimientosCaja = (cajaId) => {
    if (movimientosPorCaja[cajaId]) {
      setMovimientosPorCaja((prev) => {
        const copy = { ...prev };
        delete copy[cajaId];
        return copy;
      });
    } else {
      const caja = historialCajas.find((c) => c.id === cajaId);
      if (caja) {
        setMovimientosPorCaja((prev) => ({ ...prev, [cajaId]: caja.movimientos || [] }));
      }
    }
  };

  useEffect(() => {
    cargarCaja();
    cargarHistorialCajas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                          {cliente.nombre + ' ' + cliente.apellido}
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

      {/* Formulario filtro fechas */}
      <Form className="mb-3 d-flex gap-2 align-items-end flex-wrap">
        <Form.Group controlId="fechaDesde" className="me-2">
          <Form.Label>Fecha Desde</Form.Label>
          <Form.Control
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </Form.Group>

        <Form.Group controlId="fechaHasta" className="me-2">
          <Form.Label>Fecha Hasta</Form.Label>
          <Form.Control
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </Form.Group>

        <Button onClick={() => cargarHistorialCajas(1)} className="mb-2">
          Filtrar
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            setFechaDesde('');
            setFechaHasta('');
            cargarHistorialCajas(1);
          }}
          className="mb-2"
        >
          Limpiar Filtro
        </Button>
      </Form>

      {/* Botón para mostrar/ocultar historial */}
      <Button
        variant="secondary"
        size="sm"
        className="mb-2"
        onClick={() => setMostrarHistorial(!mostrarHistorial)}
      >
        {mostrarHistorial ? 'Ocultar Historial' : 'Mostrar Historial'}
      </Button>

      {/* Mostrar historial solo si mostrarHistorial es true */}
      {mostrarHistorial && (
        <>
          <h4 className="mt-4">Historial de Cajas</h4>
          {loadingHistorial ? (
            <div className="text-center">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
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
                {historialCajas.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      No hay cajas en el historial.
                    </td>
                  </tr>
                )}
                {historialCajas.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr>
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
                    {movimientosPorCaja[c.id] && (
                      <tr>
                        <td colSpan={8}>
                          <Table bordered size="sm" responsive>
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Tipo</th>
                                <th>Monto</th>
                                <th>Descripción</th>
                                <th>Cliente</th>
                                <th>Método Pago</th>
                              </tr>
                            </thead>
                            <tbody>
                              {movimientosPorCaja[c.id].map((mov) => (
                                <tr key={mov.id}>
                                  <td>{new Date(mov.fecha_movimiento).toLocaleString()}</td>
                                  <td>{mov.tipo_movimiento}</td>
                                  <td
                                    style={{
                                      color:
                                        parseFloat(mov.monto_con_signo) < 0 ? 'red' : 'green',
                                    }}
                                  >
                                    {formatCurrency(mov.monto_con_signo)}
                                  </td>
                                  <td>{mov.descripcion}</td>
                                  <td>
                                    {mov.cliente_nombre && mov.cliente_apellido
                                      ? `${mov.cliente_nombre} ${mov.cliente_apellido}`
                                      : '-'}
                                  </td>
                                  <td>{mov.metodo_pago || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </Table>
          )}
          <div className="d-flex justify-content-center mt-3">{renderPaginacionHistorial()}</div>
        </>
      )}
    </div>
  );
};

export default CajaDashboard;
