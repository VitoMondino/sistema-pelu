import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Button, Container, Row, Col, Card, Alert } from 'react-bootstrap';

const LoginPage = () => {
    const [nombre_usuario, setNombreUsuario] = useState('MVsalonUrbano'); // Usuario por defecto
    const [contrasena, setContrasena] = useState('Tunumero200105+'); // Contraseña por defecto
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        if (!nombre_usuario || !contrasena) {
            setError('Por favor, ingrese usuario y contraseña.');
            setLoading(false);
            return;
        }
        const result = await login({ nombre_usuario, contrasena });
        setLoading(false);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message || 'Error al iniciar sesión. Verifique sus credenciales.');
        }
    };

    return (
        <Container fluid className="vh-100 d-flex justify-content-center align-items-center bg-light">
            <Row>
                <Col md={12}>
                    <Card style={{ width: '25rem' }} className="p-4 shadow">
                        <Card.Body>
                            <h2 className="text-center mb-4">MV Salon Urbano</h2>
                            <h3 className="text-center mb-4">Iniciar Sesión</h3>
                            {error && <Alert variant="danger">{error}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formBasicEmail">
                                    <Form.Label>Usuario</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ingrese su usuario"
                                        value={nombre_usuario}
                                        onChange={(e) => setNombreUsuario(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3" controlId="formBasicPassword">
                                    <Form.Label>Contraseña</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Contraseña"
                                        value={contrasena}
                                        onChange={(e) => setContrasena(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                                <div className="d-grid">
                                    <Button variant="primary" type="submit" disabled={loading}>
                                        {loading ? 'Ingresando...' : 'Ingresar'}
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default LoginPage;
