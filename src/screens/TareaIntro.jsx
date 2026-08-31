import React, { useEffect } from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Button, MetaSheet } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore, tareaCompletada } from '../state/store.jsx';
import { TAREAS, ENTRADA_TAREA, ORDEN_TAREAS } from '../flow.js';
import Home from './block1/Home.jsx';
import SolicitudHub from './block1/SolicitudHub.jsx';

export default function TareaIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud } = useStore();

  const tarea = TAREAS[id];
  const idx = ORDEN_TAREAS.indexOf(id);
  const previa = idx > 0 ? ORDEN_TAREAS[idx - 1] : null;

  // Motivos para NO mostrar el intro (y volver al hub):
  // sin tarea valida, tarea ya completada, o la previa aun sin completar.
  const bloquear =
    !tarea ||
    !ENTRADA_TAREA[id] ||
    tareaCompletada(solicitud, id) ||
    (previa && !tareaCompletada(solicitud, previa));

  useEffect(() => {
    if (!bloquear) track('sheet_open', { tipo: 'intro', tarea: id });
  }, [id, bloquear]); // eslint-disable-line react-hooks/exhaustive-deps

  if (bloquear) return <Navigate to="/solicitud" replace />;

  const empezar = () => {
    track('task_start', { tarea: id });
    navigate(ENTRADA_TAREA[id], { replace: true });
  };

  // Fondo: la Tarea 1 arranca en el dashboard (hay que encontrar el +);
  // el resto, sobre el hub de progreso.
  const Fondo = id === 'iniciar_solicitud' ? Home : SolicitudHub;

  return (
    <>
      <Fondo />
      <MetaSheet label={`Tarea ${tarea.num} de 5`}>
        <span className="tiny">Tarea {tarea.num}</span>
        <h1>{tarea.titulo}</h1>
        <div className="card">
          <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Escenario
          </div>
          <p className="small" style={{ margin: '4px 0 0' }}>{tarea.escenario}</p>
        </div>
        <Button variant="primary" onClick={empezar} track={`empezar_${id}`}>
          Empezar tarea →
        </Button>
      </MetaSheet>
    </>
  );
}
