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

    // 🎨 Estilos en JS
    const styles = {
        container: {
            background: 'url("https://images.unsplash.com/photo-1578682129703-2f9628cb5978?fit=crop&w=1600&q=80") center center / cover no-repeat',
            minHeight: '100vh',
            padding: '2rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        overlay: {
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(245,245,245,0.7)',
            zIndex: 0,
        },
        card: {
            position: 'relative',
            zIndex: 1,
            border: 'none',
            borderRadius: '1.5rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.85)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
            backdropFilter: 'blur(8px)',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
        },
        logo: {
            content: '"MV"',
            fontFamily: '"Playfair Display", serif',
            position: 'absolute',
            top: '-45px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#d8a863',
            color: 'white',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            fontSize: '2rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(216,168,99,0.3)',
        },
        button: {
            background: 'linear-gradient(90deg, #e2b673, #d8a863)',
            border: 'none',
            padding: '0.8rem',
            borderRadius: '2rem',
            fontWeight: 'bold',
            color: '#fff',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            transition: 'all 0.3s ease',
            width: '100%',
        },
        formControl: {
            borderRadius: '2rem',
            padding: '0.8rem 1rem',
            border: '1px solid #ddd',
            background: '#fdfdfd',
        },
        h2: {
            fontFamily: '"Playfair Display", serif',
            color: '#333',
            fontSize: '1.8rem',
            marginTop: '2.5rem',
            marginBottom: '0.25rem',
        },
        h3: {
            fontFamily: '"Lato", sans-serif',
            color: '#666',
            fontSize: '1.1rem',
            marginBottom: '2rem',
            letterSpacing: '0.5px',
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.overlay}></div>
            <Card style={styles.card}>
                <div style={styles.logo}>MV</div>
                <Card.Body>
                    <h2 style={styles.h2}>MV Salon Urbano</h2>
                    <h3 style={styles.h3}>Iniciar Sesión</h3>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3" controlId="formBasicEmail">
                            <Form.Label>Usuario</Form.Label>
                            <Form.Control
                                style={styles.formControl}
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
                                style={styles.formControl}
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
                                style={styles.button}
                            >
                                {loading ? 'Ingresando...' : 'Ingresar'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
};

export default LoginPage;
