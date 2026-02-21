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
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
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
export const fetchClientes = (query) => apiClient.get('/clientes', { params: query ? { q: query } : {} });
export const fetchClienteById = (id) => apiClient.get(`/clientes/${id}`);
export const fetchHistorialServiciosByClienteId = (clienteId) => apiClient.get(`/clientes/${clienteId}/historial-servicios`);
export const createCliente = (clienteData) => apiClient.post('/clientes', clienteData);
export const updateCliente = (id, clienteData) => apiClient.put(`/clientes/${id}`, clienteData);
export const deleteCliente = (id) => apiClient.delete(`/clientes/${id}`);
export const fetchProximosCumpleanos = (dias = 7) => apiClient.get(`/clientes/proximos-cumpleanos?dias=${dias}`);

// Servicios
export const fetchServicios = (query) => apiClient.get('/servicios', { params: query || {} });
export const toggleServicioActivo = (id) => apiClient.patch(`/servicios/${id}/toggle-activo`);
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
export const createMovimientoStock = (movimientoData) => apiClient.post('/stock/movimiento', movimientoData);

// Caja
export const abrirCaja = (data) => apiClient.post('/caja/abrir', data);
export const cerrarCaja = (data) => apiClient.post('/caja/cerrar', data);
export const registrarMovimientoCaja = (data) => apiClient.post('/caja/movimiento', data);
export const obtenerCajaActual = () => apiClient.get('/caja/actual');
export const obtenerResumenCaja = (cajaId) => apiClient.get(`/caja/resumen/${cajaId}`);
export const generarReporteCaja = (params) => apiClient.get('/caja/reporte',  { params });  
export const obtenerCategoriasGastos = () => apiClient.get('/caja/categorias-gastos');
export const obtenerHistorialCajas = (params) => apiClient.get('/caja/historial', { params });
export const obtenerClientes = () => apiClient.get('/clientes');


export const fetchAsistencias = () => apiClient.get('/asistencias');

export const fetchAsistenciaByCliente = (clienteId) => apiClient.get(`/asistencias/${clienteId}`);

export const marcarAsistencia = (clienteId) => apiClient.post(`/asistencias/${clienteId}/check`);

export const resetAsistencia = (clienteId) => apiClient.post(`/asistencias/${clienteId}/reset`);

export const fetchStockMovimientos = (params) => apiClient.get('/stock/movimientos', { params });


export const fetchProveedores = () => apiClient.get('/proveedores');
export const fetchProveedor = (id) => apiClient.get(`/proveedores/${id}`);
export const createProveedor = (data) => apiClient.post('/proveedores', data);
export const updateProveedor = (id, data) => apiClient.put(`/proveedores/${id}`, data);
export const deleteProveedor = (id) => apiClient.delete(`/proveedores/${id}`);
export const toggleProveedorActivo = (id) => apiClient.patch(`/proveedores/${id}/toggle-activo`);
// Compras a proveedores (historial estructurado)
export const fetchProveedorCompras = (proveedorId) => apiClient.get(`/proveedores/${proveedorId}/compras`);
export const createProveedorCompra = (proveedorId, compraData) => apiClient.post(`/proveedores/${proveedorId}/compras`, compraData);
export const updateProveedorCompra = (compraId, compraData) => apiClient.put(`/proveedores/compras/${compraId}`, compraData);
export const deleteProveedorCompra = (compraId) => apiClient.delete(`/proveedores/compras/${compraId}`);