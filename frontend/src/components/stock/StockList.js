import React from 'react';
import { Table, Button, Alert, Badge } from 'react-bootstrap';
import { PencilSquare, TrashFill, BoxSeamFill, CashCoin, GraphUp } from 'react-bootstrap-icons';

const StockList = ({ stockItems, onEdit, onDelete, loading, error }) => {
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

    const getStockBadge = (cantidad) => {
        if (cantidad <= 0) return <Badge bg="danger">Agotado</Badge>;
        if (cantidad < 5) return <Badge bg="warning" text="dark">Bajo Stock</Badge>; // Ejemplo: bajo stock si es menor a 5
        return <Badge bg="success">{cantidad}</Badge>;
    };

    return (
        <Table striped bordered hover responsive className="mt-3 align-middle">
            <thead className="table-dark">
                <tr>
                    <th><BoxSeamFill className="me-1" /> Producto</th>
                    <th>Cantidad</th>
                    <th><CashCoin className="me-1" /> Precio Costo</th>
                    <th><GraphUp className="me-1" /> Precio Venta</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {stockItems.map((item) => (
                    <tr key={item.id}>
                        <td>{item.nombre_producto}</td>
                        <td>{getStockBadge(item.cantidad)}</td>
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
    );
};

export default StockList;
