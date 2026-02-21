import React, { useEffect, useState } from 'react';
import { Modal, Button, Table, Spinner, Pagination } from 'react-bootstrap';
import { fetchProveedorCompras } from '../../api';

const itemsPerPage = 15;

const ProveedorComprasModal = ({ show, onHide, proveedor }) => {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!proveedor || !show) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchProveedorCompras(proveedor.id);
        const data = res.data?.data || res.data || [];
        setCompras(Array.isArray(data) ? data : []);
        setCurrentPage(1);
      } catch (err) {
        console.error(err);
        setError('Error al cargar el historial de compras');
        setCompras([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [proveedor, show]);

  const totalPages = Math.max(1, Math.ceil(compras.length / itemsPerPage));
  const start = (currentPage - 1) * itemsPerPage;
  const pageItems = compras.slice(start, start + itemsPerPage);

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Historial de Compras — {proveedor?.nombre} {proveedor?.apellido}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <div className="text-danger">{error}</div>
        ) : compras.length === 0 ? (
          <div className="text-muted">No hay compras registradas para este proveedor.</div>
        ) : (
          <div>
            <Table striped bordered hover size="sm">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Descripción</th>
                  <th className="text-end">Monto</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(c => (
                  <tr key={c.id || `${c.fecha}-${c.monto}-${c.descripcion}`}>
                    <td>{c.fecha}</td>
                    <td>{c.descripcion}</td>
                    <td className="text-end">{c.monto}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            {totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination size="sm">
                  <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} />
                  {Array.from({ length: totalPages }, (_, i) => (
                    <Pagination.Item key={i+1} active={i+1 === currentPage} onClick={() => setCurrentPage(i+1)}>{i+1}</Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} />
                  <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Cerrar</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProveedorComprasModal;
