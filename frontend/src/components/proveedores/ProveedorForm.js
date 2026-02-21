import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { createProveedor, updateProveedor, fetchProveedorCompras, createProveedorCompra, updateProveedorCompra, deleteProveedorCompra } from '../../api';

const ProveedorForm = ({ proveedor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    ubicacion: ''
  });

  const [compras, setCompras] = useState([]);
  const [comprasLoading, setComprasLoading] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [compraForm, setCompraForm] = useState({ id: null, fecha: '', monto: '', descripcion: '' });
  const [isEditingCompra, setIsEditingCompra] = useState(false);
  // tempCompras se usa cuando se crea un proveedor nuevo y aún no tiene id en backend
  const [tempCompras, setTempCompras] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (proveedor) {
      setFormData({
        nombre: proveedor.nombre || '',
        apellido: proveedor.apellido || '',
        telefono: proveedor.telefono || '',
        email: proveedor.email || '',
        ubicacion: proveedor.ubicacion || '',
        
        activo: proveedor.activo !== undefined ? proveedor.activo : true
      });
      // cargar compras estructuradas
      (async () => {
        setComprasLoading(true);
        try {
          const res = await fetchProveedorCompras(proveedor.id);
          const data = res.data?.data || res.data || [];
          setCompras(Array.isArray(data) ? data : []);
        } catch (err) {
          console.error('Error al cargar compras del proveedor', err);
          setCompras([]);
        } finally {
          setComprasLoading(false);
        }
      })();
    }
  }, [proveedor]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido';
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      if (proveedor) {
        await updateProveedor(proveedor.id, formData);
        // Si actualizamos y había compras temporales (poco probable) intentar guardarlas
        if (tempCompras.length > 0) {
          for (const c of tempCompras) {
            await createProveedorCompra(proveedor.id, c);
          }
          setTempCompras([]);
        }
      } else {
        const res = await createProveedor(formData);
        // si creamos y existen compras temporales, persistirlas en backend
        const newId = res.data?.data?.id || res.data?.id;
        if (newId && tempCompras.length > 0) {
          for (const c of tempCompras) {
            await createProveedorCompra(newId, c);
          }
          setTempCompras([]);
        }
      }
      onSave();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el proveedor';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Compras handlers
  const openAddCompra = () => {
    setCompraForm({ id: null, fecha: new Date().toISOString().slice(0,10), monto: '', descripcion: '' });
    setIsEditingCompra(false);
    setShowCompraModal(true);
  };

  const openEditCompra = (c) => {
    setCompraForm({ id: c.id || null, fecha: c.fecha || '', monto: c.monto || '', descripcion: c.descripcion || '' });
    setIsEditingCompra(!!c.id);
    setShowCompraModal(true);
  };

  const handleCompraChange = (e) => {
    const { name, value } = e.target;
    setCompraForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCompraSubmit = async (e) => {
    e.preventDefault();
    const payload = { fecha: compraForm.fecha, descripcion: compraForm.descripcion, monto: compraForm.monto };
    try {
      if (isEditingCompra && compraForm.id) {
        await updateProveedorCompra(compraForm.id, payload);
      } else if (proveedor && proveedor.id) {
        await createProveedorCompra(proveedor.id, payload);
      } else {
        // proveedor no creado aún -> guardar temporalmente
        setTempCompras(prev => [...prev, payload]);
      }
      // recargar lista si existe proveedor
      if (proveedor && proveedor.id) {
        const res = await fetchProveedorCompras(proveedor.id);
        const data = res.data?.data || res.data || [];
        setCompras(Array.isArray(data) ? data : []);
      }
      setShowCompraModal(false);
    } catch (err) {
      console.error('Error guardando compra', err);
      alert(err.response?.data?.message || err.message || 'Error al guardar compra');
    }
  };

  const handleDeleteCompra = async (c) => {
    if (!c.id) {
      // eliminar de temporales
      setTempCompras(prev => prev.filter(x => x !== c));
      return;
    }
    if (!window.confirm('Confirmar eliminar la compra?')) return;
    try {
      await deleteProveedorCompra(c.id);
      const res = await fetchProveedorCompras(proveedor.id);
      const data = res.data?.data || res.data || [];
      setCompras(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error eliminado compra', err);
      alert(err.response?.data?.message || err.message || 'Error al eliminar compra');
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Nombre *</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              isInvalid={!!errors.nombre}
              disabled={loading}
              placeholder="Ingrese el nombre"
            />
            <Form.Control.Feedback type="invalid">
              {errors.nombre}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Apellido *</Form.Label>
            <Form.Control
              type="text"
              name="apellido"
              value={formData.apellido}
              onChange={handleInputChange}
              isInvalid={!!errors.apellido}
              disabled={loading}
              placeholder="Ingrese el apellido"
            />
            <Form.Control.Feedback type="invalid">
              {errors.apellido}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Teléfono *</Form.Label>
            <Form.Control
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              isInvalid={!!errors.telefono}
              disabled={loading}
              placeholder="Ej: 351-1234567"
            />
            <Form.Control.Feedback type="invalid">
              {errors.telefono}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col md={6}>
          <Form.Group>
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              isInvalid={!!errors.email}
              disabled={loading}
              placeholder="proveedor@ejemplo.com"
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Ubicación</Form.Label>
        <Form.Control
          type="text"
          name="ubicacion"
          value={formData.ubicacion}
          onChange={handleInputChange}
          disabled={loading}
          placeholder="Ciudad, Provincia"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Historial de Compras</Form.Label>
        <div className="border p-2 rounded" style={{ maxHeight: 240, overflowY: 'auto' }}>
          {comprasLoading ? (
            <div className="text-muted">Cargando compras...</div>
          ) : (
            <>
              {compras.length === 0 && tempCompras.length === 0 && (
                <div className="text-muted">No hay compras registradas. Agrega una.</div>
              )}
              <ul className="list-unstyled mb-0">
                {compras.map(c => (
                  <li key={c.id} className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{c.fecha}</strong> — {c.descripcion} <br />
                      <small className="text-muted">Monto: {c.monto}</small>
                    </div>
                    <div>
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEditCompra(c)}>Editar</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCompra(c)}>Borrar</Button>
                    </div>
                  </li>
                ))}
                {tempCompras.map((c, idx) => (
                  <li key={`t-${idx}`} className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <strong>{c.fecha}</strong> — {c.descripcion} <br />
                      <small className="text-muted">Monto: {c.monto} (no guardado)</small>
                    </div>
                    <div>
                      <Button size="sm" variant="outline-primary" className="me-1" onClick={() => openEditCompra(c)}>Editar</Button>
                      <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCompra(c)}>Borrar</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="mt-2 d-flex justify-content-end">
          <Button size="sm" variant="success" onClick={openAddCompra}>Agregar compra</Button>
        </div>
      </Form.Group>

      {/* Modal para agregar/editar compra usando react-bootstrap Modal */}
      <Modal show={showCompraModal} onHide={() => setShowCompraModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{isEditingCompra ? 'Editar compra' : 'Nueva compra'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCompraSubmit}>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Fecha</Form.Label>
              <Form.Control type="date" name="fecha" value={compraForm.fecha} onChange={handleCompraChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Monto</Form.Label>
              <Form.Control type="number" step="0.01" name="monto" value={compraForm.monto} onChange={handleCompraChange} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Descripción</Form.Label>
              <Form.Control as="textarea" rows={3} name="descripcion" value={compraForm.descripcion} onChange={handleCompraChange} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCompraModal(false)}>Cancelar</Button>
            <Button variant="primary" type="submit">Guardar</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Guardando...
            </>
          ) : (
            proveedor ? 'Actualizar' : 'Crear'
          )}
        </Button>
      </div>
    </Form>
  );
};

export default ProveedorForm;
