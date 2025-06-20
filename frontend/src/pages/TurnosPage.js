import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer, Row, Col, Form } from 'react-bootstrap';
import TurnoList from '../components/turnos/TurnoList';
import TurnoForm from '../components/turnos/TurnoForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchTurnos, deleteTurno as apiDeleteTurno } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons'; // Eliminado FunnelFill

const TurnosPage = () => {
    const [turnos, setTurnos] = useState([]);
    const [filteredTurnos, setFilteredTurnos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [turnoToEdit, setTurnoToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [turnoToDeleteId, setTurnoToDeleteId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });
    const [filtroEstado, setFiltroEstado] = useState(''); // '', 'Pendiente', 'Realizado', 'Cancelado'

    const cargarTurnos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchTurnos();
            // Ordenar por fecha_hora descendente (más recientes primero)
            const sortedTurnos = response.data.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
            setTurnos(sortedTurnos);
        } catch (err) {
            console.error("Error al cargar turnos:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar turnos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarTurnos();
    }, [cargarTurnos]);

    useEffect(() => {
        // Aplicar filtro cuando cambian los turnos o el filtroEstado
        if (filtroEstado === '') {
            setFilteredTurnos(turnos);
        } else {
            setFilteredTurnos(turnos.filter(t => t.estado === filtroEstado));
        }
    }, [turnos, filtroEstado]);


    const handleShowFormToAdd = () => {
        setTurnoToEdit(null);
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (turno) => {
        setTurnoToEdit(turno);
        setShowFormModal(true);
    };

    const handleFormSuccess = (turnoGuardado) => {
        setShowFormModal(false);
        cargarTurnos();
        setToastInfo({
            show: true,
            message: turnoToEdit ? `Turno actualizado con éxito.` : `Turno agendado con éxito.`,
            variant: 'success'
        });
        setTurnoToEdit(null);
    };

    const handleOpenConfirmDelete = (id) => {
        setTurnoToDeleteId(id);
        setShowConfirmDeleteModal(true);
    };

    const handleDeleteTurno = async () => {
        if (!turnoToDeleteId) return;
        try {
            await apiDeleteTurno(turnoToDeleteId);
            setShowConfirmDeleteModal(false);
            setTurnoToDeleteId(null);
            cargarTurnos();
            setToastInfo({ show: true, message: 'Turno eliminado con éxito.', variant: 'success' });
        } catch (err) {
            console.error("Error al eliminar turno:", err);
            setError(err.response?.data?.message || err.message || 'Error al eliminar el turno.');
            setShowConfirmDeleteModal(false);
            setToastInfo({ show: true, message: `Error al eliminar turno: ${err.response?.data?.message || err.message}`, variant: 'danger' });
        }
    };

    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <Row className="mb-4 align-items-center">
                    <Col md={8}><h1>Gestión de Turnos</h1></Col>
                    <Col md={4} className="d-flex justify-content-end">
                        <Button variant="primary" onClick={handleShowFormToAdd}>
                            <PlusCircleFill className="me-2" /> Agendar Turno
                        </Button>
                    </Col>
                </Row>

                <Card className="shadow-sm">
                    <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                        Listado de Turnos
                        <div style={{width: '200px'}}>
                            <Form.Group controlId="filtroEstadoTurno">
                                <Form.Select
                                    aria-label="Filtrar por estado"
                                    value={filtroEstado}
                                    onChange={(e) => setFiltroEstado(e.target.value)}
                                    size="sm"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="Pendiente">Pendientes</option>
                                    <option value="Realizado">Realizados</option>
                                    <option value="Cancelado">Cancelados</option>
                                </Form.Select>
                            </Form.Group>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <TurnoList
                            turnos={filteredTurnos}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            loading={loading}
                            error={error && filteredTurnos.length === 0 ? error : null}
                        />
                    </Card.Body>
                </Card>

                <Modal show={showFormModal} onHide={() => { setShowFormModal(false); setTurnoToEdit(null); setError('');}} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{turnoToEdit ? 'Editar' : 'Agendar'} Turno</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <TurnoForm
                            turnoToEdit={turnoToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={() => { setShowFormModal(false); setTurnoToEdit(null); setError('');}}
                        />
                    </Modal.Body>
                </Modal>

                <ConfirmModal
                    show={showConfirmDeleteModal}
                    onHide={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteTurno}
                    title="Confirmar Eliminación"
                    message="¿Estás seguro de que deseas eliminar este turno?"
                />

                <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
                    <Toast
                        onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
                        show={toastInfo.show}
                        delay={5000}
                        autohide
                        bg={toastInfo.variant}
                        className="text-white"
                    >
                         <Toast.Header closeButton={true} className={`bg-${toastInfo.variant} text-white`}>
                            <strong className="me-auto">Notificación</strong>
                        </Toast.Header>
                        <Toast.Body>{toastInfo.message}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </Container>
        </MainLayout>
    );
};

export default TurnosPage;
