import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { TAREAS, SEQ_PREGUNTA, SEQ_MIN_LABEL, SEQ_MAX_LABEL } from '../flow.js';

export default function SeqScreen() {
  const { tarea } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useMetrics();
  const [score, setScore] = useState(null);

  const meta = TAREAS[tarea] || { titulo: tarea, next: '/solicitud' };
  const next = location.state?.next || meta.next;

  const enviar = () => {
    if (score == null) return;
    track('seq_answer', { tarea, score });
    navigate(next, { replace: true });
  };

  return (
    <Screen meta>
      <MetaBar label="Pregunta rapida" />
      <Content>
        <span className="tiny">Evaluacion de la tarea{meta.num ? ` ${meta.num}` : ''}</span>
        <h1>{meta.titulo}</h1>
        <p className="lead">{SEQ_PREGUNTA}</p>

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
      </Content>
      <FooterActions>
        <Button variant="primary" disabled={score == null} onClick={enviar} track="seq_enviar">
          Continuar
        </Button>
      </FooterActions>
    </Screen>
  );
}
