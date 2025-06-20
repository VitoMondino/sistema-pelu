import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Row, Col, Spinner } from 'react-bootstrap'; // Importar Spinner
import { createMovimientoStock, fetchStock } from '../../api';

const AjusteStockModal = ({ show, onHide, producto: productoInicial, onAjusteExitoso }) => {
    const [selectedProductId, setSelectedProductId] = useState('');
    const [productosDisponibles, setProductosDisponibles] = useState([]);
    const [tipoMovimiento, setTipoMovimiento] = useState('entrada_manual');
    const [cantidadMovida, setCantidadMovida] = useState('');
    const [motivo, setMotivo] = useState('');
    const [precioUnitario, setPrecioUnitario] = useState(''); // Opcional, para compras
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingProductos, setLoadingProductos] = useState(false);

    // Cargar productos para el selector si no se pasa un productoInicial
    useEffect(() => {
        if (show && !productoInicial) {
            setLoadingProductos(true);
            fetchStock()
                .then(response => {
                    setProductosDisponibles(response.data);
                    if (response.data.length > 0) {
                       // setSelectedProductId(response.data[0].id); // Opcional: seleccionar el primero por defecto
                    }
                })
                .catch(err => {
                    console.error("Error al cargar productos para el modal:", err);
                    setError("No se pudieron cargar los productos.");
                })
                .finally(() => setLoadingProductos(false));
        }
        if (show && productoInicial) {
            setSelectedProductId(productoInicial.id);
        }

        // Resetear formulario al ocultar o cambiar producto inicial
        if (!show) {
            setTipoMovimiento('entrada_manual');
            setCantidadMovida('');
            setMotivo('');
            setPrecioUnitario('');
            setError('');
            setSelectedProductId(''); // Limpiar selección
        }
    }, [show, productoInicial]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const productoIdFinal = productoInicial ? productoInicial.id : selectedProductId;

        if (!productoIdFinal) {
            setError('Debe seleccionar un producto.');
            setLoading(false);
            return;
        }
        if (!tipoMovimiento || cantidadMovida === '' || isNaN(parseInt(cantidadMovida)) || parseInt(cantidadMovida) <= 0) {
            setError('Tipo de movimiento y cantidad (positiva) son requeridos.');
            setLoading(false);
            return;
        }

        const dataToSend = {
            producto_id: productoIdFinal,
            tipo_movimiento: tipoMovimiento,
            cantidad_movida: parseInt(cantidadMovida),
            motivo: motivo || null,
            precio_unitario_movimiento: precioUnitario ? parseFloat(precioUnitario) : null,
        };

        try {
            await createMovimientoStock(dataToSend);
            setLoading(false);
            const nombreProductoAfectado = productoInicial?.nombre_producto || productosDisponibles.find(p=>p.id === productoIdFinal)?.nombre_producto || 'Producto';
            onAjusteExitoso(`Ajuste de stock para "${nombreProductoAfectado}" realizado con éxito.`);
            onHide(); // Cerrar modal
        } catch (err) {
            setLoading(false);
            console.error("Error al registrar movimiento de stock:", err.response || err.message);
            setError(err.response?.data?.message || `Error al registrar el movimiento. ${err.message}`);
        }
    };

    const tiposDeMovimiento = [
        { value: 'entrada_manual', label: 'Entrada Manual (Ej: Devolución cliente, Encontrado)' },
        { value: 'salida_manual', label: 'Salida Manual (Ej: Rotura, Muestra)' },
        { value: 'ajuste_positivo', label: 'Ajuste Positivo (Inventario)' },
        { value: 'ajuste_negativo', label: 'Ajuste Negativo (Inventario)' },
        { value: 'compra_proveedor', label: 'Compra a Proveedor' },
        { value: 'uso_interno', label: 'Uso Interno (Salón)' },
        // 'venta' y 'venta_anulada' se manejarían desde la gestión de turnos/ventas.
        // 'devolucion_proveedor' podría ser otro tipo si se necesita.
    ];


    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Ajuste Manual de Stock</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                <Form onSubmit={handleSubmit}>
                    {!productoInicial && (
                        <Form.Group className="mb-3" controlId="formSelectProducto">
                            <Form.Label>Seleccionar Producto <span className="text-danger">*</span></Form.Label>
                            {loadingProductos ? <p>Cargando productos...</p> : (
                                <Form.Select
                                    name="selected_product_id"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                    required
                                >
                                    <option value="">-- Seleccione un producto --</option>
                                    {productosDisponibles.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre_producto} (Actual: {p.cantidad})</option>
                                    ))}
                                </Form.Select>
                            )}
                        </Form.Group>
                    )}
                    {productoInicial && (
                        <>
                            <p>Producto: <strong>{productoInicial?.nombre_producto}</strong></p>
                            <p>Cantidad actual: {productoInicial?.cantidad}</p>
                        </>
                    )}

                    <Form.Group className="mb-3" controlId="formTipoMovimiento">
                        <Form.Label>Tipo de Movimiento <span className="text-danger">*</span></Form.Label>
                        <Form.Select
                            name="tipo_movimiento"
                            value={tipoMovimiento}
                            onChange={(e) => setTipoMovimiento(e.target.value)}
                            required
                        >
                            {tiposDeMovimiento.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>

                    <Row>
                        <Col md={6}>
                            <Form.Group className="mb-3" controlId="formCantidadMovida">
                                <Form.Label>Cantidad a Mover <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    type="number"
                                    name="cantidad_movida"
                                    value={cantidadMovida}
                                    onChange={(e) => setCantidadMovida(e.target.value)}
                                    required
                                    min="1"
                                    placeholder="Cantidad (siempre positiva)"
                                />
                                <Form.Text>
                                    La cantidad siempre es positiva. El "Tipo de Movimiento" determina si suma o resta del stock.
                                </Form.Text>
                            </Form.Group>
                        </Col>
                         {(tipoMovimiento === 'compra_proveedor' || tipoMovimiento === 'entrada_manual') && (
                            <Col md={6}>
                                <Form.Group className="mb-3" controlId="formPrecioUnitarioMovimiento">
                                    <Form.Label>Precio Unitario (Costo)</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="precio_unitario_movimiento"
                                        value={precioUnitario}
                                        onChange={(e) => setPrecioUnitario(e.target.value)}
                                        min="0"
                                        step="0.01"
                                        placeholder="Opcional, para compras"
                                    />
                                </Form.Group>
                            </Col>
                        )}
                    </Row>

                    <Form.Group className="mb-3" controlId="formMotivo">
                        <Form.Label>Motivo</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={2}
                            name="motivo"
                            value={motivo}
                            onChange={(e) => setMotivo(e.target.value)}
                            placeholder="Opcional. Ej: Conteo de inventario, Producto dañado, etc."
                        />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                        <Button variant="secondary" onClick={onHide} className="me-2" disabled={loading || loadingProductos}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading || loadingProductos}>
                            {loading ? (
                                <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> Registrando...</>
                            ) : (
                                'Registrar Movimiento'
                            )}
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AjusteStockModal;
