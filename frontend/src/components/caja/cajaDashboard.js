import React, { useEffect, useState } from "react";
import {
  abrirCaja,
  cerrarCaja,
  registrarMovimientoCaja,
  obtenerCajaActual,
  obtenerHistorialCajas,
  fetchClientes,
  fetchClienteById,
  obtenerClientes,
} from "../../api";
import {
  Button,
  Form,
  Table,
  Alert,
  Row,
  Col,
  Badge,
  Spinner,
  Modal,
  InputGroup,
  Toast,
  ToastContainer,
} from "react-bootstrap";

const CajaDashboard = () => {
  const [caja, setCaja] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [montoApertura, setMontoApertura] = useState("");
  const usuarioId = JSON.parse(localStorage.getItem("user"))?.id || 1;
  const [descripcion, setDescripcion] = useState("");
  const [montoMovimiento, setMontoMovimiento] = useState("");
  const [tipoMovimiento, setTipoMovimiento] = useState("cobro_cliente");
  const [clientes, setClientes] = useState([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [clientesLoading, setClientesLoading] = useState(false);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [historialCajas, setHistorialCajas] = useState([]);
  const [pageHistorial, setPageHistorial] = useState(1);
  const [totalPagesHistorial, setTotalPagesHistorial] = useState(1);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [movimientosPorCaja, setMovimientosPorCaja] = useState({});
  const [mostrarHistorial, setMostrarHistorial] = useState(true);

  // Estados del modal de cierre de caja
  const [showModalCerrar, setShowModalCerrar] = useState(false);
  const [montoCierre, setMontoCierre] = useState("");

  const cargarCaja = async () => {
    try {
      const res = await obtenerCajaActual();
      if (res.data.success) {
        setCaja(res.data.data?.caja);
        setMovimientos(res.data.data?.movimientos || []);
      }
    } catch {
      setError("Error al obtener la caja.");
    }
  };

  const cargarHistorialCajas = async (pagina = 1) => {
    setLoadingHistorial(true);
    try {
      const params = { page: pagina, limit: 5 };
      const res = await obtenerHistorialCajas(params);
      if (res.data.success) {
        setHistorialCajas(res.data.data.cajas);
        setPageHistorial(res.data.data.pagination.page);
        setTotalPagesHistorial(res.data.data.pagination.pages);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Error al cargar historial de cajas."
      );
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
      setError("Error al cargar clientes");
      setClientes([]);
    }
  };

  const handleAbrirCaja = async () => {
    if (
      !montoApertura ||
      isNaN(montoApertura) ||
      parseFloat(montoApertura) <= 0
    ) {
      setError("Ingrese un monto de apertura válido");
      return;
    }
    try {
      await abrirCaja({
        monto_apertura: parseFloat(montoApertura),
        usuario_id: usuarioId,
        observaciones: "Apertura diaria",
      });
      setSuccessMsg("Caja abierta correctamente");
      // auto-hide success message
      setTimeout(() => setSuccessMsg(null), 4000);
      setMontoApertura("");
      await cargarCaja();
      await cargarHistorialCajas();
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir la caja.");
    }
  };

  const handleRegistrarMovimiento = async () => {
    if (
      !montoMovimiento ||
      isNaN(montoMovimiento) ||
      parseFloat(montoMovimiento) <= 0
    ) {
      setError("Por favor, ingrese un monto válido para el movimiento.");
      return;
    }
    if (!descripcion.trim()) {
      setError("Por favor, ingrese una descripción para el movimiento.");
      return;
    }
    if (tipoMovimiento === "cobro_cliente" && !clienteSeleccionado) {
      setError("Por favor, seleccione un cliente para el cobro.");
      return;
    }

    try {
      const payload = {
        tipo_movimiento: tipoMovimiento,
        monto: parseFloat(montoMovimiento),
        descripcion,
        usuario_id: usuarioId,
        metodo_pago: metodoPago,
      };

      if (tipoMovimiento === "cobro_cliente") {
        payload.cliente_id = clienteSeleccionado;
      }

      await registrarMovimientoCaja(payload);

      setSuccessMsg("Movimiento registrado");
      setTimeout(() => setSuccessMsg(null), 4000);
      setDescripcion("");
      setMontoMovimiento("");
      setClienteSeleccionado("");
      setMetodoPago("efectivo");
      await cargarCaja();
      await cargarHistorialCajas(pageHistorial);
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar movimiento.");
    }
  };

  // Cierre de caja con modal
  const handleCerrarCaja = async () => {
    if (!montoCierre || isNaN(montoCierre) || parseFloat(montoCierre) < 0) {
      setError("Ingrese un monto válido para cierre");
      return;
    }
    try {
      await cerrarCaja({
        caja_id: caja.id,
        usuario_id: usuarioId,
        monto_cierre: parseFloat(montoCierre),
        observaciones: "Cierre manual",
      });
      setSuccessMsg("Caja cerrada correctamente");
      setTimeout(() => setSuccessMsg(null), 4000);
      setShowModalCerrar(false);
      setMontoCierre("");
      await cargarCaja();
      await cargarHistorialCajas(1);
    } catch (err) {
      setError(err.response?.data?.message || "Error al cerrar caja.");
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  const tipoLabels = {
    cobro_cliente: 'Cobro a Cliente',
    compra_proveedor: 'Compra a Proveedor',
    ajuste_positivo: 'Ajuste Positivo',
    ajuste_negativo: 'Ajuste Negativo',
    retiro: 'Retiro',
  };

  // Validaciones UI
  const canOpenCaja = () => montoApertura && !isNaN(montoApertura) && parseFloat(montoApertura) > 0;
  const canRegisterMovimiento = () => {
    if (!montoMovimiento || isNaN(montoMovimiento) || parseFloat(montoMovimiento) <= 0) return false;
    if (!descripcion.trim()) return false;
    if (tipoMovimiento === 'cobro_cliente' && !clienteSeleccionado) return false;
    return true;
  };

  const renderPaginacionHistorial = () => {
    if (totalPagesHistorial <= 1) return null;
    const items = [];
    for (let i = 1; i <= totalPagesHistorial; i++) {
      items.push(
        <Button
          key={i}
          size="sm"
          variant={i === pageHistorial ? "primary" : "light"}
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
        setMovimientosPorCaja((prev) => ({
          ...prev,
          [cajaId]: caja.movimientos || [],
        }));
      }
    }
  };

  useEffect(() => {
    cargarCaja();
    cargarHistorialCajas();
  }, []);

  useEffect(() => {
    if (tipoMovimiento === "cobro_cliente") {
      // habilitar búsqueda por nombre; no traer todos los clientes
      setClientes([]);
      setClienteSeleccionado("");
      setClientSearch("");
    } else {
      setClientes([]);
      setClienteSeleccionado("");
    }
  }, [tipoMovimiento]);

  // Debounce búsqueda de clientes: solo buscar si hay al menos 3 caracteres
  useEffect(() => {
    const term = (clientSearch || "").trim();
    if (term.length < 3) {
      setClientes([]);
      setClientesLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setClientesLoading(true);
      try {
        const res = await fetchClientes(term);
        const dataArray = Array.isArray(res.data?.data?.clientes)
          ? res.data.data.clientes
          : Array.isArray(res.data)
          ? res.data
          : res.data?.clientes || [];
        setClientes(dataArray);
      } catch (err) {
        console.error('Error buscando clientes en caja:', err);
        setClientes([]);
      } finally {
        setClientesLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [clientSearch]);

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Sistema de Caja</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert
          variant="success"
          onClose={() => setSuccessMsg(null)}
          dismissible
        >
          {successMsg}
        </Alert>
      )}

      {!caja ? (
        <>
          <InputGroup className="mb-2">
            <InputGroup.Text>$</InputGroup.Text>
            <Form.Control
              type="number"
              placeholder="Monto de apertura"
              value={montoApertura}
              onChange={(e) => setMontoApertura(e.target.value)}
            />
          </InputGroup>
          <Button onClick={handleAbrirCaja} disabled={!canOpenCaja()}>Abrir Caja</Button>
        </>
      ) : (
        <>
          <h5 className="mt-3">
            Caja Abierta el {new Date(caja.fecha_apertura).toLocaleString()}{" "}
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
                  <Form.Select
                    value={tipoMovimiento}
                    onChange={(e) => setTipoMovimiento(e.target.value)}
                  >
                    <option value="cobro_cliente">Cobro Cliente</option>
                    <option value="compra_proveedor">Compra Proveedor</option>
                    <option value="ajuste_positivo">Ajuste Positivo</option>
                    <option value="ajuste_negativo">Ajuste Negativo</option>
                    <option value="retiro">Retiro</option>
                  </Form.Select>
                </Form.Group>
              </Col>

              {tipoMovimiento === "cobro_cliente" && (
                <Col md={4}>
                  <Form.Group className="mb-2">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Escriba al menos 3 letras para buscar..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      size="sm"
                    />
                    <div className="mt-2">
                      {clientesLoading && (
                        <div className="text-muted">Buscando clientes... <Spinner animation="border" size="sm" /></div>
                      )}
                      {!clientesLoading && clientes.length === 0 && (
                        <div className="text-muted">Escriba 3 caracteres para buscar clientes.</div>
                      )}
                    </div>

                    <Form.Select
                      value={clienteSeleccionado}
                      onChange={(e) => setClienteSeleccionado(e.target.value)}
                      className="mt-2"
                      disabled={clientes.length === 0}
                    >
                      <option value="">-- Seleccione Cliente --</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre + " " + cliente.apellido}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              )}

              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Monto</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      placeholder="Monto"
                      value={montoMovimiento}
                      onChange={(e) => setMontoMovimiento(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group className="mb-2">
                  <Form.Label>Método de Pago</Form.Label>
                  <Form.Select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta_debito">Tarjeta Débito</option>
                    <option value="tarjeta_credito">Tarjeta Crédito</option>
                  </Form.Select>
                </Form.Group>
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
              <Button onClick={handleRegistrarMovimiento} disabled={!canRegisterMovimiento()}>
                Registrar Movimiento
              </Button>
              <Button
                variant="danger"
                className="ms-2"
                onClick={() => setShowModalCerrar(true)}
              >
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
                        m.tipo_movimiento.includes("ajuste")
                          ? "warning"
                          : m.tipo_movimiento === "cobro_cliente"
                          ? "success"
                          : "danger"
                      }
                    >
                      {m.tipo_movimiento}
                    </Badge>
                  </td>
                  <td
                    style={{
                      color:
                        parseFloat(m.monto_con_signo) < 0 ? "red" : "green",
                    }}
                  >
                    {formatCurrency(m.monto_con_signo)}
                  </td>
                  <td>{m.descripcion}</td>
                  <td>{m.metodo_pago || "-"}</td>
                  <td>{m.usuario || "-"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </>
      )}

      {/* Botón para mostrar/ocultar historial alineado a la derecha */}
      <div className="d-flex justify-content-end mb-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMostrarHistorial(!mostrarHistorial)}
        >
          {mostrarHistorial ? "Ocultar Historial" : "Mostrar Historial"}
        </Button>
      </div>

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
                    <td colSpan="7" className="text-center">
                      No hay cajas en el historial.
                    </td>
                  </tr>
                )}
                {historialCajas.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr>
                      <td>{new Date(c.fecha_apertura).toLocaleString()}</td>
                      <td>
                        {c.fecha_cierre
                          ? new Date(c.fecha_cierre).toLocaleString()
                          : "-"}
                      </td>
                      <td>{formatCurrency(c.monto_apertura)}</td>
                      <td>
                        {c.monto_cierre
                          ? formatCurrency(c.monto_cierre)
                          : "-"}
                      </td>
                      <td>{c.usuario_apertura}</td>
                      <td>{c.usuario_cierre || "-"}</td>
                      <td>
                        <Button
                          size="sm"
                          onClick={() => toggleMovimientosCaja(c.id)}
                        >
                          {movimientosPorCaja[c.id]
                            ? "Ocultar Movimientos"
                            : "Ver Movimientos"}
                        </Button>
                      </td>
                    </tr>
                    {movimientosPorCaja[c.id] && (
                      <tr>
                        <td colSpan={7}>
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
                                  <td>
                                    {new Date(
                                      mov.fecha_movimiento
                                    ).toLocaleString()}
                                  </td>
                                  <td>{mov.tipo_movimiento}</td>
                                  <td
                                    style={{
                                      color:
                                        parseFloat(mov.monto_con_signo) < 0
                                          ? "red"
                                          : "green",
                                    }}
                                  >
                                    {formatCurrency(mov.monto_con_signo)}
                                  </td>
                                  <td>{mov.descripcion}</td>
                                  <td>
                                    {mov.cliente_nombre && mov.cliente_apellido
                                      ? `${mov.cliente_nombre} ${mov.cliente_apellido}`
                                      : "-"}
                                  </td>
                                  <td>{mov.metodo_pago || "-"}</td>
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
          <div className="d-flex justify-content-center mt-3">
            {renderPaginacionHistorial()}
          </div>
        </>
      )}

      {/* Modal elegante de cierre */}
      <Modal show={showModalCerrar} onHide={() => setShowModalCerrar(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cerrar Caja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Label>Monto de Cierre</Form.Label>
            <InputGroup>
              <InputGroup.Text>$</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder="Ingrese el monto de cierre"
                value={montoCierre}
                onChange={(e) => setMontoCierre(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModalCerrar(false)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleCerrarCaja} disabled={!montoCierre || isNaN(montoCierre)}>
            Confirmar Cierre
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer position="top-end" className="p-3">
        <Toast bg="success" show={!!successMsg} onClose={() => setSuccessMsg(null)} delay={4000} autohide>
          <Toast.Header>
            <strong className="me-auto">Éxito</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{successMsg}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  );
};

export default CajaDashboard;
