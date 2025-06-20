import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { createCliente, updateCliente } from '../../api';

const ClienteForm = ({ clienteToEdit, onFormSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        fecha_cumpleanos: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (clienteToEdit) {
            setFormData({
                nombre: clienteToEdit.nombre || '',
                apellido: clienteToEdit.apellido || '',
                telefono: clienteToEdit.telefono || '',
                // Asegurarse que la fecha de cumpleaños esté en formato YYYY-MM-DD para el input date
                fecha_cumpleanos: clienteToEdit.fecha_cumpleanos ? clienteToEdit.fecha_cumpleanos.split('T')[0] : ''
            });
        } else {
            // Reset form if no client is being edited (e.g., for creating a new one)
            setFormData({ nombre: '', apellido: '', telefono: '', fecha_cumpleanos: '' });
        }
    }, [clienteToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.nombre || !formData.apellido || !formData.telefono) {
            setError('Nombre, apellido y teléfono son campos requeridos.');
            setLoading(false);
            return;
        }

        // Validación simple de teléfono (ej: solo números y longitud)
        if (!/^\d{7,15}$/.test(formData.telefono.replace(/\s+/g, ''))) {
            setError('El teléfono debe contener solo números y tener entre 7 y 15 dígitos.');
            setLoading(false);
            return;
        }

        try {
            let response;
            const dataToSend = { ...formData };
            // Si fecha_cumpleanos está vacío, no lo enviamos o lo enviamos como null
            if (!dataToSend.fecha_cumpleanos) {
                dataToSend.fecha_cumpleanos = null;
            }

            if (clienteToEdit && clienteToEdit.id) {
                response = await updateCliente(clienteToEdit.id, dataToSend);
            } else {
                response = await createCliente(dataToSend);
            }

            setLoading(false);
            if (response.data) {
                onFormSubmit(response.data); // Pasar el cliente creado/actualizado
            }
        } catch (err) {
            setLoading(false);
            console.error("Error al guardar cliente:", err.response || err.message);
            setError(err.response?.data?.message || `Error al guardar el cliente. ${err.message}`);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formNombre">
                        <Form.Label>Nombre <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                            placeholder="Nombre del cliente"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formApellido">
                        <Form.Label>Apellido <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="text"
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                            required
                            placeholder="Apellido del cliente"
                        />
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formTelefono">
                        <Form.Label>Teléfono <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="tel" // Usar type="tel" para mejor semántica y UX en móviles
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                            required
                            placeholder="Ej: 1122334455"
                        />
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formFechaCumpleanos">
                        <Form.Label>Fecha de Cumpleaños</Form.Label>
                        <Form.Control
                            type="date"
                            name="fecha_cumpleanos"
                            value={formData.fecha_cumpleanos}
                            onChange={handleChange}
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
                    {loading ? (clienteToEdit ? 'Actualizando...' : 'Creando...') : (clienteToEdit ? 'Actualizar Cliente' : 'Crear Cliente')}
                </Button>
            </div>
        </Form>
    );
};

export default ClienteForm;
