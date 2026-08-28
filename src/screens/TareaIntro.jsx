import React from 'react';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button, TopBar } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore, tareaCompletada } from '../state/store.jsx';
import { TAREAS, ENTRADA_TAREA, ORDEN_TAREAS } from '../flow.js';

export default function TareaIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud } = useStore();

  const tarea = TAREAS[id];

  // Sin tarea valida, o tarea ya completada: no se puede (re)entrar.
  if (!tarea || !ENTRADA_TAREA[id]) return <Navigate to="/solicitud" replace />;
  if (tareaCompletada(solicitud, id)) return <Navigate to="/solicitud" replace />;

  // No se puede saltar a una tarea si la anterior no esta completa.
  const idx = ORDEN_TAREAS.indexOf(id);
  const previa = idx > 0 ? ORDEN_TAREAS[idx - 1] : null;
  if (previa && !tareaCompletada(solicitud, previa)) {
    return <Navigate to="/solicitud" replace />;
  }

  const empezar = () => {
    track('task_start', { tarea: id });
    navigate(ENTRADA_TAREA[id], { replace: true });
  };

  return (
    <Screen meta>
      <MetaBar label={`Tarea ${tarea.num} de 5`} />
      <TopBar
        onBack={() => navigate(-1)}
        onClose={() => navigate(id === 'iniciar_solicitud' ? '/inicio' : '/solicitud')}
      />
      <Content>
        <span className="tiny">Tarea {tarea.num}</span>
        <h1>{tarea.titulo}</h1>
        <div className="card">
          <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Escenario
          </div>
          <p className="small" style={{ margin: '4px 0 0' }}>{tarea.escenario}</p>
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" onClick={empezar} track={`empezar_${id}`}>
          Empezar tarea →
        </Button>
        <Button variant="ghost" onClick={() => navigate(-1)} track={`intro_volver_${id}`}>
          ← Volver
        </Button>
      </FooterActions>
    </Screen>
  );
}
