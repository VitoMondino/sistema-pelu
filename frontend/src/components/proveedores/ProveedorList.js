import React from 'react';
import { Table, Badge, Button, Spinner } from 'react-bootstrap';
import { PencilSquare, Trash, ToggleOff, ToggleOn } from 'react-bootstrap-icons';

const ProveedorList = ({ proveedores, onEdit, onDelete, onToggleActivo, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando proveedores...</p>
      </div>
    );
  }

  if (!Array.isArray(proveedores)) {
    return (
      <div className="text-center py-5">
        <p className="text-danger">Error: Los datos no tienen el formato correcto</p>
      </div>
    );
  }

  if (proveedores.length === 0) {
    return (
      <div className="text-center py-5">
        <p className="text-muted">No hay proveedores registrados</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Ubicación</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {proveedores.map((proveedor) => (
            <tr key={proveedor.id}>
              <td>{proveedor.nombre}</td>
              <td>{proveedor.apellido}</td>
              <td>{proveedor.telefono}</td>
              <td>{proveedor.email || '-'}</td>
              <td>{proveedor.ubicacion || '-'}</td>
              <td>
                <Badge bg={proveedor.activo ? 'success' : 'secondary'}>
                  {proveedor.activo ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button
                    variant={proveedor.activo ? 'warning' : 'success'}
                    size="sm"
                    onClick={() => onToggleActivo(proveedor.id)}
                    title={proveedor.activo ? 'Desactivar' : 'Activar'}
                  >
                    {proveedor.activo ? <ToggleOff /> : <ToggleOn />}
                  </Button>
                  <Button
                    variant="info"
                    size="sm"
                    onClick={() => onEdit(proveedor)}
                    title="Editar"
                  >
                    <PencilSquare />
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onDelete(proveedor)}
                    title="Eliminar"
                  >
                    <Trash />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ProveedorList;
