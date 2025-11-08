import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Modal, Alert } from 'react-bootstrap';
import { Plus } from 'react-bootstrap-icons';
import MainLayout from '../components/MainLayout';
import ProveedorList from '../components/proveedores/ProveedorList';
import ProveedorForm from '../components/proveedores/ProveedorForm';
import { 
  fetchProveedores, 
  deleteProveedor, 
  toggleProveedorActivo 
} from '../api';

const ProveedoresPage = () => {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [proveedorAEliminar, setProveedorAEliminar] = useState(null);

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchProveedores();
      console.log('Respuesta completa:', response); // Debug
      console.log('Response.data:', response.data); // Debug
      
      // Manejar diferentes estructuras de respuesta
      const data = response.data?.data || response.data || [];
      console.log('Datos finales:', data); // Debug
      
      setProveedores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setError('Error al cargar los proveedores. Por favor, intenta nuevamente.');
      setProveedores([]); // Asegurar que siempre sea un array
    } finally {
      setLoading(false);
    }
  };

  const handleNuevoProveedor = () => {
    setProveedorSeleccionado(null);
    setShowModal(true);
  };

  const handleEditarProveedor = (proveedor) => {
    setProveedorSeleccionado(proveedor);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setProveedorSeleccionado(null);
  };

  const handleSaveProveedor = async () => {
    await cargarProveedores();
    handleCloseModal();
  };

  const handleEliminarProveedor = (proveedor) => {
    setProveedorAEliminar(proveedor);
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!proveedorAEliminar) return;

    try {
      await deleteProveedor(proveedorAEliminar.id);
      setShowDeleteModal(false);
      setProveedorAEliminar(null);
      await cargarProveedores();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      alert('Error al eliminar el proveedor. Puede que tenga registros asociados.');
    }
  };

  const handleToggleActivo = async (id) => {
    try {
      await toggleProveedorActivo(id);
      await cargarProveedores();
    } catch (error) {
      console.error('Error al cambiar estado del proveedor:', error);
      alert('Error al cambiar el estado del proveedor');
    }
  };

  return (
    <MainLayout>
      <Container fluid className="py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Gestión de Proveedores</h2>
          <Button 
            variant="primary" 
            onClick={handleNuevoProveedor}
            className="d-flex align-items-center gap-2"
          >
            <Plus size={20} />
            Nuevo Proveedor
          </Button>
        </div>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <Card.Body>
            <ProveedorList
              proveedores={proveedores}
              onEdit={handleEditarProveedor}
              onDelete={handleEliminarProveedor}
              onToggleActivo={handleToggleActivo}
              loading={loading}
            />
          </Card.Body>
        </Card>

        {/* Modal para crear/editar proveedor */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              {proveedorSeleccionado ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ProveedorForm
              proveedor={proveedorSeleccionado}
              onClose={handleCloseModal}
              onSave={handleSaveProveedor}
            />
          </Modal.Body>
        </Modal>

        {/* Modal de confirmación para eliminar */}
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar Eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            ¿Estás seguro de que deseas eliminar al proveedor{' '}
            <strong>
              {proveedorAEliminar?.nombre} {proveedorAEliminar?.apellido}
            </strong>
            ?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminacion}>
              Eliminar
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </MainLayout>
  );
};

export default ProveedoresPage;