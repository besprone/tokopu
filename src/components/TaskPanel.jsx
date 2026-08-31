import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { TAREAS, ORDEN_TAREAS, tareaDeRuta } from '../flow.js';
import { useStore, tareaCompletada } from '../state/store.jsx';

// Instrucciones de la tarea. Disparador: un FAB de texto "Instrucciones" fijo a
// la pantalla (fuera del marco del telefono). Al abrir:
//   - desktop  -> modal centrado sobre toda la pantalla
//   - movil    -> bottom sheet a todo el ancho (lo decide el CSS por media query)
// Muestra SOLO el escenario de la tarea en curso. Con ?mod=1 anade "Que
// observar" (para el facilitador). Se oculta fuera de una tarea.
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

  // Cerrar con Escape (ahora es un modal a nivel de pantalla).
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!tarea) return null;

  return (
    <>
      <button
        className="instrucciones-fab"
        onClick={() => setOpen(true)}
        title="Ver las instrucciones de la tarea"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 11h6M9 15h4" />
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
        </svg>
        Instrucciones
      </button>

      {open && (
        <div className="instr-backdrop" onClick={() => setOpen(false)}>
          <div
            className="instr-panel"
            role="dialog"
            aria-modal="true"
            aria-label={`Instrucciones de la tarea ${tarea.num}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="instr-handle" aria-hidden="true" />
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
