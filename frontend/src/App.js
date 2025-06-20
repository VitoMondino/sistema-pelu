import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ServiciosPage from './pages/ServiciosPage';
import TurnosPage from './pages/TurnosPage';
import StockPage from './pages/StockPage';
// import ProfilePage from './pages/ProfilePage'; // Si se necesita

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return ( // Muestra un spinner mientras carga el estado de autenticación
        <div className="d-flex justify-content-center align-items-center vh-100">
            <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
            </div>
        </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

// Separamos MainApp para poder usar useAuth dentro del contexto de AuthProvider
function MainApp() {
  const { isAuthenticated, loading } = useAuth(); // Obtenemos loading también de useAuth

  if (loading) {
    // Muestra un spinner global aquí mientras se verifica el auth token inicial
    // Este spinner se mostrará brevemente al cargar la app por primera vez.
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/servicios"
        element={
          <ProtectedRoute>
            <ServiciosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/turnos"
        element={
          <ProtectedRoute>
            <TurnosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <StockPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta por defecto */}
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}

export default App;
