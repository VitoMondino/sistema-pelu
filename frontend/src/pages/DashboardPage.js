import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { useNavigate } from 'react-router-dom'; // No se usa directamente aquí ahora
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { fetchProximosCumpleanos, getWhatsappStatus } from '../api';
import MainLayout from '../components/MainLayout'; // Importar el MainLayout mejorado

const DashboardPage = () => {
    const { user } = useAuth(); // El logout y navigate se manejan en MainLayout
    const [proximosCumples, setProximosCumples] = useState([]);
    const [whatsappStatus, setWhatsappStatus] = useState({ isReady: false, message: 'Verificando...' });
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setError('');
                const cumplesResponse = await fetchProximosCumpleanos(7); // Próximos 7 días
                setProximosCumples(cumplesResponse.data);

                const wsStatusResponse = await getWhatsappStatus();
                setWhatsappStatus(wsStatusResponse.data);

            } catch (err) {
                console.error("Error al cargar datos del dashboard:", err);
                setError(err.response?.data?.message || err.message || 'Error al cargar datos.');
            }
        };
        cargarDatos();
    }, []);

    return (
        <MainLayout>
            <Container fluid>
                <h1 className="mb-4">Dashboard</h1>
                <p>Bienvenido/a, <strong>{user?.nombre_usuario || 'Usuario'}</strong>!</p>

                {error && <Alert variant="danger">{error}</Alert>}

                <Row>
                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Header as="h5">Próximos Cumpleaños (7 días)</Card.Header>
                            <Card.Body>
                                {proximosCumples.length > 0 ? (
                                    <ul className="list-group list-group-flush">
                                        {proximosCumples.map(cliente => (
                                            <li key={cliente.id} className="list-group-item">
                                                {cliente.nombre} {cliente.apellido} - {new Date(cliente.fecha_cumpleanos).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No hay cumpleaños próximos en los siguientes 7 días.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>

                    <Col md={6} className="mb-3">
                        <Card>
                            <Card.Header as="h5">Estado de WhatsApp</Card.Header>
                            <Card.Body>
                                <p>Servicio: <strong>{whatsappStatus.isReady ? 'Conectado' : 'Desconectado'}</strong></p>
                                <p>{whatsappStatus.message}</p>
                                {whatsappStatus.qrCodeAvailable && (
                                    <Alert variant="warning">
                                        Se requiere escanear código QR. Revisa la consola del backend.
                                    </Alert>
                                )}
                                 {/* Podríamos añadir un botón para re-intentar obtener el estado */}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                {/* Aquí se podrían añadir más cards o información relevante */}
                {/* Por ejemplo:
                <Row>
                    <Col md={4} className="mb-3">
                        <Card>
                            <Card.Body>
                                <Card.Title>Turnos de Hoy</Card.Title>
                                <Card.Text>XX turnos</Card.Text>
                                <Button variant="primary">Ver Turnos</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                     <Col md={4} className="mb-3">
                        <Card>
                            <Card.Body>
                                <Card.Title>Clientes Activos</Card.Title>
                                <Card.Text>XXX clientes</Card.Text>
                                <Button variant="primary">Gestionar Clientes</Button>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                */}

            </Container>
        </MainLayout>
    );
};

export default DashboardPage;
