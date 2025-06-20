import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer } from 'react-bootstrap';
import StockList from '../components/stock/StockList';
import StockForm from '../components/stock/StockForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchStock, deleteStockItem as apiDeleteStockItem } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons';

const StockPage = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

    const cargarStock = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchStock();
            setStockItems(response.data);
        } catch (err) {
            console.error("Error al cargar stock:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar el stock.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarStock();
    }, [cargarStock]);

    const handleShowFormToAdd = () => {
        setItemToEdit(null);
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (item) => {
        setItemToEdit(item);
        setShowFormModal(true);
    };

    const handleFormSuccess = (itemGuardado) => {
        setShowFormModal(false);
        cargarStock();
        setToastInfo({
            show: true,
            message: itemToEdit ? `Producto "${itemGuardado.nombre_producto}" actualizado.` : `Producto "${itemGuardado.nombre_producto}" agregado al stock.`,
            variant: 'success'
        });
        setItemToEdit(null);
    };

    const handleOpenConfirmDelete = (id) => {
        setItemToDeleteId(id);
        setShowConfirmDeleteModal(true);
    };

    const handleDeleteStockItem = async () => {
        if (!itemToDeleteId) return;
        try {
            await apiDeleteStockItem(itemToDeleteId);
            setShowConfirmDeleteModal(false);
            setItemToDeleteId(null);
            cargarStock();
            setToastInfo({ show: true, message: 'Producto eliminado del stock con éxito.', variant: 'success' });
        } catch (err) {
            console.error("Error al eliminar producto del stock:", err);
            setError(err.response?.data?.message || err.message || 'Error al eliminar el producto.');
            setShowConfirmDeleteModal(false);
            setToastInfo({ show: true, message: `Error al eliminar producto: ${err.response?.data?.message || err.message}`, variant: 'danger' });
        }
    };

    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Stock</h1>
                    <Button variant="primary" onClick={handleShowFormToAdd}>
                        <PlusCircleFill className="me-2" /> Agregar Producto
                    </Button>
                </div>

                <Card className="shadow-sm">
                    <Card.Header as="h5">Listado de Productos en Stock</Card.Header>
                    <Card.Body>
                        <StockList
                            stockItems={stockItems}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            loading={loading}
                            error={error && stockItems.length === 0 ? error : null}
                        />
                    </Card.Body>
                </Card>

                <Modal show={showFormModal} onHide={() => { setShowFormModal(false); setItemToEdit(null); setError('');}} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{itemToEdit ? 'Editar' : 'Agregar'} Producto al Stock</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <StockForm
                            itemToEdit={itemToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={() => { setShowFormModal(false); setItemToEdit(null); setError('');}}
                        />
                    </Modal.Body>
                </Modal>

                <ConfirmModal
                    show={showConfirmDeleteModal}
                    onHide={() => setShowConfirmDeleteModal(false)}
                    onConfirm={handleDeleteStockItem}
                    title="Confirmar Eliminación"
                    message="¿Estás seguro de que deseas eliminar este producto del stock?"
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

export default StockPage;
