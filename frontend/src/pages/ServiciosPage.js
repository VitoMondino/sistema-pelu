import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/MainLayout';
import {
  Container,
  Card,
  Button,
  Modal,
  Alert,
  Toast,
  ToastContainer,
} from 'react-bootstrap';
import ServicioList from '../components/servicios/ServicioList';
import ServicioForm from '../components/servicios/ServicioForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchServicios, deleteServicio as apiDeleteServicio } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons';

const ServiciosPage = () => {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [servicioToEdit, setServicioToEdit] = useState(null);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [servicioToDeleteId, setServicioToDeleteId] = useState(null);
  const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

  const cargarServicios = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchServicios();
      setServicios(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar servicios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarServicios();
  }, [cargarServicios]);

  const handleShowFormToAdd = () => {
    setServicioToEdit(null);
    setShowFormModal(true);
  };
  const handleShowFormToEdit = (servicio) => {
    setServicioToEdit(servicio);
    setShowFormModal(true);
  };
  const handleFormSuccess = (servicioGuardado) => {
    setShowFormModal(false);
    cargarServicios();
    setToastInfo({
      show: true,
      message: servicioToEdit
        ? `Servicio "${servicioGuardado.nombre_servicio}" actualizado correctamente.`
        : `Servicio "${servicioGuardado.nombre_servicio}" creado correctamente.`,
      variant: 'success',
    });
    setServicioToEdit(null);
  };
  const handleOpenConfirmDelete = (id) => {
    setServicioToDeleteId(id);
    setShowConfirmDeleteModal(true);
  };
  const handleDeleteServicio = async () => {
    if (!servicioToDeleteId) return;
    try {
      await apiDeleteServicio(servicioToDeleteId);
      setShowConfirmDeleteModal(false);
      setServicioToDeleteId(null);
      cargarServicios();
      setToastInfo({ show: true, message: 'Servicio eliminado con éxito.', variant: 'success' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al eliminar el servicio.');
      setShowConfirmDeleteModal(false);
      setToastInfo({ show: true, message: 'Error al eliminar el servicio.', variant: 'danger' });
    }
  };

  // 🎨 Estilos
  const styles = {
    container: {
      padding: '2rem',
      backgroundColor: '#f7f7f7',
      minHeight: '100vh',
    },
    headerRow: {
      borderBottom: '2px solid #ddd',
      paddingBottom: '1rem',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: {
      fontWeight: '600',
      color: '#333',
      letterSpacing: '0.5px',
    },
    card: {
      borderRadius: '1rem',
      border: 'none',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    },
    cardHeader: {
      backgroundColor: 'transparent',
      borderBottom: '1px solid #eee',
      padding: '1rem',
      fontWeight: 500,
      color: '#555',
    },
    addButton: {
      borderRadius: '2rem',
      padding: '0.5rem 1.2rem',
      boxShadow: '0 4px 8px rgba(0,0,0,0.08)',
    },
  };

  return (
    <MainLayout>
      <Container fluid style={styles.container}>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
            {error}
          </Alert>
        )}

        <div style={styles.headerRow}>
          <h1 style={styles.title}>Gestión de Servicios</h1>
          <Button variant="primary" onClick={handleShowFormToAdd} style={styles.addButton}>
            <PlusCircleFill className="me-2" /> Agregar Servicio
          </Button>
        </div>

        <Card style={styles.card}>
          <Card.Header style={styles.cardHeader}>Listado de Servicios</Card.Header>
          <Card.Body>
            <ServicioList
              servicios={servicios}
              onEdit={handleShowFormToEdit}
              onDelete={handleOpenConfirmDelete}
              loading={loading}
              error={error && servicios.length === 0 ? error : null}
            />
          </Card.Body>
        </Card>

        {/* Modal de Formulario */}
        <Modal
          show={showFormModal}
          onHide={() => {
            setShowFormModal(false);
            setServicioToEdit(null);
            setError('');
          }}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>{servicioToEdit ? 'Editar Servicio' : 'Agregar Servicio'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ServicioForm
              servicioToEdit={servicioToEdit}
              onFormSubmit={handleFormSuccess}
              onCancel={() => {
                setShowFormModal(false);
                setServicioToEdit(null);
                setError('');
              }}
            />
          </Modal.Body>
        </Modal>

        {/* Modal de Confirmación */}
        <ConfirmModal
          show={showConfirmDeleteModal}
          onHide={() => setShowConfirmDeleteModal(false)}
          onConfirm={handleDeleteServicio}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que deseas eliminar este servicio? Si el servicio tiene turnos asociados, no se podrá eliminar hasta que sean cancelados o reasignados."
        />

        {/* Toast de Notificación */}
        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
          <Toast
            onClose={() => setToastInfo((prev) => ({ ...prev, show: false }))}
            show={toastInfo.show}
            delay={5000}
            autohide
            bg={toastInfo.variant}
            className="text-white shadow"
          >
            <Toast.Header closeButton={true} className={`bg-${toastInfo.variant} text-white border-0`}>
              <strong className="me-auto">Notificación</strong>
            </Toast.Header>
            <Toast.Body>{toastInfo.message}</Toast.Body>
          </Toast>
        </ToastContainer>
      </Container>
    </MainLayout>
  );
};

export default ServiciosPage;
