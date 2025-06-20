import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer } from 'react-bootstrap';
import ClienteList from '../components/clientes/ClienteList';
import ClienteForm from '../components/clientes/ClienteForm';
import ConfirmModal from '../components/ConfirmModal';
import ClienteDetailModal from '../components/clientes/ClienteDetailModal'; // Nuevo Modal
import { fetchClientes, deleteCliente as apiDeleteCliente } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons';

const ClientesPage = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [clienteToDeleteId, setClienteToDeleteId] = useState(null);

    const [showDetailModal, setShowDetailModal] = useState(false); // Estado para modal de detalles
    const [clienteToViewId, setClienteToViewId] = useState(null); // ID del cliente para ver detalles

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

    const cargarClientes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchClientes();
            setClientes(response.data);
        } catch (err) {
            console.error("Error al cargar clientes:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar clientes.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    const handleShowFormToAdd = () => {
        setClienteToEdit(null);
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (cliente) => {
        setClienteToEdit(cliente);
        setShowFormModal(true);
    };

    const handleShowDetailModal = (id) => {
        setClienteToViewId(id);
        setShowDetailModal(true);
    };

    const handleEditFromDetail = (cliente) => {
        setShowDetailModal(false); // Cierra el modal de detalles
        handleShowFormToEdit(cliente); // Abre el modal de edición
    };

    const handleFormSuccess = (clienteGuardado) => {
        setShowFormModal(false);
        cargarClientes(); // Recargar la lista
        setToastInfo({
            show: true,
            message: clienteToEdit ? `Cliente "${clienteGuardado.nombre} ${clienteGuardado.apellido}" actualizado con éxito.` : `Cliente "${clienteGuardado.nombre} ${clienteGuardado.apellido}" creado con éxito.`,
            variant: 'success'
        });
        setClienteToEdit(null);
    };

    const handleOpenConfirmDelete = (id) => {
        setClienteToDeleteId(id);
        setShowConfirmDeleteModal(true);
    };

    const handleDeleteCliente = async () => {
        if (!clienteToDeleteId) return;
        try {
            await apiDeleteCliente(clienteToDeleteId);
            setShowConfirmDeleteModal(false);
            setClienteToDeleteId(null);
            cargarClientes(); // Recargar lista
            setToastInfo({ show: true, message: 'Cliente eliminado con éxito.', variant: 'success' });
        } catch (err) {
            console.error("Error al eliminar cliente:", err);
            setError(err.response?.data?.message || err.message || 'Error al eliminar el cliente.');
            setShowConfirmDeleteModal(false); // Cerrar modal incluso si hay error
            setToastInfo({ show: true, message: `Error al eliminar cliente: ${err.response?.data?.message || err.message}`, variant: 'danger' });
        }
    };


    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Clientes</h1>
                    <Button variant="primary" onClick={handleShowFormToAdd}>
                        <PlusCircleFill className="me-2" /> Agregar Cliente
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <Card.Header as="h5">Listado de Clientes</Card.Header>
                    <Card.Body>
                        <ClienteList
                            clientes={clientes}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            onViewDetails={handleShowDetailModal} // Pasar la nueva función
                            loading={loading}
                            error={error && clientes.length === 0 ? error : null} // Mostrar error en la lista solo si no hay clientes
                        />
                    </Card.Body>
                </Card>

                {/* Modal para Formulario de Cliente (Crear/Editar) */}
                <Modal show={showFormModal} onHide={() => { setShowFormModal(false); setClienteToEdit(null); setError(''); }} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{clienteToEdit ? 'Editar' : 'Agregar'} Cliente</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ClienteForm
                            clienteToEdit={clienteToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={() => { setShowFormModal(false); setClienteToEdit(null); setError(''); }}
                        />
                    </Modal.Body>
                </Modal>

                <ConfirmModal
                    show={showConfirmDeleteModal}
                    onHide={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteCliente}
                    title="Confirmar Eliminación"
                    message={`¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer. Se eliminarán también los turnos asociados.`}
                    confirmButtonText="Eliminar"
                    confirmVariant="danger"
                />

                {/* Modal para Detalles de Cliente */}
                <ClienteDetailModal
                    show={showDetailModal}
                    onHide={() => setShowDetailModal(false)}
                    clienteId={clienteToViewId}
                    onEditCliente={handleEditFromDetail} // Para poder editar desde el modal de detalles
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

export default ClientesPage;
