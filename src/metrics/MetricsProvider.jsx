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
import { ORDEN_GRUPOS, GRUPOS_PRUEBA } from '../flow.js';
import { borrarTodosLosArchivos } from '../state/archivosDB.js';

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
      // Cierra la sesion del participante: la guarda local y la manda al
      // backend, y vacia el cache de archivos (fotos) de esta sesion -no
      // deben quedar disponibles para una prueba siguiente en el mismo
      // dispositivo.
      finalizarSesion: () => {
        enviarSesion(construirSesion({ completa: true }));
        borrarTodosLosArchivos();
      },
      // Marca el fin de un grupo de prueba y decide a donde seguir segun el
      // modo de la sesion:
      //  - remota: siempre pasa por su SEQ (la propia pantalla de SEQ dispara
      //    el task_start del siguiente grupo al continuar).
      //  - moderada: sin SEQ/SUS. Dispara aqui mismo el task_start del
      //    siguiente grupo (o, si era el ultimo, guarda/envia la sesion y
      //    manda a "Gracias" sin pasar por SUS).
      // Devuelve la ruta a la que hay que navegar.
      completarGrupo: (grupoId, datos = {}) => {
        track('task_complete', { tarea: grupoId, resultado: 'exito', ...datos });
        const idx = ORDEN_GRUPOS.indexOf(grupoId);
        const grupo = GRUPOS_PRUEBA[idx];
        const siguienteId = ORDEN_GRUPOS[idx + 1] || null;
        const remota = snapshot.meta?.modoSesion === 'remota';

        if (remota) return `/seq/${grupoId}`;

        if (siguienteId) {
          track('task_start', { tarea: siguienteId });
          return grupo.next;
        }
        enviarSesion(construirSesion({ completa: true }));
        borrarTodosLosArchivos();
        return '/gracias';
      },
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
