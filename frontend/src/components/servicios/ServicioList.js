import React, { memo } from 'react'; // Importar memo
import { Table, Button, Alert } from 'react-bootstrap';
import { PencilSquare, TrashFill } from 'react-bootstrap-icons';

const ServicioList = memo(({ servicios, onEdit, onDelete, loading, error }) => { // Envolver con memo
    if (loading) {
        return (
            <div className="d-flex justify-content-center my-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando servicios...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error al cargar servicios: {error}</Alert>;
    }

    if (!servicios || servicios.length === 0) {
        return <Alert variant="info">No hay servicios para mostrar. ¡Intenta agregar uno!</Alert>;
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
    };

    return (
        <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
                <tr>
                    <th>#</th>
                    <th>Nombre del Servicio</th>
                    <th>Precio</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {servicios.map((servicio, index) => (
                    <tr key={servicio.id}>
                        <td>{index + 1}</td>
                        <td>{servicio.nombre_servicio}</td>
                        <td>{formatPrice(servicio.precio)}</td>
                        <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onEdit(servicio)}
                                className="me-2"
                                title="Editar"
                            >
                                <PencilSquare />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(servicio.id)}
                                title="Eliminar"
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

export default ServicioList;
