import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  initSession,
  resetSession,
  track,
  subscribe,
  getEvents,
  getMeta,
  descargarSesion,
  exportarJSON,
  susResultado,
  tareas,
  construirSesion,
  enviarSesion,
  flushPendientes,
  enviarParcialAlOcultar,
} from './track.js';

const MetricsCtx = createContext(null);

export function MetricsProvider({ children }) {
  const [snapshot, setSnapshot] = useState({ events: [], meta: null });
  const location = useLocation();
  const prevPath = useRef(null);

  useEffect(() => {
    initSession();
    setSnapshot({ events: getEvents(), meta: getMeta() });
    const unsub = subscribe((s) => setSnapshot({ events: s.events.slice(), meta: s.meta }));
    flushPendientes(); // reintenta sesiones que no llegaron al backend

    // Sesion parcial al ocultar/cerrar la pagina -> no se pierden pruebas
    // abandonadas en otro dispositivo.
    const onHidden = () => {
      if (document.visibilityState === 'hidden') enviarParcialAlOcultar();
    };
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', enviarParcialAlOcultar);

    return () => {
      unsub();
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', enviarParcialAlOcultar);
    };
  }, []);

  // route_change automatico
  useEffect(() => {
    const path = location.pathname + location.search;
    if (prevPath.current !== path) {
      track('route_change', { from: prevPath.current, to: path });
      prevPath.current = path;
    }
  }, [location]);

  const value = useMemo(
    () => ({
      ...snapshot,
      track,
      resetSession: (extra) => resetSession(extra),
      descargarSesion,
      exportarJSON,
      susResultado,
      tareas,
      // Cierra la sesion del participante: la guarda local y la manda al backend.
      finalizarSesion: () => enviarSesion(construirSesion({ completa: true })),
    }),
    [snapshot]
  );

  return <MetricsCtx.Provider value={value}>{children}</MetricsCtx.Provider>;
}

export function useMetrics() {
  const ctx = useContext(MetricsCtx);
  if (!ctx) throw new Error('useMetrics fuera de MetricsProvider');
  return ctx;
}

// Hook util para instrumentar tareas (task_start / task_complete + navegacion a SEQ)
export function useTask() {
  return {
    start: (tarea, datos = {}) => track('task_start', { tarea, ...datos }),
    complete: (tarea, resultado = 'exito', datos = {}) =>
      track('task_complete', { tarea, resultado, ...datos }),
  };
}
