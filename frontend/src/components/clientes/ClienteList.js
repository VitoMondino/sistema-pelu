import React, { memo } from 'react'; // Importar memo
import { Table, Button, Alert } from 'react-bootstrap';
import { PencilSquare, TrashFill, EyeFill } from 'react-bootstrap-icons';

const ClienteList = memo(({ clientes, onEdit, onDelete, onViewDetails, loading, error }) => { // Envolver con memo
    if (loading) {
        return (
            <div className="d-flex justify-content-center my-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando clientes...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error al cargar clientes: {error}</Alert>;
    }

    if (!clientes || clientes.length === 0) {
        return <Alert variant="info">No hay clientes para mostrar. ¡Intenta agregar uno!</Alert>;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        // Asegurarse de que la fecha se interpreta correctamente (puede ser UTC desde el backend)
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset); // Ajustar a UTC si es necesario
        return localDate.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };


    return (
        <Table striped bordered hover responsive className="mt-3">
            <thead className="table-dark">
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>Teléfono</th>
                    <th>Cumpleaños</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {clientes.map((cliente, index) => (
                    <tr key={cliente.id}>
                        <td>{index + 1}</td>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.apellido}</td>
                        <td>{cliente.telefono}</td>
                        <td>{formatDate(cliente.fecha_cumpleanos)}</td>
                        <td>
                            <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => onViewDetails(cliente.id)}
                                className="me-2"
                                title="Ver Detalles"
                            >
                                <EyeFill />
                            </Button>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onEdit(cliente)}
                                className="me-2"
                                title="Editar"
                            >
                                <PencilSquare />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(cliente.id)}
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

export default ClienteList;
