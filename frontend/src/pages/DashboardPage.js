import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Alert } from 'react-bootstrap';
import { fetchProximosCumpleanos, getWhatsappStatus } from '../api';
import MainLayout from '../components/MainLayout';

const DashboardPage = () => {
    const { user } = useAuth();
    const [proximosCumples, setProximosCumples] = useState([]);
    const [whatsappStatus, setWhatsappStatus] = useState({ isReady: false, message: 'Verificando...' });
    const [error, setError] = useState('');

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setError('');
                const cumplesResponse = await fetchProximosCumpleanos(7); 
                setProximosCumples(cumplesResponse.data);

                const wsStatusResponse = await getWhatsappStatus();
                setWhatsappStatus(wsStatusResponse.data);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'Error al cargar datos.');
            }
        };
        cargarDatos();
    }, []);

    // 🎨 Estilos
    const styles = {
        container: {
            padding: '2rem',
            backgroundColor: '#f9f9f9',
            minHeight: '100vh',
        },
        title: {
            fontFamily: '"Playfair Display", serif',
            fontWeight: '600',
            color: '#333',
        },
        subtitle: {
            fontSize: '1rem',
            color: '#777',
        },
        card: {
            border: 'none',
            borderRadius: '1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
            padding: '1rem',
            backgroundColor: '#fff',
        },
        cardHeader: {
            fontWeight: '600',
            borderBottom: '2px solid #d8a863',
            paddingBottom: '0.5rem',
            marginBottom: '0.5rem',
            color: '#333',
        },
        listItem: {
            padding: '0.75rem',
            borderBottom: '1px solid #eee',
        },
        statusText: (isReady) => ({
            color: isReady ? '#28a745' : '#dc3545',
            fontWeight: '600',
        }),
    };

    return (
        <MainLayout>
            <Container fluid style={styles.container}>
                <h1 style={styles.title}>Dashboard</h1>
                <p style={styles.subtitle}>Bienvenido Matias Vedelago A: <strong>{user?.nombre_usuario || 'Usuario'}</strong>!</p>

                {error && <Alert variant="danger">{error}</Alert>}

                <Row className="mt-4">
                    <Col md={6} className="mb-4">
                        <Card style={styles.card}>
                            <h5 style={styles.cardHeader}>Próximos Cumpleaños (7 días)</h5>
                            <div>
                                {proximosCumples.length > 0 ? (
                                    <ul className="list-unstyled">
                                        {proximosCumples.map((cliente) => (
                                            <li key={cliente.id} style={styles.listItem}>
                                                🎂 {cliente.nombre} {cliente.apellido} —{' '}
                                                {new Date(cliente.fecha_cumpleanos).toLocaleDateString(
                                                    'es-ES',
                                                    { day: '2-digit', month: 'long' }
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p style={styles.subtitle}>No hay cumpleaños próximos en los siguientes 7 días.</p>
                                )}
                            </div>
                        </Card>
                    </Col>

                    <Col md={6} className="mb-4">
                        <Card style={styles.card}>
                            <h5 style={styles.cardHeader}>Estado de WhatsApp</h5>
                            <p>
                                Servicio:&nbsp;
                                <span style={styles.statusText(whatsappStatus.isReady)}>
                                    {whatsappStatus.isReady ? 'Conectado' : 'Desconectado'}
                                </span>
                            </p>
                            <p style={styles.subtitle}>{whatsappStatus.message}</p>
                            {whatsappStatus.qrCodeAvailable && (
                                <Alert variant="warning">
                                    ⚠️ Se requiere escanear código QR. Revisa la consola del backend.
                                </Alert>
                            )}
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
};

export default DashboardPage;
