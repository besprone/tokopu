import React from 'react';
import { ORDEN_TAREAS } from '../flow.js';
import { useStore, tareaCompletada } from '../state/store.jsx';

// Barra lineal de 5 segmentos: tareas de la prueba completadas / actual /
// pendientes. Se muestra en los modales de tarea (intro e Instrucciones).
// Solo lee estado que ya existe; no cambia logica.
export default function TareaProgreso({ currentId }) {
  const { solicitud } = useStore();
  const hechas = ORDEN_TAREAS.filter((t) => tareaCompletada(solicitud, t)).length;

  return (
    <div className="tarea-progreso">
      <div className="tp-track" aria-hidden="true">
        {ORDEN_TAREAS.map((t) => {
          const done = tareaCompletada(solicitud, t);
          const current = t === currentId && !done;
          return (
            <span key={t} className={`tp-seg${done ? ' done' : ''}${current ? ' current' : ''}`} />
          );
        })}
      </div>
      <div className="tp-caption tiny">
        {hechas} de {ORDEN_TAREAS.length} tareas completadas
      </div>
    </div>
  );
}
