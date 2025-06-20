import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores globalmente (opcional)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ejemplo: si el error es 401 (No autorizado), podríamos desloguear al usuario
    if (error.response && error.response.status === 401) {
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      // window.location.href = '/login'; // O usar history.push si está disponible
      console.error("Error 401: No autorizado. El token puede haber expirado o es inválido.");
    }
    return Promise.reject(error);
  }
);


export default apiClient;

// Funciones específicas de API

// Auth
export const login = (credentials) => apiClient.post('/auth/login', credentials);

// Clientes
export const fetchClientes = () => apiClient.get('/clientes');
export const fetchClienteById = (id) => apiClient.get(`/clientes/${id}`);
export const createCliente = (clienteData) => apiClient.post('/clientes', clienteData);
export const updateCliente = (id, clienteData) => apiClient.put(`/clientes/${id}`, clienteData);
export const deleteCliente = (id) => apiClient.delete(`/clientes/${id}`);
export const fetchProximosCumpleanos = (dias = 7) => apiClient.get(`/clientes/proximos-cumpleanos?dias=${dias}`);

// Servicios
export const fetchServicios = () => apiClient.get('/servicios');
export const fetchServicioById = (id) => apiClient.get(`/servicios/${id}`);
export const createServicio = (servicioData) => apiClient.post('/servicios', servicioData);
export const updateServicio = (id, servicioData) => apiClient.put(`/servicios/${id}`, servicioData);
export const deleteServicio = (id) => apiClient.delete(`/servicios/${id}`);

// Turnos
export const fetchTurnos = () => apiClient.get('/turnos');
export const fetchTurnoById = (id) => apiClient.get(`/turnos/${id}`);
export const createTurno = (turnoData) => apiClient.post('/turnos', turnoData);
export const updateTurno = (id, turnoData) => apiClient.put(`/turnos/${id}`, turnoData);
export const deleteTurno = (id) => apiClient.delete(`/turnos/${id}`);

// Stock
export const fetchStock = () => apiClient.get('/stock');
export const fetchStockItemById = (id) => apiClient.get(`/stock/${id}`);
export const createStockItem = (itemData) => apiClient.post('/stock', itemData);
export const updateStockItem = (id, itemData) => apiClient.put(`/stock/${id}`, itemData);
export const deleteStockItem = (id) => apiClient.delete(`/stock/${id}`);

// WhatsApp (si se necesitan endpoints específicos desde el frontend)
export const getWhatsappStatus = () => apiClient.get('/whatsapp/status');
// export const sendTestWhatsappMessage = (data) => apiClient.post('/whatsapp/send-test', data);
