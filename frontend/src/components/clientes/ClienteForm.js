import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { createCliente, updateCliente } from '../../api';

const ClienteForm = ({ clienteToEdit, onFormSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        telefono: '',
        fecha_cumpleanos: '',
        notas: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Función para formatear fecha evitando problemas de zona horaria
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        // Si la fecha ya está en formato YYYY-MM-DD, la devolvemos tal como está
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Si es una fecha ISO o con hora, extraemos solo la parte de la fecha
        if (typeof dateString === 'string' && dateString.includes('T')) {
            return dateString.split('T')[0];
        }
        
        // Si es un objeto Date o string de fecha, lo convertimos cuidadosamente
        try {
            const date = new Date(dateString);
            // Verificamos que la fecha sea válida
            if (isNaN(date.getTime())) {
                return '';
            }
            
            // Usamos los métodos locales para evitar problemas de zona horaria
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        } catch (e) {
            console.error('Error al formatear fecha:', e);
            return '';
        }
    };

    useEffect(() => {
        if (clienteToEdit) {
            setFormData({
                nombre: clienteToEdit.nombre || '',
                apellido: clienteToEdit.apellido || '',
                telefono: clienteToEdit.telefono || '',
                fecha_cumpleanos: formatDateForInput(clienteToEdit.fecha_cumpleanos),
                notas: clienteToEdit.notas || ''
            });
        } else {
            // Reset form if no client is being edited
            setFormData({ 
                nombre: '', 
                apellido: '', 
                telefono: '', 
                fecha_cumpleanos: '', 
                notas: '' 
            });
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

        // Validación simple de teléfono
        if (!/^\d{7,15}$/.test(formData.telefono.replace(/\s+/g, ''))) {
            setError('El teléfono debe contener solo números y tener entre 7 y 15 dígitos.');
            setLoading(false);
            return;
        }

        try {
            let response;
            const dataToSend = { ...formData };
            
            // Si fecha_cumpleanos está vacío, lo enviamos como null
            if (!dataToSend.fecha_cumpleanos || dataToSend.fecha_cumpleanos.trim() === '') {
                dataToSend.fecha_cumpleanos = null;
            }

            if (clienteToEdit && clienteToEdit.id) {
                response = await updateCliente(clienteToEdit.id, dataToSend);
            } else {
                response = await createCliente(dataToSend);
            }

            setLoading(false);
            if (response.data) {
                onFormSubmit(response.data);
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
                            type="tel"
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
            <Form.Group className="mb-3" controlId="formNotas">
                <Form.Label>Notas Adicionales</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Alergias, preferencias, historial relevante, etc."
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
                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> {clienteToEdit ? 'Actualizando...' : 'Creando...'}</>
                    ) : (
                        clienteToEdit ? 'Actualizar Cliente' : 'Crear Cliente'
                    )}
                </Button>
            </div>
        </Form>
    );
};

export default ClienteForm;