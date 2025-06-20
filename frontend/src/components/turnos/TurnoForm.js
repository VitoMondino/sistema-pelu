import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { createTurno, updateTurno, fetchClientes, fetchServicios } from '../../api';
import { esHorarioLaborable, DURACION_SLOT_MINUTOS } from '../../utils/horariosConfig'; // Importar validadores
    const [formData, setFormData] = useState({
        cliente_id: '',
        servicio_id: '',
        fecha_hora: '', // Se espera YYYY-MM-DDTHH:mm
        estado: 'Pendiente'
    });
    const [clientes, setClientes] = useState([]);
    const [servicios, setServicios] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingDependencies, setLoadingDependencies] = useState(true);

    useEffect(() => {
        const cargarDependencias = async () => {
            setLoadingDependencies(true);
            try {
                const [clientesRes, serviciosRes] = await Promise.all([
                    fetchClientes(),
                    fetchServicios()
                ]);
                setClientes(clientesRes.data);
                setServicios(serviciosRes.data);
            } catch (err) {
                console.error("Error al cargar clientes o servicios:", err);
                setError("No se pudieron cargar los clientes o servicios necesarios para el formulario.");
            } finally {
                setLoadingDependencies(false);
            }
        };
        cargarDependencias();
    }, []);

    useEffect(() => {
        if (turnoToEdit) {
            // Formatear fecha_hora para datetime-local input: YYYY-MM-DDTHH:mm
            let formattedFechaHora = '';
            if (turnoToEdit.fecha_hora) {
                const d = new Date(turnoToEdit.fecha_hora);
                // Ajustar por la zona horaria local para que se muestre correctamente en el input
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                formattedFechaHora = d.toISOString().slice(0, 16);
            }
            setFormData({
                cliente_id: turnoToEdit.cliente_id || '',
                servicio_id: turnoToEdit.servicio_id || '',
                fecha_hora: formattedFechaHora,
                estado: turnoToEdit.estado || 'Pendiente'
            });
        } else {
            setFormData({ cliente_id: '', servicio_id: '', fecha_hora: '', estado: 'Pendiente' });
        }
    }, [turnoToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!formData.cliente_id || !formData.servicio_id || !formData.fecha_hora || !formData.estado) {
            setError('Todos los campos son requeridos.');
            setLoading(false);
            return;
        }

        const fechaSeleccionada = new Date(formData.fecha_hora);

        if (!esHorarioLaborable(fechaSeleccionada)) {
            setError(`Horario no válido. Laborables: Lu-Vi de 10:00 a 23:00 (slots cada ${DURACION_SLOT_MINUTOS} min), Sáb de 08:00 a 15:00 (slots cada ${DURACION_SLOT_MINUTOS} min). Domingos cerrado.`);
            setLoading(false);
            return;
        }

        const fechaHoraISO = fechaSeleccionada.toISOString();

        try {
            const dataToSend = {
                ...formData,
                fecha_hora: fechaHoraISO
            };

            let response;
            if (turnoToEdit && turnoToEdit.id) {
                response = await updateTurno(turnoToEdit.id, dataToSend);
            } else {
                response = await createTurno(dataToSend);
            }

            setLoading(false);
            if (response.data) {
                onFormSubmit(response.data);
            }
        } catch (err) {
            setLoading(false);
            console.error("Error al guardar turno:", err.response || err.message);
            setError(err.response?.data?.message || `Error al guardar el turno. ${err.message}`);
        }
    };

    if (loadingDependencies) {
        return <p>Cargando datos necesarios para el formulario...</p>;
    }

    return (
        <Form onSubmit={handleSubmit}>
            {error && <Alert variant="danger">{error}</Alert>}
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formClienteId">
                        <Form.Label>Cliente <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="cliente_id" value={formData.cliente_id} onChange={handleChange} required>
                            <option value="">Seleccione un cliente</option>
                            {clientes.map(c => (
                                <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formServicioId">
                        <Form.Label>Servicio <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="servicio_id" value={formData.servicio_id} onChange={handleChange} required>
                            <option value="">Seleccione un servicio</option>
                            {servicios.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre_servicio} (${s.precio})</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formFechaHora">
                        <Form.Label>Fecha y Hora <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                            type="datetime-local"
                            name="fecha_hora"
                            value={formData.fecha_hora}
                            onChange={handleChange}
                            required
                            step={DURACION_SLOT_MINUTOS * 60} // Para que el input de tiempo salte en bloques de 30 min
                        />
                        <Form.Text className="text-muted">
                            Lu-Vi: 10:00-23:00, Sáb: 08:00-15:00. Slots cada {DURACION_SLOT_MINUTOS} min.
                        </Form.Text>
                    </Form.Group>
                </Col>
                <Col md={6}>
                    <Form.Group className="mb-3" controlId="formEstado">
                        <Form.Label>Estado <span className="text-danger">*</span></Form.Label>
                        <Form.Select name="estado" value={formData.estado} onChange={handleChange} required>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Realizado">Realizado</option>
                            <option value="Cancelado">Cancelado</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <div className="d-flex justify-content-end">
                {onCancel && (
                     <Button variant="secondary" onClick={onCancel} className="me-2" disabled={loading || loadingDependencies}>
                        Cancelar
                    </Button>
                )}
                <Button variant="primary" type="submit" disabled={loading || loadingDependencies}>
                    {loading ? (
                        <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-1" /> {turnoToEdit ? 'Actualizando...' : 'Agendando...'}</>
                    ) : (
                        turnoToEdit ? 'Actualizar Turno' : 'Agendar Turno'
                    )}
                </Button>
            </div>
        </Form>
    );
};

export default TurnoForm;
