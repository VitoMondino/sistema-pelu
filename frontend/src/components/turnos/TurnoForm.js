import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { createTurno, updateTurno, fetchClientes, fetchClienteById, fetchServicios } from '../../api';

const TurnoForm = ({ turnoToEdit, onFormSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    cliente_id: '',
    servicio_id: '',
    fecha_hora: '', // Formato para datetime-local: "YYYY-MM-DDTHH:mm"
    estado: 'Pendiente',
  });
  const [clientes, setClientes] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientesLoading, setClientesLoading] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDependencies, setLoadingDependencies] = useState(true);

  useEffect(() => {
    const cargarDependencias = async () => {
      setLoadingDependencies(true);
      try {
        const serviciosRes = await fetchServicios({ active: true });
        // Si estamos editando y el turno ya tiene cliente, traemos solo ese cliente para mostrar su nombre
        if (turnoToEdit && turnoToEdit.cliente_id) {
          try {
            const clienteRes = await fetchClienteById(turnoToEdit.cliente_id);
            // backend retorna el objeto cliente en data
            const clienteObj = clienteRes.data;
            if (clienteObj && clienteObj.id) {
              setClientes([clienteObj]);
            } else {
              setClientes([]);
            }
          } catch (err) {
            console.error('No se pudo cargar el cliente del turno:', err);
            setClientes([]);
          }
        } else {
          setClientes([]); // vaciar lista hasta que el usuario busque
        }
        setServicios(
          Array.isArray(serviciosRes.data) ? serviciosRes.data : (serviciosRes.data?.data || [])
        );
      } catch (err) {
        console.error('Error al cargar clientes o servicios:', err);
        setError(
          'No se pudieron cargar los clientes o servicios necesarios para el formulario.'
        );
      } finally {
        setLoadingDependencies(false);
      }
    };
    cargarDependencias();
  }, []);

  // Debounce búsqueda de clientes: solo buscar si hay al menos 3 caracteres
  useEffect(() => {
    const term = (clientSearch || '').trim();
    if (term.length < 3) {
      // si se está editando, mantener el cliente ya cargado; si no, limpiar
      if (!turnoToEdit) setClientes([]);
      setClientesLoading(false);
      return;
    }

    const handler = setTimeout(async () => {
      setClientesLoading(true);
      try {
        const res = await fetchClientes(term);
        // normalizar distintas formas de respuesta
        const dataArray = Array.isArray(res.data?.data?.clientes)
          ? res.data.data.clientes
          : Array.isArray(res.data)
          ? res.data
          : res.data?.clientes || [];
        setClientes(dataArray);
      } catch (err) {
        console.error('Error buscando clientes:', err);
        setClientes([]);
      } finally {
        setClientesLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [clientSearch, turnoToEdit]);

  useEffect(() => {
    if (turnoToEdit) {
      let formattedFechaHora = '';
      if (turnoToEdit.fecha_hora) {
        // Convertir fecha_hora (asumimos que viene en formato ISO o MySQL DATETIME) a formato para datetime-local
        const d = new Date(turnoToEdit.fecha_hora);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        formattedFechaHora = d.toISOString().slice(0, 16);
      }
      setFormData({
        cliente_id: turnoToEdit.cliente_id || '',
        servicio_id: turnoToEdit.servicio_id || '',
        fecha_hora: formattedFechaHora,
        estado: turnoToEdit.estado || 'Pendiente',
      });
    } else {
      setFormData({
        cliente_id: '',
        servicio_id: '',
        fecha_hora: '',
        estado: 'Pendiente',
      });
    }
  }, [turnoToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (
      !formData.cliente_id ||
      !formData.servicio_id ||
      !formData.fecha_hora ||
      !formData.estado
    ) {
      setError('Todos los campos son requeridos.');
      setLoading(false);
      return;
    }

    // Convertir "YYYY-MM-DDTHH:mm" a "YYYY-MM-DD HH:mm:ss" para enviar al backend
    const fechaHoraLocal = formData.fecha_hora.replace('T', ' ') + ':00';

    try {
      const dataToSend = {
        ...formData,
        fecha_hora: fechaHoraLocal,
      };

      let response;
      if (turnoToEdit && turnoToEdit.id) {
        response = await updateTurno(turnoToEdit.id, dataToSend);
      } else {
        response = await createTurno(dataToSend);
      }

      setLoading(false);
      if (response.data) {
        onFormSubmit(response.data);
      }
    } catch (err) {
      setLoading(false);
      console.error('Error al guardar turno:', err.response || err.message);
      setError(err.response?.data?.message || `Error al guardar el turno. ${err.message}`);
    }
  };

  if (loadingDependencies) {
    return <p>Cargando datos necesarios para el formulario...</p>;
  }

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formClienteId">
            <Form.Label>
              Cliente <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Escriba al menos 3 letras para buscar..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              size="sm"
            />
            <div className="mt-2">
              {clientesLoading && (
                <div className="text-muted">Buscando clientes... <Spinner animation="border" size="sm" /></div>
              )}
              {!clientesLoading && clientes.length === 0 && (
                <div className="text-muted">Escriba 3 caracteres para buscar clientes.</div>
              )}
            </div>

            <Form.Select
              name="cliente_id"
              value={formData.cliente_id}
              onChange={handleChange}
              required
              className="mt-2"
              disabled={clientes.length === 0}
              size="sm"
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formServicioId">
            <Form.Label>
              Servicio <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="servicio_id"
              value={formData.servicio_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un servicio</option>
              {servicios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre_servicio} (${s.precio})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formFechaHora">
            <Form.Label>
              Fecha y Hora <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="datetime-local"
              name="fecha_hora"
              value={formData.fecha_hora}
              onChange={handleChange}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3" controlId="formEstado">
            <Form.Label>
              Estado <span className="text-danger">*</span>
            </Form.Label>
            <Form.Select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              required
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Realizado">Realizado</option>
              <option value="Cancelado">Cancelado</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <div className="d-flex justify-content-end">
        {onCancel && (
          <Button
            variant="secondary"
            onClick={onCancel}
            className="me-2"
            disabled={loading || loadingDependencies}
          >
            Cancelar
          </Button>
        )}
        <Button
          variant="primary"
          type="submit"
          disabled={loading || loadingDependencies}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-1"
              />
              {turnoToEdit ? 'Actualizando...' : 'Agendando...'}
            </>
          ) : turnoToEdit ? (
            'Actualizar Turno'
          ) : (
            'Agendar Turno'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default TurnoForm;
