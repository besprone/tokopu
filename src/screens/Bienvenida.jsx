import React, { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MetaSheet } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore } from '../state/store.jsx';
import { borrarTodosLosArchivos } from '../state/archivosDB.js';
import { ORDEN_GRUPOS } from '../flow.js';
import Home from './block1/Home.jsx';

export default function Bienvenida() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { resetSession, track } = useMetrics();
  const { reset } = useStore();
  const [nombre, setNombre] = useState('');
  const [tocado, setTocado] = useState(false);
  const taps = useRef([]);

  const valido = nombre.trim().length >= 3;
  // Sesion moderada por default (el facilitador hace las preguntas en vivo);
  // para una prueba remota autoadministrada se manda un link con ?modo=remota.
  const modoSesion = sp.get('modo') === 'remota' ? 'remota' : 'moderada';

  const iniciar = () => {
    if (!valido) {
      setTocado(true);
      return;
    }
    // Limpia TODO: estado del store en memoria (no solo localStorage) para que
    // el hub arranque vacio, la sesion de metricas, y los archivos (fotos)
    // que hubiera guardado una prueba anterior en este mismo dispositivo.
    reset();
    localStorage.removeItem('toko.solicitud.v1');
    borrarTodosLosArchivos();
    resetSession({ participante: nombre.trim(), modoSesion });
    track('click', { target: 'iniciar_prueba' });
    if (modoSesion === 'remota') {
      // Remota: nadie va a decir el escenario en voz, asi que se muestra
      // antes de arrancar. El cronometro de la tarea 1 empieza hasta que
      // el asesor da "Empezar tarea" ahi.
      navigate(`/tarea/${ORDEN_GRUPOS[0]}`);
    } else {
      // Moderada: el facilitador dice el escenario en voz. El cronometro de
      // la tarea 1 arranca ya, directo al dashboard.
      track('task_start', { tarea: ORDEN_GRUPOS[0] });
      navigate('/inicio');
    }
  };

  // Gesto oculto para el moderador: 5 taps rapidos en el titulo -> /moderador
  // (no salta el login).
  const golpeTitulo = () => {
    const t = Date.now();
    taps.current = [...taps.current.filter((x) => t - x < 1800), t];
    if (taps.current.length >= 5) {
      taps.current = [];
      navigate('/moderador');
    }
  };

  return (
    <>
      <Home />
      <MetaSheet label="Prueba de usabilidad">
        <h1 onClick={golpeTitulo} style={{ cursor: 'default', userSelect: 'none', marginTop: 0 }}>
          Toko · Crédito Maestro
        </h1>
        <p className="lead">
          Gracias por tu tiempo. Vas a levantar una solicitud de crédito por descuento vía
          nómina, de principio a fin, como lo harías con un cliente real.
        </p>
        <p className="lead">
          Importante: evaluamos la app, no a ti. No hay respuestas correctas ni incorrectas;
          si algo se traba o confunde, eso es justo lo que nos sirve.
        </p>
        <p className="lead">
          Trabaja como lo harías normalmente y piensa en voz alta: di lo que buscas, lo que
          esperas que pase y lo que te confunde.
          {modoSesion === 'remota'
            ? ' Al terminar cada tarea te haremos una pregunta rápida, y al final unas preguntas de cierre.'
            : ' Quien te acompaña te hará algunas preguntas mientras avanzas.'}
        </p>

        <div className={`field${tocado && !valido ? ' invalid' : ''}`}>
          <label htmlFor="nombre">Nombre completo del participante</label>
          <input
            id="nombre"
            value={nombre}
            autoComplete="off"
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setTocado(true)}
            placeholder="Nombre y apellidos"
          />
          {tocado && !valido && <div className="err">Escribe el nombre completo para continuar.</div>}
        </div>

        <div className="callout info">
          Se registra tu nombre, tus respuestas y tu recorrido para el análisis interno del
          equipo de UX. Al iniciar se descarta cualquier sesión previa en este dispositivo.
        </div>

        <button className="btn primary" disabled={!valido} onClick={iniciar}>
          Iniciar prueba →
        </button>
      </MetaSheet>
    </>
  );
}
