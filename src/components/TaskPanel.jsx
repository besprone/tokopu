import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TAREAS, ORDEN_TAREAS, tareaDeRuta } from '../flow.js';
import { useStore, tareaCompletada } from '../state/store.jsx';

// Pestana "Escenario" en el borde derecho: muestra SOLO el escenario de la
// tarea que el asesor esta desarrollando en ese momento. Con ?mod=1 anade
// "Que observar" (para el facilitador). Se oculta fuera de una tarea.
export default function TaskPanel() {
  const location = useLocation();
  const { solicitud } = useStore();
  const [open, setOpen] = useState(false);
  const [modo, setModo] = useState(false);

  // En dashboard y hub no hay ruta de tarea, pero el asesor SI esta dentro de
  // una tarea (buscando el + o el bloque que toca): mostramos la tarea en
  // curso = la primera sin completar.
  const enNavegacion = ['/inicio', '/solicitudes', '/solicitud'].includes(location.pathname);
  const enCurso = ORDEN_TAREAS.find((tid) => !tareaCompletada(solicitud, tid)) || null;
  const id = tareaDeRuta(location.pathname) || (enNavegacion ? enCurso : null);
  const tarea = id ? TAREAS[id] : null;

  useEffect(() => {
    try {
      setModo(localStorage.getItem('toko.mod') === '1');
    } catch {
      setModo(false);
    }
  }, [open]);

  // Fuera de una tarea no hay nada que mostrar.
  useEffect(() => {
    if (!tarea) setOpen(false);
  }, [tarea]);

  if (!tarea) return null;

  return (
    <>
      <button className="task-tab" onClick={() => setOpen(true)} title="Escenario de la tarea">
        Escenario · T{tarea.num}
      </button>

      {open && (
        <div className="panel-backdrop" onClick={() => setOpen(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>
                Tarea {tarea.num} — {tarea.titulo}
              </h2>
              <button className="btn ghost sm" onClick={() => setOpen(false)}>
                Cerrar
              </button>
            </div>

            <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 14 }}>
              Escenario
            </div>
            <p className="small" style={{ margin: '4px 0 0' }}>{tarea.escenario}</p>

            {modo && (
              <>
                <div
                  className="tiny"
                  style={{ textTransform: 'uppercase', letterSpacing: '.04em', marginTop: 14 }}
                >
                  Que observar (facilitador)
                </div>
                <ul className="small" style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                  {tarea.observar.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
