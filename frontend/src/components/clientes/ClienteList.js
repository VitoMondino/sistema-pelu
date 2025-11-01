import React, { memo } from "react";
import { Table, Button, Alert, OverlayTrigger, Tooltip } from "react-bootstrap";
import {
  CheckSquareFill,
  Square,
  PencilSquare,
  TrashFill,
  EyeFill,
  ArrowClockwise,
  Whatsapp,
} from "react-bootstrap-icons";

const ClienteList = memo(
  ({
    clientes = [],
    onEdit,
    onDelete,
    onViewDetails,
    loading,
    error,
    asistenciasMap = {},
    onMarkAsistencia,
    onResetAsistencia,
  }) => {
    if (loading) {
      return (
        <div className="d-flex justify-content-center my-3">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando clientes...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return <Alert variant="danger">Error al cargar clientes: {error}</Alert>;
    }

    if (!clientes || clientes.length === 0) {
      return <Alert variant="info">No hay clientes para mostrar.</Alert>;
    }

    const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      try {
        const d = new Date(dateString);
        return d.toLocaleDateString("es-ES");
      } catch {
        return dateString;
      }
    };

    const renderTooltip = (text) => (
      <Tooltip id={`tooltip-${text}`}>{text}</Tooltip>
    );

    const getWhatsappLink = (telefono, nombre) => {
      if (!telefono) return null;
      const text = encodeURIComponent(
        `Hola ${nombre}, te contacto desde la peluquería.`
      );
      const cleanPhone = telefono.replace(/\D/g, "");
      return `https://wa.me/${cleanPhone}?text=${text}`;
    };

    return (
      <Table striped bordered hover responsive className="mt-3 align-middle">
        <thead className="table-dark">
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Cumpleaños</th>
            <th>Recuento Mensual</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => {
            const contador = asistenciasMap?.[cliente.id] ?? 0;
            return (
              <tr key={cliente.id}>
                <td>
                  {cliente.nombre} {cliente.apellido}
                </td>
                <td>{cliente.telefono || "N/A"}</td>
                <td>{formatDate(cliente.fecha_cumpleanos)}</td>
                <td>
                  <div className="d-flex align-items-center">
                    {Array.from({ length: 4 }).map((_, idx) => {
                      const filled = idx < contador;
                      return (
                        <span key={idx} className="me-1" aria-hidden>
                          {filled ? (
                            <CheckSquareFill color="#0d6efd" />
                          ) : (
                            <Square color="#6c757d" />
                          )}
                        </span>
                      );
                    })}
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip("Marcar corte")}
                    >
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="ms-2"
                        onClick={() =>
                          onMarkAsistencia && onMarkAsistencia(cliente.id)
                        }
                        aria-label={`Marcar corte para ${cliente.nombre}`}
                      >
                        +
                      </Button>
                    </OverlayTrigger>
                    <OverlayTrigger
                      placement="top"
                      overlay={renderTooltip("Reiniciar contador")}
                    >
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="ms-1"
                        onClick={() =>
                          onResetAsistencia && onResetAsistencia(cliente.id)
                        }
                        aria-label={`Reiniciar contador para ${cliente.nombre}`}
                      >
                        <ArrowClockwise />
                      </Button>
                    </OverlayTrigger>
                  </div>
                </td>
                <td>
                  <div className="d-flex">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => onViewDetails && onViewDetails(cliente.id)}
                      title="Ver detalles"
                    >
                      <EyeFill />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => onEdit && onEdit(cliente)}
                      title="Editar cliente"
                    >
                      <PencilSquare />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => onDelete && onDelete(cliente.id)}
                      title="Eliminar cliente"
                    >
                      <TrashFill />
                    </Button>
                    {cliente.telefono && (
                      <a
                        href={getWhatsappLink(cliente.telefono, cliente.nombre)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-success btn-sm ms-2 d-inline-flex align-items-center justify-content-center"
                        title="Enviar WhatsApp"
                        aria-label={`Enviar WhatsApp a ${cliente.nombre}`}
                      >
                        <Whatsapp color="#25D366" size={16} />
                        <span className="visually-hidden">WhatsApp</span>
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }
);

export default ClienteList;
