import Table from 'react-bootstrap/Table';
import React, { useState, useEffect } from 'react';

var API_URL = "https://u1m6jc26x3.execute-api.us-west-2.amazonaws.com/Prod/"

function Historic() {
  const [Data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(API_URL + '/historic?user_id=1');
      if (!response.ok) {
        throw new Error(`Error! status: ${response.status}`);
      }
      const apiData = await response.json();
      setData(apiData);
    } catch (error) {
      console.error('Error requesting API:', error);
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return <div>Cargando...</div>;
  }
  return (
    <div>
      <h1>FONDO DE PENSIONES</h1>
      <h2>Historial de transacciones</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Id Usuario</th>
            <th>Id Fondo</th>
            <th>Tipo de transaccion</th>
            <th>Monto (COP)</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {Data.length > 0 ? (
            Data.map((item) => (
              <tr>
                <td>{item.transaction_id}</td>
                <td>{item.user_id}</td>
                <td>{item.funds_id}</td>
                <td>{item.transaction_type}</td>
                <td>{item.amount}</td>
                <td>{item.creation_date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No hay datos disponibles</td>
            </tr>
          )}

        </tbody>
      </Table>
    </div>
  );
}

export default Historic;