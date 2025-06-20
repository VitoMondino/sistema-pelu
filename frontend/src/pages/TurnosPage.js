import React, { useState, useEffect, useCallback, useMemo } from 'react';
import MainLayout from '../components/MainLayout';
import { Container, Card, Button, Modal, Alert, Toast, ToastContainer, Row, Col, Form, Tabs, Tab } from 'react-bootstrap';
import TurnoList from '../components/turnos/TurnoList';
import TurnoForm from '../components/turnos/TurnoForm';
import ConfirmModal from '../components/ConfirmModal';
import { fetchTurnos, deleteTurno as apiDeleteTurno } from '../api';
import { PlusCircleFill, CalendarWeekFill, ListUl } from 'react-bootstrap-icons';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/es';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { esHorarioLaborable, getMinMaxTimeForCalendar, DURACION_SLOT_MINUTOS } from '../utils/horariosConfig'; // Importar configuración

// Configurar moment para español
moment.locale('es');
const localizer = momentLocalizer(moment);

const TurnosPage = () => {
    const [turnos, setTurnos] = useState([]);
    // filteredTurnos ya no será necesario si la lista se muestra separada o se filtra diferente
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showFormModal, setShowFormModal] = useState(false);
    const [turnoToEdit, setTurnoToEdit] = useState(null);

    const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
    const [turnoToDeleteId, setTurnoToDeleteId] = useState(null);

    const [toastInfo, setToastInfo] = useState({ show: false, message: '', variant: 'success' });
    const [filtroEstado, setFiltroEstado] = useState(''); // Para la vista de lista
    const [currentView, setCurrentView] = useState('calendario'); // 'calendario' o 'lista'
    const [selectedDate, setSelectedDate] = useState(new Date()); // Para controlar la fecha del calendario

    // Para el modal de confirmación de reprogramación
    const [showConfirmReprogramModal, setShowConfirmReprogramModal] = useState(false);
    const [reprogramData, setReprogramData] = useState(null); // { evento, nuevaFechaHora }


    const cargarTurnos = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetchTurnos();
            setTurnos(response.data); // No es necesario ordenar aquí si el calendario lo maneja o la lista se ordena después
        } catch (err) {
            console.error("Error al cargar turnos:", err);
            setError(err.response?.data?.message || err.message || 'Error al cargar turnos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarTurnos();
    }, [cargarTurnos]);

    // Transformar turnos para react-big-calendar
    const events = useMemo(() => turnos.map(turno => {
        const start = new Date(turno.fecha_hora);
        // Asumir una duración fija por ahora, por ejemplo, 30 minutos.
        // Esto se refinará en el paso de "Lógica de Bloqueo de Horarios".
        const end = moment(start).add(30, 'minutes').toDate();
        return {
            id: turno.id,
            title: `${turno.cliente_nombre} ${turno.cliente_apellido} - ${turno.servicio_nombre}`,
            start,
            end,
            allDay: false, // Los turnos no son de día completo
            resource: turno, // Guardar el objeto turno completo para acceso en onSelectEvent
            estado: turno.estado // Para estilizar el evento
        };
    }), [turnos]);

    // Filtrar turnos para la vista de lista
    const filteredTurnosParaLista = useMemo(() => {
        let turnosFiltrados = [...turnos];
        if (filtroEstado) {
            turnosFiltrados = turnosFiltrados.filter(t => t.estado === filtroEstado);
        }
        // Ordenar por fecha_hora descendente para la lista
        return turnosFiltrados.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
    }, [turnos, filtroEstado]);


    const handleShowFormToAdd = (slotInfo) => {
        setTurnoToEdit(null); // Asegurar que no haya datos de edición previos
        if (slotInfo && slotInfo.start) {
            if (!esHorarioLaborable(new Date(slotInfo.start))) {
                setToastInfo({
                    show: true,
                    message: 'El horario seleccionado no es laborable o no es un slot válido.',
                    variant: 'warning',
                });
                return;
            }
            const startDate = new Date(slotInfo.start);
            startDate.setMinutes(startDate.getMinutes() - startDate.getTimezoneOffset());
            const prefilledData = {
                fecha_hora: startDate.toISOString().slice(0, 16),
            };
            setTurnoToEdit({ ...prefilledData, isNewFromSlot: true });
        }
        // Si no viene slotInfo (botón "Agendar Turno"), se abre el form vacío
        setShowFormModal(true);
    };

    const handleShowFormToEdit = (turno) => { // turno puede ser un evento del calendario o un item de la lista
        let turnoData = turno;
        if (turno.resource) { // Si es un evento del calendario, el turno original está en 'resource'
            turnoData = turno.resource;
        }
        setTurnoToEdit(turnoData);
        setShowFormModal(true);
    };

    const handleEventDrop = ({ event, start, end }) => { // 'event' es el evento original de react-big-calendar
        const nuevaFechaHora = new Date(start);

        if (!esHorarioLaborable(nuevaFechaHora)) {
            setToastInfo({
                show: true,
                message: 'No se puede mover el turno a un horario no laborable o slot inválido.',
                variant: 'danger',
            });
            cargarTurnos(); // Forzar recarga para revertir el cambio visual si la librería no lo hace
            return;
        }

        // Guardar datos para la confirmación
        setReprogramData({ eventoOriginal: event.resource, nuevaFechaHoraISO: nuevaFechaHora.toISOString() });
        setShowConfirmReprogramModal(true);
    };

    const confirmReprogramacion = async () => {
        if (!reprogramData) return;
        const { eventoOriginal, nuevaFechaHoraISO } = reprogramData;

        const datosActualizados = {
            ...eventoOriginal, // Mantener cliente_id, servicio_id, estado (a menos que se quiera cambiar)
            fecha_hora: nuevaFechaHoraISO,
        };
        // Eliminar campos que no deben enviarse en el update si son parte del objeto 'eventoOriginal' y no de 'turno'
        // delete datosActualizados.cliente_nombre;
        // delete datosActualizados.cliente_apellido;
        // ... etc., o mejor, construir el payload explícitamente:
        const payload = {
            cliente_id: eventoOriginal.cliente_id,
            servicio_id: eventoOriginal.servicio_id,
            fecha_hora: nuevaFechaHoraISO,
            estado: eventoOriginal.estado, // Mantener estado actual al reprogramar
        };

        try {
            // Usar la función updateTurno importada correctamente
            await updateTurno(eventoOriginal.id, payload);
            setToastInfo({ show: true, message: 'Turno reprogramado con éxito.', variant: 'success' });
            cargarTurnos();
        } catch (err) {
            console.error("Error al reprogramar turno:", err);
            setToastInfo({ show: true, message: `Error al reprogramar turno: ${err.response?.data?.message || err.message}`, variant: 'danger' });
            cargarTurnos(); // Para asegurar que el calendario se revierta si falla
        } finally {
            setShowConfirmReprogramModal(false);
            setReprogramData(null);
        }
    };


    const handleFormSuccess = (turnoGuardado) => {
        setShowFormModal(false);
        cargarTurnos();
        setToastInfo({
            show: true,
            message: turnoToEdit ? `Turno actualizado con éxito.` : `Turno agendado con éxito.`,
            variant: 'success'
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
            console.error("Error al eliminar turno:", err);
            setError(err.response?.data?.message || err.message || 'Error al eliminar el turno.');
            setShowConfirmDeleteModal(false);
            setToastInfo({ show: true, message: `Error al eliminar turno: ${err.response?.data?.message || err.message}`, variant: 'danger' });
        }
    };

    return (
        <MainLayout>
            <Container fluid>
                {error && !showFormModal && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

                <Row className="mb-3 align-items-center">
                    <Col md={6}><h1>Gestión de Turnos</h1></Col>
                    <Col md={6} className="d-flex justify-content-end">
                        <Button variant="primary" onClick={() => handleShowFormToAdd()}>
                            <PlusCircleFill className="me-2" /> Agendar Turno
                        </Button>
                    </Col>
                </Row>

                <Tabs
                    id="turnos-view-tabs"
                    activeKey={currentView}
                    onSelect={(k) => setCurrentView(k)}
                    className="mb-3"
                >
                    <Tab eventKey="calendario" title={<><CalendarWeekFill className="me-1"/> Calendario</>}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <div style={{ height: '70vh' }}> {/* Altura para el calendario */}
                                    <Calendar
                                        localizer={localizer}
                                        events={events}
                                        startAccessor="start"
                                        endAccessor="end"
                                        style={{ height: '100%' }}
                                        messages={{
                                            next: "Sig.",
                                            previous: "Ant.",
                                            today: "Hoy",
                                            month: "Mes",
                                            week: "Semana",
                                            day: "Día",
                                            agenda: "Agenda",
                                            date: "Fecha",
                                            time: "Hora",
                                            event: "Turno",
                                            noEventsInRange: "No hay turnos en este rango.",
                                            showMore: total => `+ Ver más (${total})`
                                        }}
                                        selectable // Permite seleccionar slots
                                        onSelectSlot={handleShowFormToAdd}
                                        onSelectEvent={handleShowFormToEdit}
                                        onEventDrop={handleEventDrop} // Añadir manejador para drag and drop
                                        defaultView="week"
                                        views={['month', 'week', 'day', 'agenda']}
                                        step={DURACION_SLOT_MINUTOS}
                                        timeslots={60 / DURACION_SLOT_MINUTOS}
                                        date={selectedDate}
                                        onNavigate={date => setSelectedDate(date)}
                                        min={getMinMaxTimeForCalendar(selectedDate)?.min}
                                        max={getMinMaxTimeForCalendar(selectedDate)?.max}
                                        eventPropGetter={(event) => {
                                            const style = {
                                                backgroundColor: event.estado === 'Pendiente' ? '#ffc107' : event.estado === 'Realizado' ? '#198754' : event.estado === 'Cancelado' ? '#dc3545' : '#6c757d',
                                                color: event.estado === 'Pendiente' ? 'black' : 'white',
                                                borderRadius: '5px',
                                                border: 'none',
                                                display: 'block',
                                                cursor: 'pointer' // Cambiar cursor para eventos
                                            };
                                            return { style };
                                        }}
                                        slotPropGetter={(date) => {
                                            if (!esHorarioLaborable(date)) {
                                                return {
                                                    style: {
                                                        backgroundColor: '#f0f0f0',
                                                        cursor: 'not-allowed',
                                                    },
                                                };
                                            }
                                            return { style: { cursor: 'pointer' }}; // Cursor pointer para slots válidos
                                        }}
                                    />
                                </div>
                            </Card.Body>
                        </Card>
                    </Tab>
                    <Tab eventKey="lista" title={<><ListUl className="me-1"/> Lista de Turnos</>}>
                        <Card className="shadow-sm">
                            <Card.Header as="h5" className="d-flex justify-content-between align-items-center">
                                Listado de Turnos
                                <div style={{width: '200px'}}>
                                    <Form.Group controlId="filtroEstadoTurno">
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
                                </div>
                            </Card.Header>
                            <Card.Body>
                                <TurnoList
                                    turnos={filteredTurnosParaLista}
                                    onEdit={handleShowFormToEdit}
                                    onDelete={handleOpenConfirmDelete}
                                    loading={loading}
                                    error={error && filteredTurnosParaLista.length === 0 ? error : null}
                                />
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>

                {/* Modal para Formulario de Turno (Crear/Editar) */}
                <Modal show={showFormModal} onHide={() => { setShowFormModal(false); setTurnoToEdit(null); setError('');}} centered size="lg">
                    <Modal.Header closeButton>
                        <Modal.Title>{turnoToEdit ? 'Editar' : 'Agendar'} Turno</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <TurnoForm
                            turnoToEdit={turnoToEdit}
                            onFormSubmit={handleFormSuccess}
                            onCancel={() => { setShowFormModal(false); setTurnoToEdit(null); setError('');}}
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

                <ConfirmModal
                    show={showConfirmReprogramModal}
                    onHide={() => {setShowConfirmReprogramModal(false); setReprogramData(null); cargarTurnos(); /* Recargar para revertir visualmente si se cancela */}}
                    onConfirm={confirmReprogramacion}
                    title="Confirmar Reprogramación"
                    message={`¿Estás seguro de que deseas mover el turno de "${reprogramData?.eventoOriginal?.cliente_nombre} ${reprogramData?.eventoOriginal?.cliente_apellido}" (${reprogramData?.eventoOriginal?.servicio_nombre}) al ${reprogramData?.nuevaFechaHoraISO ? moment(reprogramData.nuevaFechaHoraISO).format('DD/MM/YYYY HH:mm') : ''}?`}
                    confirmButtonText="Reprogramar"
                    confirmVariant="warning"
                />


                <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1056 }}>
                    <Toast
                        onClose={() => setToastInfo(prev => ({ ...prev, show: false }))}
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
