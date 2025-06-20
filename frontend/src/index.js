import React from 'react';
import ReactDOM from 'react-dom/client'; // Actualizado para React 18
import 'bootstrap/dist/css/bootstrap.min.css'; // Importar Bootstrap CSS
import './index.css'; // Puede ser usado para overrides o estilos globales adicionales
import App from './App';
import reportWebVitals from './reportWebVitals'; // create-react-app minimal lo incluye
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Opcional: reportWebVitals
reportWebVitals();
