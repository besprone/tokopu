import React, { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Button, MetaSheet } from '../components/ui.jsx';
import TareaProgreso from '../components/TareaProgreso.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { GRUPOS_PRUEBA } from '../flow.js';
import Home from './block1/Home.jsx';
import SolicitudHub from './block1/SolicitudHub.jsx';

// Solo se llega aqui en sesion REMOTA (autoadministrada, sin moderador
// presente): antes de cada tarea se muestra el escenario y el asesor arranca
// el cronometro el mismo, dando "Empezar tarea". En moderada nunca se
// navega a esta pantalla: el facilitador dice el escenario en voz y el
// cronometro arranca solo, al terminar la tarea anterior.
export default function IntroTarea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { track } = useMetrics();

  const grupo = GRUPOS_PRUEBA.find((g) => g.id === id);

  useEffect(() => {
    if (grupo) track('sheet_open', { tipo: 'intro', tarea: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!grupo) return <Navigate to="/solicitud" replace />;

  const empezar = () => {
    track('task_start', { tarea: grupo.id });
    navigate(grupo.entrada, { replace: true });
  };

  // La tarea 1 arranca en el dashboard (hay que encontrar el +); el resto,
  // sobre el hub de progreso.
  const Fondo = grupo.entrada === '/inicio' ? Home : SolicitudHub;

  return (
    <>
      <Fondo />
      <MetaSheet label={`Tarea ${grupo.num} de ${GRUPOS_PRUEBA.length}`}>
        <TareaProgreso currentId={grupo.id} />
        <h1 style={{ marginTop: 12 }}>{grupo.titulo}</h1>
        <div className="card">
          <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Escenario
          </div>
          <p className="small" style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>
            {grupo.escenario}
          </p>
        </div>
        <Button variant="primary" onClick={empezar} track={`empezar_${grupo.id}`}>
          Empezar tarea →
        </Button>
      </MetaSheet>
    </>
  );
}
