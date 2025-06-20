import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { createServicio, updateServicio } from '../../api';

const ServicioForm = ({ servicioToEdit, onFormSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre_servicio: '',
        precio: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (servicioToEdit) {
            setFormData({
                nombre_servicio: servicioToEdit.nombre_servicio || '',
                precio: servicioToEdit.precio || ''
            });
        } else {
            setFormData({ nombre_servicio: '', precio: '' });
        }
    }, [servicioToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.nombre_servicio || formData.precio === '') {
            setError('Nombre del servicio y precio son campos requeridos.');
            setLoading(false);
            return;
        }
        if (isNaN(parseFloat(formData.precio)) || parseFloat(formData.precio) < 0) {
            setError('El precio debe ser un número positivo.');
            setLoading(false);
            return;
        }

        try {
            const dataToSend = {
                ...formData,
                precio: parseFloat(formData.precio)
            };

            let response;
            if (servicioToEdit && servicioToEdit.id) {
                response = await updateServicio(servicioToEdit.id, dataToSend);
            } else {
                response = await createServicio(dataToSend);
            }

            setLoading(false);
            if (response.data) {
                onFormSubmit(response.data);
            }
        } catch (err) {
            setLoading(false);
            console.error("Error al guardar servicio:", err.response || err.message);
            setError(err.response?.data?.message || `Error al guardar el servicio. ${err.message}`);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
                <Col md={12}>
                    <Form.Group className="mb-3" controlId="formNombreServicio">
                        <Form.Label>Nombre del Servicio <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre_servicio"
                            value={formData.nombre_servicio}
                            onChange={handleChange}
                            required
                            placeholder="Ej: Corte de Dama"
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col md={12}>
                    <Form.Group className="mb-3" controlId="formPrecioServicio">
                        <Form.Label>Precio <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="number"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            required
                            placeholder="Ej: 2500.00"
                            min="0"
                            step="0.01"
                        />
                    </Form.Group>
                </Col>
            </Row>
            <div className="d-flex justify-content-end">
                {onCancel && (
                     <Button variant="secondary" onClick={onCancel} className="me-2" disabled={loading}>
                        Cancelar
                    </Button>
                )}
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? (servicioToEdit ? 'Actualizando...' : 'Creando...') : (servicioToEdit ? 'Actualizar Servicio' : 'Crear Servicio')}
                </Button>
            </div>
        </Form>
    );
};

export default ServicioForm;
