import React, { memo } from 'react';
import { Table, Button, Alert, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { PencilSquare, TrashFill, EyeFill } from 'react-bootstrap-icons';

const ClienteList = memo(({ clientes, onEdit, onDelete, onViewDetails, loading, error }) => {
  if (loading) {
    return (
      <div className="d-flex justify-content-center my-4">
        <Spinner animation="border" variant="primary" role="status">
          <span className="visually-hidden">Cargando clientes...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return <Alert variant="danger" className="my-4">Error al cargar clientes: {error}</Alert>;
  }

  if (!clientes || clientes.length === 0) {
    return <Alert variant="info" className="my-4">No hay clientes para mostrar. ¡Intenta agregar uno!</Alert>;
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderTooltip = (text) => (
    <Tooltip id={`tooltip-${text}`}>{text}</Tooltip>
  );

  return (
    <Table striped bordered hover responsive className="mt-3 shadow-sm align-middle">
      <thead className="table-dark text-center text-uppercase small">
        <tr>
          <th>Nro Cliente</th>
          <th>Nombre</th>
          <th>Apellido</th>
          <th>Teléfono</th>
          <th>Cumpleaños</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {clientes.map((cliente, index) => (
          <tr key={cliente.id} className="text-center">
            <td>{index + 1}</td>
            <td>{cliente.nombre}</td>
            <td>{cliente.apellido}</td>
            <td>{cliente.telefono}</td>
            <td>{formatDate(cliente.fecha_cumpleanos)}</td>
            <td className="text-nowrap">
              <OverlayTrigger placement="top" overlay={renderTooltip('Ver Detalles')}>
                <Button
                  variant="outline-info"
                  size="sm"
                  className="me-2"
                  onClick={() => onViewDetails(cliente.id)}
                >
                  <EyeFill />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={renderTooltip('Editar')}>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => onEdit(cliente)}
                >
                  <PencilSquare />
                </Button>
              </OverlayTrigger>
              <OverlayTrigger placement="top" overlay={renderTooltip('Eliminar')}>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onDelete(cliente.id)}
                >
                  <TrashFill />
                </Button>
              </OverlayTrigger>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
});

export default ClienteList;
