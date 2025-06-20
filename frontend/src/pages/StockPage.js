import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer } from 'react-bootstrap';
import StockList from '../components/stock/StockList';
import StockForm from '../components/stock/StockForm';
import ConfirmModal from '../components/ConfirmModal';
import AjusteStockModal from '../components/stock/AjusteStockModal'; // Nuevo Modal
import { fetchStock, deleteStockItem as apiDeleteStockItem, updateStockItem } from '../api'; // updateStockItem para ajuste rápido
import { PlusCircleFill, Sliders } from 'react-bootstrap-icons'; // Cambiados iconos

const StockPage = () => {
    const [stockItems, setStockItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

    // Estado para el modal de ajuste manual detallado
    const [showAjusteManualModal, setShowAjusteManualModal] = useState(false);
    const [itemParaAjusteManual, setItemParaAjusteManual] = useState(null);


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

    const handleAdjustQuantity = async (itemId, amount) => {
        try {
            await updateStockItem(itemId, { ajuste_cantidad: amount });
            cargarStock();
            setToastInfo({ show: true, message: `Stock ajustado para el producto ID: ${itemId}.`, variant: 'success' });
        } catch (err) {
            console.error("Error al ajustar cantidad:", err);
            setToastInfo({ show: true, message: `Error al ajustar stock: ${err.response?.data?.message || err.message}`, variant: 'danger' });
        }
    };

    const handleShowAjusteManualModal = (item = null) => { // Permite abrirlo sin item específico para un futuro
        setItemParaAjusteManual(item); // Si es null, el modal pedirá seleccionar producto
        setShowAjusteManualModal(true);
    };

    // Podríamos modificar StockList para que tenga un botón "Ajuste Manual" por fila
    // o tener un botón general en la página que abra AjusteStockModal
    // y dentro del modal se seleccione el producto si no viene pre-seleccionado.
    // Por ahora, lo dejaremos como un botón general en la página.

    const handleAjusteManualExitoso = (message) => {
        setShowAjusteManualModal(false);
        cargarStock();
        setToastInfo({ show: true, message: message || 'Ajuste de stock manual realizado con éxito.', variant: 'success' });
        setItemParaAjusteManual(null);
    };


    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && !showAjusteManualModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1>Gestión de Stock</h1>
                    <div>
                        <Button variant="outline-secondary" onClick={() => handleShowAjusteManualModal()} className="me-2">
                            <Sliders className="me-2" /> Registrar Movimiento Manual
                        </Button>
                        <Button variant="primary" onClick={handleShowFormToAdd}>
                            <PlusCircleFill className="me-2" /> Agregar Producto
                        </Button>
                    </div>
                </div>

                <Card className="shadow-sm">
                    <Card.Header as="h5">Listado de Productos en Stock</Card.Header>
                    <Card.Body>
                        <StockList
                            stockItems={stockItems}
                            onEdit={handleShowFormToEdit}
                            onDelete={handleOpenConfirmDelete}
                            onAdjustQuantity={handleAdjustQuantity} // Pasar la función de ajuste
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

                {/* Modal para Ajuste Manual Detallado de Stock */}
                <AjusteStockModal
                    show={showAjusteManualModal}
                    onHide={() => { setShowAjusteManualModal(false); setItemParaAjusteManual(null);}}
                    producto={itemParaAjusteManual} // Puede ser null si no se selecciona uno específico de la lista
                                                    // En ese caso, el modal debería permitir seleccionar un producto.
                                                    // Por ahora, asumimos que si se abre es porque se seleccionó un producto (o se adaptará el modal).
                                                    // Para un botón general, el modal necesitaría un selector de productos.
                                                    // Vamos a asumir que este modal se invoca sin producto y el selector está DENTRO del modal.
                                                    // O, para simplificar ahora, que SIEMPRE se llama desde un producto (ej. un botón nuevo en la lista)
                                                    // Por ahora, el botón general no pasará producto, el modal debe manejarlo.
                    onAjusteExitoso={handleAjusteManualExitoso}
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
