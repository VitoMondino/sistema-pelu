// ...existing code...
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { 
  Container, Card, Form, Row, Col, Button, Table, 
  Badge, Alert, Spinner 
} from 'react-bootstrap';
import { fetchStock, fetchStockMovimientos } from '../api';
// ...existing code...

const StockMovimientosPage = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filtros
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [productoId, setProductoId] = useState('');
  const [tipoMovimiento, setTipoMovimiento] = useState('');

  const cargarMovimientos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        ...(fechaDesde && { fecha_desde: fechaDesde }),
        ...(fechaHasta && { fecha_hasta: fechaHasta }),
        ...(productoId && { producto_id: productoId }),
        ...(tipoMovimiento && { tipo_movimiento: tipoMovimiento })
      };

      const response = await fetchStockMovimientos(params);
      // Normalizar respuesta: aceptar tanto { data: [...] } como [...]
      const data = response?.data?.data ?? response?.data ?? [];
      setMovimientos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar movimientos');
      setMovimientos([]);
    } finally {
      setLoading(false);
    }
  }, [fechaDesde, fechaHasta, productoId, tipoMovimiento]);

  const cargarProductos = async () => {
    try {
      const response = await fetchStock();
      const data = response?.data?.data ?? response?.data ?? [];
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
      setProductos([]);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarMovimientos();
  }, [cargarMovimientos]);

  const getTipoMovimientoBadge = (tipo) => {
    const badges = {
      'entrada_manual': 'success',
      'salida_manual': 'danger',
      'ajuste_positivo': 'info',
      'ajuste_negativo': 'warning',
      'venta': 'primary',
      'compra_proveedor': 'secondary'
    };
    return <Badge bg={badges[tipo] || 'secondary'}>{tipo}</Badge>;
  };

  const limpiarFiltros = () => {
    setFechaDesde('');
    setFechaHasta('');
    setProductoId('');
    setTipoMovimiento('');
  };

  return (
    <MainLayout>
      <Container fluid>
        <h1 className="mb-4">Historial de Movimientos de Stock</h1>

        <Card className="mb-4">
          <Card.Body>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Desde</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Fecha Hasta</Form.Label>
                  <Form.Control
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Producto</Form.Label>
                  <Form.Select
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                  >
                    <option value="">Todos los productos</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre_producto}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Movimiento</Form.Label>
                  <Form.Select
                    value={tipoMovimiento}
                    onChange={(e) => setTipoMovimiento(e.target.value)}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="entrada_manual">Entrada Manual</option>
                    <option value="salida_manual">Salida Manual</option>
                    <option value="ajuste_positivo">Ajuste Positivo</option>
                    <option value="ajuste_negativo">Ajuste Negativo</option>
                    <option value="venta">Venta</option>
                    <option value="compra_proveedor">Compra Proveedor</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button onClick={cargarMovimientos}>Buscar</Button>
              <Button variant="secondary" onClick={limpiarFiltros}>
                Limpiar Filtros
              </Button>
            </div>
          </Card.Body>
        </Card>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Body>
            {loading ? (
              <div className="text-center p-3">
                <Spinner animation="border" />
              </div>
            ) : (
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Producto</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Stock Anterior</th>
                    <th>Stock Nuevo</th>
                    <th>Motivo</th>
                    <th>Precio Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {(movimientos || []).length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center">No hay movimientos para mostrar.</td>
                    </tr>
                  ) : (
                    movimientos.map(mov => (
                      <tr key={mov.id}>
                        <td>{mov.fecha_movimiento ? new Date(mov.fecha_movimiento).toLocaleString() : '-'}</td>
                        <td>{mov.nombre_producto || '-'}</td>
                        <td>{getTipoMovimientoBadge(mov.tipo_movimiento)}</td>
                        <td className={mov.cantidad_movida < 0 ? 'text-danger' : 'text-success'}>
                          {mov.cantidad_movida ?? '-'}
                        </td>
                        <td>{mov.cantidad_anterior ?? '-'}</td>
                        <td>{mov.cantidad_nueva ?? '-'}</td>
                        <td>{mov.motivo || '-'}</td>
                        <td>{mov.precio_unitario_movimiento ? `$${mov.precio_unitario_movimiento}` : '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </MainLayout>
  );
};

export default StockMovimientosPage;