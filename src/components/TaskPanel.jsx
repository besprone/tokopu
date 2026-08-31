import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MetaSheet } from './ui.jsx';
import { TAREAS, ORDEN_TAREAS, tareaDeRuta } from '../flow.js';
import { useStore, tareaCompletada } from '../state/store.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';

// Instrucciones de la tarea. Disparador: un FAB de texto "Instrucciones" fijo a
// la pantalla (fuera del marco). Al abrir, muestra el MISMO sheet oscuro que el
// intro de tarea (modal en desktop / bottom sheet en movil): label + titulo +
// escenario, y "Que observar" con ?mod=1. Es cerrable — el FAB lo reabre.
export default function TaskPanel() {
  const location = useLocation();
  const { solicitud } = useStore();
  const { track } = useMetrics();
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

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!tarea) return null;

  const abrir = () => {
    setOpen(true);
    track('sheet_open', { tipo: 'instrucciones', tarea: id });
  };

  return (
    <>
      <button
        className="instrucciones-fab"
        onClick={abrir}
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
        <MetaSheet label={`Tarea ${tarea.num} de 5`} onClose={() => setOpen(false)}>
          <h1>{tarea.titulo}</h1>
          <div className="card">
            <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Escenario
            </div>
            <p className="small" style={{ margin: '4px 0 0' }}>{tarea.escenario}</p>
          </div>

          {modo && (
            <div className="card">
              <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Que observar (facilitador)
              </div>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {tarea.observar.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </MetaSheet>
      )}
    </>
  );
}
