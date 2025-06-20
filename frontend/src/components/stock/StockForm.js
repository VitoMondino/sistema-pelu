import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap'; // Importar Spinner
import { createStockItem, updateStockItem } from '../../api';

const StockForm = ({ itemToEdit, onFormSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre_producto: '',
        cantidad: '',
        precio_unitario: '',
        precio_venta: '',
        stock_minimo: '' // Nuevo campo
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (itemToEdit) {
            setFormData({
                nombre_producto: itemToEdit.nombre_producto || '',
                cantidad: itemToEdit.cantidad || '',
                precio_unitario: itemToEdit.precio_unitario || '',
                precio_venta: itemToEdit.precio_venta || '',
                stock_minimo: itemToEdit.stock_minimo || '0' // Nuevo campo, default 0 si no existe
            });
        } else {
            setFormData({ nombre_producto: '', cantidad: '', precio_unitario: '', precio_venta: '', stock_minimo: '0' }); // Default 0
        }
    }, [itemToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.nombre_producto || formData.cantidad === '' || formData.precio_unitario === '' || formData.precio_venta === '' || formData.stock_minimo === '') {
            setError('Todos los campos son requeridos.');
            setLoading(false);
            return;
        }
        if (isNaN(parseInt(formData.cantidad)) || parseInt(formData.cantidad) < 0) {
            setError('La cantidad debe ser un número entero no negativo.');
            setLoading(false);
            return;
        }
        if (isNaN(parseFloat(formData.precio_unitario)) || parseFloat(formData.precio_unitario) < 0) {
            setError('El precio unitario debe ser un número positivo.');
            setLoading(false);
            return;
        }
        if (isNaN(parseFloat(formData.precio_venta)) || parseFloat(formData.precio_venta) < 0) {
            setError('El precio de venta debe ser un número positivo.');
            setLoading(false);
            return;
        }
        if (parseFloat(formData.precio_venta) < parseFloat(formData.precio_unitario)) {
            setError('El precio de venta no puede ser menor al precio unitario.');
            setLoading(false);
            return;
        }
        if (isNaN(parseInt(formData.stock_minimo)) || parseInt(formData.stock_minimo) < 0) {
            setError('El stock mínimo debe ser un número entero no negativo.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                cantidad: parseInt(formData.cantidad),
                precio_unitario: parseFloat(formData.precio_unitario),
                precio_venta: parseFloat(formData.precio_venta),
                stock_minimo: parseInt(formData.stock_minimo) // Nuevo campo
            };

            let response;
            if (itemToEdit && itemToEdit.id) {
                response = await updateStockItem(itemToEdit.id, dataToSend);
            } else {
                response = await createStockItem(dataToSend);
            }

            setLoading(false);
            if (response.data) {
                onFormSubmit(response.data);
            }
        } catch (err) {
            setLoading(false);
            console.error("Error al guardar producto en stock:", err.response || err.message);
            setError(err.response?.data?.message || `Error al guardar el producto. ${err.message}`);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Form.Group className="mb-3" controlId="formNombreProducto">
                <Form.Label>Nombre del Producto <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    type="text"
                    name="nombre_producto"
                    value={formData.nombre_producto}
                    onChange={handleChange}
                    required
                    placeholder="Ej: Shampoo Anticaída"
                />
            </Form.Group>
            <Row>
                <Col md={4}>
                    <Form.Group className="mb-3" controlId="formCantidad">
                        <Form.Label>Cantidad <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="number"
                            name="cantidad"
                            value={formData.cantidad}
                            onChange={handleChange}
                            required
                            min="0"
                            step="1"
                            placeholder="Ej: 10"
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3" controlId="formPrecioUnitario">
                        <Form.Label>Precio Unitario (Costo) <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="number"
                            name="precio_unitario"
                            value={formData.precio_unitario}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="Ej: 1200.50"
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group className="mb-3" controlId="formPrecioVenta">
                        <Form.Label>Precio de Venta <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="number"
                            name="precio_venta"
                            value={formData.precio_venta}
                            onChange={handleChange}
                            required
                            min="0"
                            step="0.01"
                            placeholder="Ej: 1800.00"
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Form.Group className="mb-3" controlId="formStockMinimo">
                <Form.Label>Stock Mínimo <span className="text-danger">*</span></Form.Label>
                <Form.Control
                    type="number"
                    name="stock_minimo"
                    value={formData.stock_minimo}
                    onChange={handleChange}
                    required
                    min="0"
                    step="1"
                    placeholder="Ej: 5"
                />
            </Form.Group>

            <div className="d-flex justify-content-end">
                {onCancel && (
                     <Button variant="secondary" onClick={onCancel} className="me-2" disabled={loading}>
                        Cancelar
                    </Button>
                )}
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (
                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> {itemToEdit ? 'Actualizando...' : 'Agregando...'}</>
                    ) : (
                        itemToEdit ? 'Actualizar Producto' : 'Agregar Producto'
                    )}
                </Button>
            </div>
        </Form>
    );
};

export default StockForm;
