import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { MetricsProvider } from './metrics/MetricsProvider.jsx';
import { StoreProvider } from './state/store.jsx';
import './styles.css';

// Sin StrictMode: en desarrollo duplica los efectos y ensuciaria el registro
// de eventos (task_start doble, etc.) durante las pruebas de usabilidad.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <MetricsProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </MetricsProvider>
  </BrowserRouter>
);
