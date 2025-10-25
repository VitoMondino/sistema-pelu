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
  Row,
  Col,
  Form,
  Pagination,
} from 'react-bootstrap';
import TurnoList from '../components/turnos/TurnoList';
import TurnoForm from '../components/turnos/TurnoForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchTurnos, deleteTurno as apiDeleteTurno } from '../api';
import { PlusCircleFill } from 'react-bootstrap-icons';

const TurnosPage = () => {
  const [turnos, setTurnos] = useState([]);
  const [filteredTurnos, setFilteredTurnos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [turnoToEdit, setTurnoToEdit] = useState(null);

  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [turnoToDeleteId, setTurnoToDeleteId] = useState(null);

  const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroTiempo, setFiltroTiempo] = useState('');

  // 🔹 Estados para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // cantidad de turnos por página

  const cargarTurnos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchTurnos();
      const sortedTurnos = response.data.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      setTurnos(sortedTurnos);
    } catch (err) {
      console.error('Error al cargar turnos:', err);
      setError(err.response?.data?.message || err.message || 'Error al cargar turnos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarTurnos();
  }, [cargarTurnos]);

  useEffect(() => {
    let filtrados = [...turnos];

    if (filtroEstado) {
      filtrados = filtrados.filter((t) => t.estado === filtroEstado);
    }

    if (filtroTiempo) {
      const now = new Date();

      if (filtroTiempo === 'dia') {
        filtrados = filtrados.filter((t) => new Date(t.fecha_hora).toDateString() === now.toDateString());
      } else if (filtroTiempo === 'semana') {
        const dayOfWeek = now.getDay();
        const monday = new Date(now);
        monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        filtrados = filtrados.filter((t) => {
          const fecha = new Date(t.fecha_hora);
          return fecha >= monday && fecha <= sunday;
        });
      } else if (filtroTiempo === 'mes') {
        filtrados = filtrados.filter((t) => {
          const fecha = new Date(t.fecha_hora);
          return fecha.getMonth() === now.getMonth() && fecha.getFullYear() === now.getFullYear();
        });
      }
    }

    filtrados.sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
    setFilteredTurnos(filtrados);
    setCurrentPage(1); // reinicia a la primera página al cambiar filtros
  }, [turnos, filtroEstado, filtroTiempo]);

  // 🔹 Cálculo de paginación
  const totalPages = Math.ceil(filteredTurnos.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTurnos = filteredTurnos.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleShowFormToAdd = () => {
    setTurnoToEdit(null);
    setShowFormModal(true);
  };

  const handleShowFormToEdit = (turno) => {
    setTurnoToEdit(turno);
    setShowFormModal(true);
  };

  const handleFormSuccess = () => {
    setShowFormModal(false);
    cargarTurnos();
    setToastInfo({
      show: true,
      message: turnoToEdit ? 'Turno actualizado con éxito.' : 'Turno agendado con éxito.',
      variant: 'success',
    });
    setTurnoToEdit(null);
  };

  const handleOpenConfirmDelete = (id) => {
    setTurnoToDeleteId(id);
    setShowConfirmDeleteModal(true);
  };

  const handleDeleteTurno = async () => {
    if (!turnoToDeleteId) return;
    try {
      await apiDeleteTurno(turnoToDeleteId);
      setShowConfirmDeleteModal(false);
      setTurnoToDeleteId(null);
      cargarTurnos();
      setToastInfo({ show: true, message: 'Turno eliminado con éxito.', variant: 'success' });
    } catch (err) {
      console.error('Error al eliminar turno:', err);
      setError(err.response?.data?.message || err.message || 'Error al eliminar el turno.');
      setShowConfirmDeleteModal(false);
      setToastInfo({ show: true, message: `Error al eliminar turno: ${err.message}`, variant: 'danger' });
    }
  };

  return (
    <MainLayout>
      <Container fluid>
        {error && !showFormModal && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        <Row className="mb-4 align-items-center">
          <Col md={8}>
            <h1>Gestión de Turnos</h1>
          </Col>
          <Col md={4} className="d-flex justify-content-end">
            <Button variant="primary" onClick={handleShowFormToAdd}>
              <PlusCircleFill className="me-2" /> Agendar Turno
            </Button>
          </Col>
        </Row>

        <Card className="shadow-sm">
          <Card.Header as="h5" className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            Listado de Turnos
            <div className="d-flex gap-2" style={{ width: '420px' }}>
              <Form.Group controlId="filtroEstadoTurno" style={{ flex: 1 }}>
                <Form.Select
                  aria-label="Filtrar por estado"
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  size="sm"
                >
                  <option value="">Todos los estados</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Realizado">Realizados</option>
                  <option value="Cancelado">Cancelados</option>
                </Form.Select>
              </Form.Group>
              <Form.Group controlId="filtroTiempoTurno" style={{ flex: 1 }}>
                <Form.Select
                  aria-label="Filtrar por tiempo"
                  value={filtroTiempo}
                  onChange={(e) => setFiltroTiempo(e.target.value)}
                  size="sm"
                >
                  <option value="">Todos</option>
                  <option value="dia">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                </Form.Select>
              </Form.Group>
            </div>
          </Card.Header>
          <Card.Body>
            <TurnoList
              turnos={currentTurnos}
              onEdit={handleShowFormToEdit}
              onDelete={handleOpenConfirmDelete}
              loading={loading}
              error={error && filteredTurnos.length === 0 ? error : null}
            />

            {/* 🔹 Componente de paginación */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-3">
                <Pagination>
                  <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item
                      key={i + 1}
                      active={i + 1 === currentPage}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </Card.Body>
        </Card>

        <Modal
          show={showFormModal}
          onHide={() => {
            setShowFormModal(false);
            setTurnoToEdit(null);
            setError('');
          }}
          centered
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>{turnoToEdit ? 'Editar' : 'Agendar'} Turno</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <TurnoForm
              turnoToEdit={turnoToEdit}
              onFormSubmit={handleFormSuccess}
              onCancel={() => {
                setShowFormModal(false);
                setTurnoToEdit(null);
                setError('');
              }}
            />
          </Modal.Body>
        </Modal>

        <ConfirmModal
          show={showConfirmDeleteModal}
          onHide={() => setShowConfirmDeleteModal(false)}
          onConfirm={handleDeleteTurno}
          title="Confirmar Eliminación"
          message="¿Estás seguro de que deseas eliminar este turno?"
        />

        <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
          <Toast
            onClose={() => setToastInfo((prev) => ({ ...prev, show: false }))}
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

export default TurnosPage;
