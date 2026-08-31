import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import SessionWidgets from './components/SessionWidgets.jsx';
import TaskPanel from './components/TaskPanel.jsx';

import Bienvenida from './screens/Bienvenida.jsx';
import TareaIntro from './screens/TareaIntro.jsx';
import Home from './screens/block1/Home.jsx';
import Solicitudes from './screens/block1/Solicitudes.jsx';
import NuevaSolicitud from './screens/block1/NuevaSolicitud.jsx';
import SolicitudHub from './screens/block1/SolicitudHub.jsx';
import Identificacion from './screens/block2/Identificacion.jsx';
import Cotizador from './screens/block3/Cotizador.jsx';
import InfoSolicitud from './screens/block4/InfoSolicitud.jsx';
import ConfirmaDatos from './screens/block4/ConfirmaDatos.jsx';
import Documentos from './screens/block5/Documentos.jsx';
import Completada from './screens/block5/Completada.jsx';
import SeqScreen from './screens/SeqScreen.jsx';
import SusScreen from './screens/SusScreen.jsx';
import Gracias from './screens/Gracias.jsx';
import ModLogin from './screens/moderador/ModLogin.jsx';
import ModSesiones from './screens/moderador/ModSesiones.jsx';
import ModDetalle from './screens/moderador/ModDetalle.jsx';

export default function App() {
  return (
    <>
      <div className="device-wrap">
        <div className="device">
          <Routes>
            <Route path="/" element={<Bienvenida />} />
            <Route path="/inicio" element={<Home />} />
            <Route path="/solicitudes" element={<Solicitudes />} />
            <Route path="/nueva" element={<NuevaSolicitud />} />
            <Route path="/solicitud" element={<SolicitudHub />} />
            <Route path="/tarea/:id" element={<TareaIntro />} />
            <Route path="/identificacion" element={<Identificacion />} />
            <Route path="/cotizador" element={<Cotizador />} />
            <Route path="/informacion" element={<InfoSolicitud />} />
            <Route path="/informacion/confirmar" element={<ConfirmaDatos />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/completada" element={<Completada />} />
            <Route path="/seq/:tarea" element={<SeqScreen />} />
            <Route path="/sus" element={<SusScreen />} />
            <Route path="/gracias" element={<Gracias />} />
            <Route path="/moderador" element={<ModLogin />} />
            <Route path="/moderador/sesiones" element={<ModSesiones />} />
            <Route path="/moderador/sesion/:id" element={<ModDetalle />} />
            <Route path="/resultados" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <SessionWidgets />
        </div>
      </div>
      {/* Instrucciones de la tarea: vive a nivel de viewport (fuera del marco)
          para abrir un modal en desktop y un bottom sheet a todo el ancho en
          movil. */}
      <TaskPanel />
    </>
  );
}
