import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
//import './GlobalStyles.css';
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

    // Función para formatear fecha - SIMPLIFICADA para evitar conversiones
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        
        // Convertir a string si no lo es
        const dateStr = String(dateString);
        
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        
        // Si tiene la T de ISO, extraer solo la parte de la fecha
        if (dateStr.includes('T')) {
            return dateStr.split('T')[0];
        }
        
        // Si tiene espacio (datetime), extraer solo la parte de la fecha
        if (dateStr.includes(' ')) {
            return dateStr.split(' ')[0];
        }
        
        return '';
    };

    useEffect(() => {
        if (clienteToEdit) {
            const fechaParaInput = formatDateForInput(clienteToEdit.fecha_cumpleanos);
            
            console.log('=== DEBUG ClienteForm ===');
            console.log('Fecha recibida:', clienteToEdit.fecha_cumpleanos);
            console.log('Fecha para input:', fechaParaInput);
            
            setFormData({
                nombre: clienteToEdit.nombre || '',
                apellido: clienteToEdit.apellido || '',
                telefono: clienteToEdit.telefono || '',
                fecha_cumpleanos: fechaParaInput,
                notas: clienteToEdit.notas || ''
            });
        } else {
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

            console.log('=== DEBUG Submit ===');
            console.log('Fecha a enviar:', dataToSend.fecha_cumpleanos);

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