import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchClienteById, fetchHistorialServiciosByClienteId } from '../../api'; // Necesitas crear esta función en api.js

const ClienteDetailModal = ({ show, onHide, clienteId, onEditCliente }) => {
    const [cliente, setCliente] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loadingCliente, setLoadingCliente] = useState(false);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('detalles');

    useEffect(() => {
        if (show && clienteId) {
            const cargarDatosCliente = async () => {
                setLoadingCliente(true);
                setError('');
                try {
                    const responseCliente = await fetchClienteById(clienteId);
                    setCliente(responseCliente.data);
                    // Cargar historial solo después de cargar el cliente, o en paralelo si se prefiere
                    // cargarHistorial(clienteId); // Se llama al cambiar de tab o al inicio
                } catch (err) {
                    console.error("Error al cargar datos del cliente:", err);
                    setError(err.response?.data?.message || err.message || 'Error al cargar datos del cliente.');
                    setCliente(null); // Limpiar por si había datos previos
                } finally {
                    setLoadingCliente(false);
                }
            };
            cargarDatosCliente();
            // Resetear historial y tab al abrir
            setHistorial([]);
            setActiveTab('detalles');
        } else {
            // Limpiar datos cuando el modal se cierra o no hay clienteId
            setCliente(null);
            setHistorial([]);
            setError('');
        }
    }, [show, clienteId]);

    const cargarHistorial = async (id) => {
        if (!id) return;
        setLoadingHistorial(true);
        setError(''); // Limpiar error específico de historial
        try {
            const responseHistorial = await fetchHistorialServiciosByClienteId(id);
            setHistorial(responseHistorial.data);
        } catch (err) {
            console.error("Error al cargar historial de servicios:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar historial.');
        } finally {
            setLoadingHistorial(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'historial' && clienteId && cliente) { // Cargar historial solo si la tab está activa y hay cliente
            cargarHistorial(clienteId);
        }
    }, [activeTab, clienteId, cliente]);


    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'Pendiente': return <span className="badge bg-warning text-dark">{estado}</span>;
            case 'Realizado': return <span className="badge bg-success">{estado}</span>;
            case 'Cancelado': return <span className="badge bg-danger">{estado}</span>;
            default: return <span className="badge bg-secondary">{estado}</span>;
        }
    };


    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Header closeButton>
                <Modal.Title>
                    {loadingCliente ? 'Cargando...' : (cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Detalles del Cliente')}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {loadingCliente && !cliente && (
                    <div className="text-center"><Spinner animation="border" /> <p>Cargando detalles del cliente...</p></div>
                )}

                {cliente && (
                    <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} id="cliente-detail-tabs" className="mb-3">
                        <Tab eventKey="detalles" title="Detalles del Cliente">
                            <Card>
                                <Card.Body>
                                    <p><strong>Nombre Completo:</strong> {cliente.nombre} {cliente.apellido}</p>
                                    <p><strong>Teléfono:</strong> {cliente.telefono}</p>
                                    <p><strong>Fecha de Cumpleaños:</strong> {formatDate(cliente.fecha_cumpleanos) || 'No registrada'}</p>
                                    <p><strong>Notas:</strong></p>
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        backgroundColor: '#f8f9fa',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto'
                                    }}>
                                        {cliente.notas || 'Sin notas.'}
                                    </pre>
                                </Card.Body>
                            </Card>
                        </Tab>
                        <Tab eventKey="historial" title="Historial de Servicios">
                            {loadingHistorial && (
                                <div className="text-center"><Spinner animation="border" /> <p>Cargando historial...</p></div>
                            )}
                            {!loadingHistorial && historial.length === 0 && (
                                <Alert variant="info">Este cliente no tiene historial de servicios.</Alert>
                            )}
                            {!loadingHistorial && historial.length > 0 && (
                                <Table striped bordered hover responsive size="sm">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Fecha y Hora</th>
                                            <th>Servicio</th>
                                            <th>Precio</th>
                                            <th>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {historial.map(item => (
                                            <tr key={item.turno_id}>
                                                <td>{formatDateTime(item.fecha_hora)}</td>
                                                <td>{item.nombre_servicio}</td>
                                                <td>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.precio_servicio)}</td>
                                                <td>{getEstadoBadge(item.estado_turno)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Tab>
                    </Tabs>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Cerrar
                </Button>
                {cliente && onEditCliente && (
                    <Button variant="primary" onClick={() => onEditCliente(cliente)}>
                        Editar Cliente
                    </Button>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default ClienteDetailModal;
