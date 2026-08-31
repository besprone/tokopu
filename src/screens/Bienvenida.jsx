import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaSheet } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore } from '../state/store.jsx';
import Home from './block1/Home.jsx';

export default function Bienvenida() {
  const navigate = useNavigate();
  const { resetSession, track } = useMetrics();
  const { reset } = useStore();
  const [nombre, setNombre] = useState('');
  const [tocado, setTocado] = useState(false);
  const taps = useRef([]);

  const valido = nombre.trim().length >= 3;

  const iniciar = () => {
    if (!valido) {
      setTocado(true);
      return;
    }
    // Limpia TODO: estado del store en memoria (no solo localStorage) para que
    // el hub arranque vacio, y la sesion de metricas.
    reset();
    localStorage.removeItem('toko.solicitud.v1');
    resetSession({ participante: nombre.trim() });
    track('click', { target: 'iniciar_prueba' });
    navigate('/tarea/iniciar_solicitud');
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
          esperas que pase y lo que te confunde. Al terminar cada tarea te haremos una
          pregunta rápida, y al final unas preguntas de cierre.
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
