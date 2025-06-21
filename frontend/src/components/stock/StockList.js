import React, { useState, memo } from 'react'; // Importar memo
import { Table, Button, Alert, Badge, ButtonGroup, Form, InputGroup, Modal } from 'react-bootstrap';
import { PencilSquare, TrashFill, BoxSeamFill, CashCoin, GraphUp, PlusLg, DashLg } from 'react-bootstrap-icons';

const StockList = memo(({ stockItems, onEdit, onDelete, onAdjustQuantity, loading, error }) => { // Envolver con memo
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [currentItemForAdjust, setCurrentItemForAdjust] = useState(null);
    const [adjustAmount, setAdjustAmount] = useState(1);
    const [adjustAction, setAdjustAction] = useState('sumar'); // 'sumar' o 'restar'
    if (loading) {
        return (
            <div className="d-flex justify-content-center my-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando stock...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error al cargar stock: {error}</Alert>;
    }

    if (!stockItems || stockItems.length === 0) {
        return <Alert variant="info">No hay productos en stock. ¡Intenta agregar uno!</Alert>;
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
    };

    const getStockBadge = (cantidad, stockMinimo) => {
        if (cantidad <= 0) return <Badge bg="danger">Agotado</Badge>;
        if (stockMinimo > 0 && cantidad <= stockMinimo) return <Badge bg="warning" text="dark">Bajo Stock ({cantidad})</Badge>;
        return <Badge bg="success">{cantidad}</Badge>;
    };

    const handleOpenAdjustModal = (item, action) => {
        setCurrentItemForAdjust(item);
        setAdjustAction(action);
        setAdjustAmount(1); // Reset amount
        setShowAdjustModal(true);
    };

    const handleConfirmAdjust = () => {
        if (!currentItemForAdjust || isNaN(parseInt(adjustAmount)) || parseInt(adjustAmount) <= 0) {
            // Podríamos mostrar un error en el modal
            alert("Cantidad de ajuste inválida.");
            return;
        }
        const amountToAdjust = adjustAction === 'sumar' ? parseInt(adjustAmount) : -parseInt(adjustAmount);
        onAdjustQuantity(currentItemForAdjust.id, amountToAdjust);
        setShowAdjustModal(false);
        setCurrentItemForAdjust(null);
    };


    return (
        <>
            <Table striped bordered hover responsive className="mt-3 align-middle">
                <thead className="table-dark">
                    <tr>
                        <th><BoxSeamFill className="me-1" /> Producto</th>
                        <th style={{minWidth: '150px'}}>Cantidad</th>
                        <th><CashCoin className="me-1" /> Precio Costo</th>
                        <th><GraphUp className="me-1" /> Precio Venta</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {stockItems.map((item) => (
                        <tr key={item.id} className={(item.stock_minimo > 0 && item.cantidad <= item.stock_minimo && item.cantidad > 0) ? 'table-warning' : item.cantidad <= 0 ? 'table-danger' : ''}>
                            <td>{item.nombre_producto}</td>
                            <td>
                                <ButtonGroup size="sm" className="me-2">
                                    <Button variant="outline-secondary" onClick={() => handleOpenAdjustModal(item, 'restar')} title="Restar Stock">
                                        <DashLg />
                                    </Button>
                                    <Button variant="outline-secondary" disabled style={{ minWidth: '50px', color: 'black', opacity: 1 }}>
                                        {getStockBadge(item.cantidad, item.stock_minimo)}
                                    </Button>
                                    <Button variant="outline-secondary" onClick={() => handleOpenAdjustModal(item, 'sumar')} title="Sumar Stock">
                                        <PlusLg />
                                    </Button>
                                </ButtonGroup>
                            </td>
                            <td>{formatPrice(item.precio_unitario)}</td>
                            <td>{formatPrice(item.precio_venta)}</td>
                            <td>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => onEdit(item)}
                                    className="me-2"
                                    title="Editar Producto"
                                >
                                    <PencilSquare />
                                </Button>
                                <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => onDelete(item.id)}
                                    title="Eliminar Producto"
                                >
                                    <TrashFill />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal para Ajuste Rápido de Cantidad */}
            <Modal show={showAdjustModal} onHide={() => setShowAdjustModal(false)} centered size="sm">
                <Modal.Header closeButton>
                    <Modal.Title>{adjustAction === 'sumar' ? 'Sumar' : 'Restar'} Stock</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Producto: <strong>{currentItemForAdjust?.nombre_producto}</strong></p>
                    <p>Cantidad actual: {currentItemForAdjust?.cantidad}</p>
                    <Form.Group controlId="adjustAmount">
                        <Form.Label>Cantidad a {adjustAction === 'sumar' ? 'sumar' : 'restar'}:</Form.Label>
                        <Form.Control
                            type="number"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            min="1"
                            step="1"
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAdjustModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleConfirmAdjust}>
                        Confirmar {adjustAction === 'sumar' ? 'Suma' : 'Resta'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
});

export default StockList;
