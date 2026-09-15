import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, MetaSheet } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { GRUPOS_PRUEBA, ORDEN_GRUPOS, SEQ_PREGUNTA, SEQ_MIN_LABEL, SEQ_MAX_LABEL } from '../flow.js';
import SolicitudHub from './block1/SolicitudHub.jsx';

export default function SeqScreen() {
  const { tarea } = useParams();
  const navigate = useNavigate();
  const { track } = useMetrics();
  const [score, setScore] = useState(null);

  const idx = ORDEN_GRUPOS.indexOf(tarea);
  const grupo = GRUPOS_PRUEBA[idx] || { titulo: tarea, next: '/solicitud' };
  const siguienteId = ORDEN_GRUPOS[idx + 1] || null;

  useEffect(() => {
    track('sheet_open', { tipo: 'seq', tarea });
  }, [tarea]); // eslint-disable-line react-hooks/exhaustive-deps

  const enviar = () => {
    if (score == null) return;
    track('seq_answer', { tarea, score });
    // Solo aplica en sesion remota (aqui es donde se llega). Al continuar
    // arranca el cronometro del siguiente grupo, si hay uno.
    if (siguienteId) track('task_start', { tarea: siguienteId });
    navigate(grupo.next, { replace: true });
  };

  return (
    <>
      <SolicitudHub />
      <MetaSheet label="Pregunta rápida">
        <span className="tiny">
          {grupo.num
            ? `Evaluación de la tarea ${grupo.num} · ${grupo.titulo}`
            : `Evaluación · ${grupo.titulo}`}
        </span>
        <h1>{SEQ_PREGUNTA}</h1>

        <div className="scale">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              className={score === n ? 'sel' : ''}
              onClick={() => setScore(n)}
              aria-pressed={score === n}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="scale-legend">
          <span>1 · {SEQ_MIN_LABEL}</span>
          <span>7 · {SEQ_MAX_LABEL}</span>
        </div>

        <Button variant="primary" disabled={score == null} onClick={enviar} track="seq_enviar">
          Continuar
        </Button>
      </MetaSheet>
    </>
  );
}
