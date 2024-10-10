import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert } from 'react-bootstrap';

const fondos = [
  { id: "1", nombre: "CLIENTE_RECAUDADORA", monto_minimo_vinculacion: 75000, categoria: "FPV" },
  { id: "2", nombre: "FPV_EL_CLIENTE_ECOPETROL", monto_minimo_vinculacion: 125000, categoria: "FPV" },
  { id: "3", nombre: "DEUDA_PRIVADA", monto_minimo_vinculacion: 50000, categoria: "FIC" },
  { id: "4", nombre: "FDO_ACCIONES", monto_minimo_vinculacion: 250000, categoria: "FIC" },
  { id: "5", nombre: "FPV_EL_CLIENTE_DINAMICA", monto_minimo_vinculacion: 100000, categoria: "FPV" }
];
const notifications = [
  { id: "1", nombre: "sms" },
  { id: "2", nombre: "mail" }
]

var request_error = "Error requesting Api:"
var API_URL = "https://u1m6jc26x3.execute-api.us-west-2.amazonaws.com/Prod/"

function Dashboard() {
  const [Data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [newFundsId, setnewFundsId] = useState('');
  const [newAmount, setnewAmount] = useState('');
  const [newNotification, setnewNotification] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL + 'subscriptions?user_id=1');
      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }
      const apiData = await response.json();
      setData(apiData);
    } catch (error) {
      console.error(request_error, error);
    } finally {
      setLoading(false);
    }
  };

  const handleVincularFondo = async () => {
    const selectedFondo = fondos.find(fondo => fondo.id === newFundsId);

    if (selectedFondo && newAmount < selectedFondo.monto_minimo_vinculacion) {
      setValidationError(`El monto minimo es de ${selectedFondo.monto_minimo_vinculacion} para el fondo ${selectedFondo.nombre}.`);
      return;
    }

    setValidationError('');

    try {
      const response = await fetch(API_URL + 'transactions', {
        method: 'POST',
        body: JSON.stringify({
          user_id: 1,
          funds_id: newFundsId,
          amount: newAmount,
          transaction_type: "Vinculacion",
          notification: newNotification
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.statusCode === 400) {
        setValidationError(`Error: ${data.body}`);
        return;
      }

      fetchData();
      setShow(false);
    } catch (error) {
      console.error(request_error, error);
    }
  };

  const handleDesvincularFondo = async (funds_id) => {
    try {
      const response = await fetch(API_URL + `transactions`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: "1",
          funds_id: funds_id,
          amount: 0,
          transaction_type: "Desvinculacion",
          notification: newNotification
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.statusCode === 400) {
        setValidationError(`Error: ${data.body}`);
        return;
      }
      fetchData();
    } catch (error) {
      console.error(request_error, error);
    }
  };

  if (loading) {
    return <div>
      <h1>FONDO DE PENSIONES</h1>
      <h2>Cargando...</h2>
      </div>;
  }

  return (
    <div>
      <h1>FONDO DE PENSIONES</h1>
      <h2>Fondos disponibles</h2>
      <Table striped bordered hover variant="dark">
        <thead>
          <tr>
            <th>Fondo ID</th>
            <th>Nombre de fondo</th>
            <th>Monto minimo de vinculacion</th>
            <th>Categoria</th>
          </tr>
        </thead>
        <tbody>
        {fondos.map((item) => (
              <tr>
                <td>{item.id}</td>
                <td>{item.nombre}</td>
                <td>{item.monto_minimo_vinculacion}</td>
                <td>{item.categoria}</td>
              </tr>
            ))
          };
        </tbody>
      </Table>

      <Button variant="primary" onClick={() => setShow(true)}>Vincular nuevo fondo</Button>


      <h2>{Data.name}</h2>
      <h3>Fondos: {Data.saldo}</h3>
      <h3>Telefono: {Data.phone}</h3>
      <h3>Correo electronico: {Data.email}</h3>
      <h2>Fondos disponibles</h2>


      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Id Usuario</th>
            <th>Id Fondo</th>
            <th>Monto (COP)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Data.subscriptions && Data.subscriptions.length > 0 ? (
            Data.subscriptions.map((item) => (
              <tr key={item.subscription_id}>
                <td>{item.subscription_id}</td>
                <td>{item.user_id}</td>
                <td>{item.funds_id}</td>
                <td>{item.amount}</td>
                <td>
                  <Button variant="danger" onClick={() => handleDesvincularFondo(item.funds_id)}>
                    Desvincular
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5">No hay datos disponibles</td>
            </tr>
          )}
        </tbody>
      </Table>
      <br />

      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vincular a un nuevo fondo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {validationError && <Alert variant="danger">{validationError}</Alert>}
          <Form>
            <Form.Group>
              <Form.Label>Selecciona el Fondo</Form.Label>
              <Form.Control
                as="select"
                value={newFundsId}
                onChange={(e) => setnewFundsId(e.target.value)}
              >
                <option value="">Selecciona un fondo...</option>
                {fondos.map(fondo => (
                  <option key={fondo.id} value={fondo.id}>
                    {fondo.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
            <Form.Group>
              <Form.Label>Monto</Form.Label>
              <Form.Control
                type="number"
                placeholder="Ingresa el monto"
                value={newAmount}
                onChange={(e) => setnewAmount(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Notificacion</Form.Label>
              <Form.Control
                as="select"
                value={newNotification}
                onChange={(e) => setnewNotification(e.target.value)}
              >
                <option value="">Como quieres ser notificado</option>
                {notifications.map(noti => (
                  <option key={noti.id} value={noti.id}>
                    {noti.nombre}
                  </option>
                ))}
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false) & setValidationError('')}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleVincularFondo}>
            Vincular
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Dashboard;
