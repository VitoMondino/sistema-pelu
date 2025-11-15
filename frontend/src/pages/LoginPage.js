import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Button, Card, Alert } from 'react-bootstrap';

const LoginPage = () => {
    const [nombre_usuario, setNombreUsuario] = useState('MVsalonUrbano');
    const [contrasena, setContrasena] = useState('Tunumero200105+');
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
        <div className="login-page">
            <div className="login-overlay"></div>
            <Card className="login-card fade-in">
                <div className="login-logo">MV</div>
                <Card.Body>
                    <h2 className="login-title">MV Salon Urbano</h2>
                    <p className="login-subtitle">Iniciar Sesión</p>
                    {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label className="form-label">Usuario</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Ingrese su usuario"
                                value={nombre_usuario}
                                onChange={(e) => setNombreUsuario(e.target.value)}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-4" controlId="formBasicPassword">
                            <Form.Label className="form-label">Contraseña</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Contraseña"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary btn-lg"
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Ingresando...
                                    </>
                                ) : 'Ingresar'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LoginPage;