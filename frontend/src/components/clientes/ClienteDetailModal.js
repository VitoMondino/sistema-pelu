import React, { useState, useEffect } from 'react';
import { Modal, Button, Tabs, Tab, Table, Alert, Spinner, Card } from 'react-bootstrap';
import { fetchClienteById, fetchHistorialServiciosByClienteId } from '../../api';

const ClienteDetailModal = ({ show, onHide, clienteId, onEditCliente }) => {
    const [cliente, setCliente] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [loadingCliente, setLoadingCliente] = useState(false);
    const [loadingHistorial, setLoadingHistorial] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('detalles');

    // 🔹 Estados para filtro y paginación del historial
    const [filtroFecha, setFiltroFecha] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        if (show && clienteId) {
            const cargarDatosCliente = async () => {
                setLoadingCliente(true);
                setError('');
                try {
                    const responseCliente = await fetchClienteById(clienteId);
                    setCliente(responseCliente.data);
                } catch (err) {
                    console.error("Error al cargar datos del cliente:", err);
                    setError(err.response?.data?.message || err.message || 'Error al cargar datos del cliente.');
                    setCliente(null);
                } finally {
                    setLoadingCliente(false);
                }
            };
            cargarDatosCliente();
            setHistorial([]);
            setActiveTab('detalles');
            setCurrentPage(1);
            setFiltroFecha('');
        } else {
            setCliente(null);
            setHistorial([]);
            setError('');
        }
    }, [show, clienteId]);

    const cargarHistorial = async (id) => {
        if (!id) return;
        setLoadingHistorial(true);
        setError('');
        try {
            const responseHistorial = await fetchHistorialServiciosByClienteId(id);
            // Ordenar de más reciente a más antiguo
            const sorted = responseHistorial.data.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
            setHistorial(sorted);
            setCurrentPage(1);
        } catch (err) {
            console.error("Error al cargar historial de servicios:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar historial.');
        } finally {
            setLoadingHistorial(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'historial' && clienteId && cliente) {
            cargarHistorial(clienteId);
        }
    }, [activeTab, clienteId, cliente]);

    // 🔸 Funciones auxiliares
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

    // 🔹 Filtro y paginación aplicados al historial
    const filteredHistorial = filtroFecha
        ? historial.filter(item => {
            const fecha = new Date(item.fecha_hora).toISOString().split('T')[0];
            return fecha === filtroFecha;
        })
        : historial;

    const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentHistorial = filteredHistorial.slice(indexOfFirstItem, indexOfLastItem);

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
                        {/* 🧾 Detalles del cliente */}
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

                        {/* 📜 Historial con filtro y paginación */}
                        <Tab eventKey="historial" title="Historial de Servicios">
                            {loadingHistorial && (
                                <div className="text-center">
                                    <Spinner animation="border" /> <p>Cargando historial...</p>
                                </div>
                            )}

                            {!loadingHistorial && historial.length === 0 && (
                                <Alert variant="info">Este cliente no tiene historial de servicios.</Alert>
                            )}

                            {!loadingHistorial && historial.length > 0 && (
                                <>
                                    {/* 🔍 Filtro por fecha + botón limpiar */}
                                    <div className="d-flex justify-content-start align-items-center gap-2 mb-3">
                                        <label className="fw-bold mb-0">Filtrar por fecha:</label>
                                        <input
                                            type="date"
                                            value={filtroFecha}
                                            onChange={(e) => {
                                                setFiltroFecha(e.target.value);
                                                setCurrentPage(1);
                                            }}
                                            className="form-control w-auto"
                                        />
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => {
                                                setFiltroFecha('');
                                                setCurrentPage(1);
                                            }}
                                        >
                                            Limpiar filtro
                                        </Button>
                                    </div>

                                    {/* 🧮 Tabla con paginación */}
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
                                            {currentHistorial.map(item => (
                                                <tr key={item.turno_id}>
                                                    <td>{formatDateTime(item.fecha_hora)}</td>
                                                    <td>{item.nombre_servicio}</td>
                                                    <td>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(item.precio_servicio)}</td>
                                                    <td>{getEstadoBadge(item.estado_turno)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>

                                    {/* 🔢 Controles de paginación */}
                                    <div className="d-flex justify-content-center align-items-center mt-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => prev - 1)}
                                        >
                                            Anterior
                                        </Button>
                                        <span className="mx-3">
                                            Página {currentPage} de {totalPages || 1}
                                        </span>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={currentPage === totalPages || totalPages === 0}
                                            onClick={() => setCurrentPage(prev => prev + 1)}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </>
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
