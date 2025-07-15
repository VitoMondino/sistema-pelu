import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer, Form } from 'react-bootstrap';
import ClienteList from '../components/clientes/ClienteList';
import ClienteForm from '../components/clientes/ClienteForm';
import ConfirmModal from '../components/ConfirmModal';
import ClienteDetailModal from '../components/clientes/ClienteDetailModal';
import { fetchClientes, deleteCliente as apiDeleteCliente } from '../api';
import { PlusCircleFill, Search } from 'react-bootstrap-icons';

const ClientesPage = () => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [clienteToEdit, setClienteToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [clienteToDeleteId, setClienteToDeleteId] = useState(null);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [clienteToViewId, setClienteToViewId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

    // Filtrar clientes por nombre o apellido
    const clientesFiltrados = useMemo(() => {
        if (!searchTerm.trim()) {
            return clientes;
        }
        
        return clientes.filter(cliente => {
            const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
            const termino = searchTerm.toLowerCase();
            
            return nombreCompleto.includes(termino) || 
                   cliente.nombre.toLowerCase().includes(termino) ||
                   cliente.apellido.toLowerCase().includes(termino);
        });
    }, [clientes, searchTerm]);

    const cargarClientes = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchClientes();
            // ✅ CORREGIDO: acceder correctamente a los datos
            setClientes(response.data.data.clientes || []);
            // (opcional) console.log para depuración
            console.log("Clientes recibidos:", response.data.data.clientes);
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
        setError('');
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (cliente) => {
        const formatDateForEdit = (dateString) => {
            if (!dateString) return '';
            if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                return dateString;
            }
            if (typeof dateString === 'string' && dateString.includes('T')) {
                return dateString.split('T')[0];
            }
            return '';
        };

        const clienteParaEditar = {
            ...cliente,
            fecha_cumpleanos: formatDateForEdit(cliente.fecha_cumpleanos)
        };

        setClienteToEdit(clienteParaEditar);
        setError('');
        setShowFormModal(true);
    };

    const handleShowDetailModal = (id) => {
        setClienteToViewId(id);
        setShowDetailModal(true);
    };

    const handleEditFromDetail = (cliente) => {
        setShowDetailModal(false);
        handleShowFormToEdit(cliente);
    };

    const handleFormSuccess = (clienteGuardado) => {
        setShowFormModal(false);
        cargarClientes();
        setToastInfo({
            show: true,
            message: clienteToEdit 
                ? `Cliente "${clienteGuardado.nombre} ${clienteGuardado.apellido}" actualizado con éxito.` 
                : `Cliente "${clienteGuardado.nombre} ${clienteGuardado.apellido}" creado con éxito.`,
            variant: 'success'
        });
        setClienteToEdit(null);
        setError('');
    };

    const handleFormCancel = () => {
        setShowFormModal(false);
        setClienteToEdit(null);
        setError('');
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
            cargarClientes();
            setToastInfo({ 
                show: true, 
                message: 'Cliente eliminado con éxito.', 
                variant: 'success' 
            });
        } catch (err) {
            console.error("Error al eliminar cliente:", err);
            const errorMessage = err.response?.data?.message || err.message || 'Error al eliminar el cliente.';
            setError(errorMessage);
            setShowConfirmDeleteModal(false);
            setToastInfo({ 
                show: true, 
                message: `Error al eliminar cliente: ${errorMessage}`, 
                variant: 'danger' 
            });
        }
    };

    const handleCloseToast = () => {
        setToastInfo(prev => ({ ...prev, show: false }));
    };

    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && (
                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                    </Alert>
                )}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Clientes</h1>
                    <Button variant="primary" onClick={handleShowFormToAdd}>
                        <PlusCircleFill className="me-2" /> Agregar Cliente
                    </Button>
                </div>

                {/* Campo de búsqueda */}
                <div className="mb-3">
                    <div className="position-relative" style={{ maxWidth: '400px' }}>
                        <Form.Control
                            type="text"
                            placeholder="Buscar por nombre o apellido..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="ps-5"
                        />
                        <Search 
                            className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" 
                            size={16}
                        />
                    </div>
                    {searchTerm && (
                        <small className="text-muted">
                            Mostrando {clientesFiltrados.length} de {clientes.length} clientes
                        </small>
                    )}
                </div>

                <Card className="shadow-sm">
                    <Card.Header as="h5">Listado de Clientes</Card.Header>
                    <Card.Body>
                        <ClienteList
                            clientes={clientesFiltrados}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            onViewDetails={handleShowDetailModal}
                            loading={loading}
                            error={error && clientes.length === 0 ? error : null}
                        />
                    </Card.Body>
                </Card>

                {/* Modal para Formulario de Cliente (Crear/Editar) */}
                <Modal 
                    show={showFormModal} 
                    onHide={handleFormCancel} 
                    centered 
                    size="lg"
                    backdrop="static"
                >
                    <Modal.Header closeButton>
                        <Modal.Title>{clienteToEdit ? 'Editar' : 'Agregar'} Cliente</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ClienteForm
                            clienteToEdit={clienteToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </Modal.Body>
                </Modal>

                {/* Modal de confirmación para eliminar */}
                <ConfirmModal
                    show={showConfirmDeleteModal}
                    onHide={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteCliente}
                    title="Confirmar Eliminación"
                    message="¿Estás seguro de que deseas eliminar este cliente? Esta acción no se puede deshacer. Se eliminarán también los turnos asociados."
                    confirmButtonText="Eliminar"
                    confirmVariant="danger"
                />

                {/* Modal para Detalles de Cliente */}
                <ClienteDetailModal
                    show={showDetailModal}
                    onHide={() => setShowDetailModal(false)}
                    clienteId={clienteToViewId}
                    onEditCliente={handleEditFromDetail}
                />

                {/* Toast de notificaciones */}
                <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
                    <Toast
                        onClose={handleCloseToast}
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
