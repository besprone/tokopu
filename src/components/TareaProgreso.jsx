import React from 'react';
import { GRUPOS_PRUEBA } from '../flow.js';
import { useStore, tareaCompletada } from '../state/store.jsx';

// Barra lineal de 3 segmentos: grupos de prueba completados / actual /
// pendientes. Se muestra en el panel de Instrucciones. Un grupo cuenta como
// completo cuando su ultimo bloque de producto (bloqueFinal) lo esta.
export default function TareaProgreso({ currentId }) {
  const { solicitud } = useStore();
  const hechos = GRUPOS_PRUEBA.filter((g) => tareaCompletada(solicitud, g.bloqueFinal)).length;

  return (
    <div className="tarea-progreso">
      <div className="tp-track" aria-hidden="true">
        {GRUPOS_PRUEBA.map((g) => {
          const done = tareaCompletada(solicitud, g.bloqueFinal);
          const current = g.id === currentId && !done;
          return (
            <span key={g.id} className={`tp-seg${done ? ' done' : ''}${current ? ' current' : ''}`} />
          );
        })}
      </div>
      <div className="tp-caption tiny">
        {hechos} de {GRUPOS_PRUEBA.length} tareas completadas
      </div>
    </div>
  );
}
