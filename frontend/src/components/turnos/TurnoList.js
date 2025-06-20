import React from 'react';
import { Table, Button, Alert, Badge } from 'react-bootstrap';
import { PencilSquare, TrashFill, CalendarEventFill, PersonFill, Scissors } from 'react-bootstrap-icons';

const TurnoList = ({ turnos, onEdit, onDelete, loading, error }) => {
    if (loading) {
        return (
            <div className="d-flex justify-content-center my-3">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando turnos...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return <Alert variant="danger">Error al cargar turnos: {error}</Alert>;
    }

    if (!turnos || turnos.length === 0) {
        return <Alert variant="info">No hay turnos para mostrar. ¡Intenta agendar uno!</Alert>;
    }

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        const date = new Date(dateTimeString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            // timeZone: 'America/Argentina/Buenos_Aires' // Opcional, si quieres forzar una zona horaria específica en la visualización
        });
    };

    const getEstadoBadge = (estado) => {
        switch (estado) {
            case 'Pendiente':
                return <Badge bg="warning" text="dark">Pendiente</Badge>;
            case 'Realizado':
                return <Badge bg="success">Realizado</Badge>;
            case 'Cancelado':
                return <Badge bg="danger">Cancelado</Badge>;
            default:
                return <Badge bg="secondary">{estado}</Badge>;
        }
    };


    return (
        <Table striped bordered hover responsive className="mt-3 align-middle">
            <thead className="table-dark">
                <tr>
                    <th><CalendarEventFill className="me-1" /> Fecha y Hora</th>
                    <th><PersonFill className="me-1" /> Cliente</th>
                    <th>Teléfono Cliente</th>
                    <th><Scissors className="me-1" /> Servicio</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
                {turnos.map((turno) => (
                    <tr key={turno.id}>
                        <td>{formatDateTime(turno.fecha_hora)}</td>
                        <td>{turno.cliente_nombre} {turno.cliente_apellido}</td>
                        <td>{turno.cliente_telefono || 'N/A'}</td>
                        <td>{turno.servicio_nombre}</td>
                        <td>{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(turno.servicio_precio)}</td>
                        <td>{getEstadoBadge(turno.estado)}</td>
                        <td>
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onEdit(turno)}
                                className="me-2 mb-1 mb-md-0"
                                title="Editar Turno"
                            >
                                <PencilSquare />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDelete(turno.id)}
                                title="Eliminar Turno"
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

export default TurnoList;
