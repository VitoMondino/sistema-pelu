import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer } from 'react-bootstrap';
import ServicioList from '../components/servicios/ServicioList';
import ServicioForm from '../components/servicios/ServicioForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchServicios, deleteServicio as apiDeleteServicio } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons';

const ServiciosPage = () => {
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [servicioToEdit, setServicioToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [servicioToDeleteId, setServicioToDeleteId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

    const cargarServicios = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchServicios();
            setServicios(response.data);
        } catch (err) {
            console.error("Error al cargar servicios:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar servicios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarServicios();
    }, [cargarServicios]);

    const handleShowFormToAdd = () => {
        setServicioToEdit(null);
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (servicio) => {
        setServicioToEdit(servicio);
        setShowFormModal(true);
    };

    const handleFormSuccess = (servicioGuardado) => {
        setShowFormModal(false);
        cargarServicios();
        setToastInfo({
            show: true,
            message: servicioToEdit ? `Servicio "${servicioGuardado.nombre_servicio}" actualizado.` : `Servicio "${servicioGuardado.nombre_servicio}" creado.`,
            variant: 'success'
        });
        setServicioToEdit(null);
    };

    const handleOpenConfirmDelete = (id) => {
        setServicioToDeleteId(id);
        setShowConfirmDeleteModal(true);
    };

    const handleDeleteServicio = async () => {
        if (!servicioToDeleteId) return;
        try {
            await apiDeleteServicio(servicioToDeleteId);
            setShowConfirmDeleteModal(false);
            setServicioToDeleteId(null);
            cargarServicios();
            setToastInfo({ show: true, message: 'Servicio eliminado con éxito.', variant: 'success' });
        } catch (err) {
            console.error("Error al eliminar servicio:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar el servicio.';
            setError(errorMessage); // Muestra el error en un Alert en la página
            setShowConfirmDeleteModal(false);
            setToastInfo({ show: true, message: `Error: ${errorMessage}`, variant: 'danger' });
        }
    };

    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Servicios</h1>
                    <Button variant="primary" onClick={handleShowFormToAdd}>
                        <PlusCircleFill className="me-2" /> Agregar Servicio
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <Card.Header as="h5">Listado de Servicios</Card.Header>
                    <Card.Body>
                        <ServicioList
                            servicios={servicios}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            loading={loading}
                            error={error && servicios.length === 0 ? error : null}
                        />
                    </Card.Body>
                </Card>

                <Modal show={showFormModal} onHide={() => { setShowFormModal(false); setServicioToEdit(null); setError('');}} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>{servicioToEdit ? 'Editar' : 'Agregar'} Servicio</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ServicioForm
                            servicioToEdit={servicioToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={() => { setShowFormModal(false); setServicioToEdit(null); setError('');}}
                        />
                    </Modal.Body>
                </Modal>

                <ConfirmModal
                    show={showConfirmDeleteModal}
                    onHide={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteServicio}
                    title="Confirmar Eliminación"
                    message="¿Estás seguro de que deseas eliminar este servicio? Si el servicio tiene turnos asociados, no se podrá eliminar hasta que se cancelen o reasignen dichos turnos."
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

export default ServiciosPage;
