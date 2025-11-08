import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Spinner } from 'react-bootstrap';
import { createProveedor, updateProveedor } from '../../api';

const ProveedorForm = ({ proveedor, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    ubicacion: '',
    historial_compras: ''
  });

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
        historial_compras: proveedor.historial_compras || '',
        activo: proveedor.activo !== undefined ? proveedor.activo : true
      });
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
      } else {
        await createProveedor(formData);
      }
      onSave();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al guardar el proveedor';
      alert(errorMessage);
    } finally {
      setLoading(false);
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
        <Form.Control
          as="textarea"
          rows={4}
          name="historial_compras"
          value={formData.historial_compras}
          onChange={handleInputChange}
          placeholder="Notas sobre compras realizadas, productos suministrados, etc..."
          disabled={loading}
        />
      </Form.Group>

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
