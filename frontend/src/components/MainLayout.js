import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Navbar, Nav, Container, Button, Offcanvas, NavDropdown } from 'react-bootstrap';
import { HouseDoorFill, PeopleFill, CalendarCheckFill, BoxFill, Scissors, PersonCircle, BoxArrowRight } from 'react-bootstrap-icons'; // Iconos

const MainLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showOffcanvas, setShowOffcanvas] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleCloseOffcanvas = () => setShowOffcanvas(false);
    const handleShowOffcanvas = () => setShowOffcanvas(true);

    const navLinks = [
        { path: "/dashboard", label: "Dashboard", icon: <HouseDoorFill className="me-2" /> },
        { path: "/clientes", label: "Clientes", icon: <PeopleFill className="me-2" /> },
        { path: "/servicios", label: "Servicios", icon: <Scissors className="me-2" /> },
        { path: "/turnos", label: "Turnos", icon: <CalendarCheckFill className="me-2" /> },
        { path: "/stock", label: "Stock", icon: <BoxFill className="me-2" /> },
    ];

    return (
        <div className="d-flex flex-column vh-100">
            <Navbar bg="dark" variant="dark" expand="lg" className="mb-4 shadow-sm">
                <Container fluid>
                    <Button variant="dark" onClick={handleShowOffcanvas} className="d-lg-none me-2">
                        <span className="navbar-toggler-icon"></span>
                    </Button>
                    <Navbar.Brand as={Link} to="/dashboard" className="fw-bold">
                        MV Salon Urbano
                    </Navbar.Brand>
                    {/* Navbar para pantallas grandes (lg y superior) */}
                    <Nav className="d-none d-lg-flex flex-grow-1">
                        {navLinks.map(link => (
                            <Nav.Link key={link.path} as={Link} to={link.path} onClick={handleCloseOffcanvas}>
                                {link.icon} {link.label}
                            </Nav.Link>
                        ))}
                    </Nav>
                    <Nav className="ms-auto">
                        <NavDropdown title={<><PersonCircle className="me-1" /> {user?.nombre_usuario || 'Usuario'}</>} id="basic-nav-dropdown" align="end">
                            {/* <NavDropdown.Item as={Link} to="/perfil">Mi Perfil</NavDropdown.Item> */}
                            {/* <NavDropdown.Divider /> */}
                            <NavDropdown.Item onClick={handleLogout}>
                                <BoxArrowRight className="me-2" /> Cerrar Sesión
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Container>
            </Navbar>

            {/* Offcanvas Sidebar para pantallas pequeñas (menos de lg) */}
            <Offcanvas show={showOffcanvas} onHide={handleCloseOffcanvas} placement="start" className="bg-dark text-white d-lg-none">
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title>Menú</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    <Nav className="flex-column">
                        {navLinks.map(link => (
                            <Nav.Link
                                key={link.path}
                                as={Link}
                                to={link.path}
                                onClick={handleCloseOffcanvas}
                                className="text-white py-2 mb-1 hover-bg-secondary" // Estilo personalizado
                            >
                                {link.icon} {link.label}
                            </Nav.Link>
                        ))}
                    </Nav>
                </Offcanvas.Body>
            </Offcanvas>

            <Container fluid className="flex-grow-1 overflow-auto">
                 {/* El overflow-auto es para que el contenido haga scroll si es necesario, no el layout entero */}
                {children}
            </Container>

            <footer className="bg-dark text-white text-center py-3 mt-auto">
                <Container>
                    <p className="mb-0">&copy; {new Date().getFullYear()} MV Salon Urbano. Todos los derechos reservados.</p>
                </Container>
            </footer>
        </div>
    );
};

// Estilos en línea para hover (alternativa a CSS Modules o styled-components para simplicidad)
const styles = `
.hover-bg-secondary:hover {
    background-color: rgba(255, 255, 255, 0.1) !important;
    border-radius: 0.25rem;
}
`;
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);


export default MainLayout;
