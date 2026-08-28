import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, MetaBar } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore } from '../state/store.jsx';

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
    <Screen meta>
      <MetaBar label="Prueba de usabilidad" />
      <div className="content" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>
          <span className="tiny">Prueba de usabilidad</span>
          <h1 onClick={golpeTitulo} style={{ cursor: 'default', userSelect: 'none' }}>
            Toko · Credito Maestro
          </h1>
          <p className="lead">
            Vas a levantar una solicitud de credito por descuento via nomina, de principio a
            fin. Trabaja como lo harias normalmente y piensa en voz alta. Al terminar cada
            tarea responderas una pregunta corta (SEQ) y, al final, un cuestionario de 10
            items (SUS).
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
            Se registra tu nombre, tus respuestas y tu recorrido para el analisis interno del
            equipo de UX. Al iniciar se descarta cualquier sesion previa en este dispositivo.
          </div>
        </div>
      </div>

      <div className="footer-actions">
        <button className="btn primary" disabled={!valido} onClick={iniciar}>
          Iniciar prueba →
        </button>
      </div>
    </Screen>
  );
}
