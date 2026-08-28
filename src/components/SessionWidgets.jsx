import React, { useEffect, useState } from 'react';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { resumenEventos, tareas, susResultado } from '../metrics/track.js';

const MOD_KEY = 'toko.mod';

// Herramientas del moderador (Marcar momento / panel de sesion).
// Ocultas por defecto: el participante no las ve. Se activan agregando
// ?mod=1 a la URL una vez (se recuerda); ?mod=0 las vuelve a ocultar.
// La grabacion de eventos NO depende de este componente: siempre ocurre.
export default function SessionWidgets() {
  const { events, meta, track, descargarSesion, resetSession } = useMetrics();
  const [panel, setPanel] = useState(false);
  const [flagOpen, setFlagOpen] = useState(false);
  const [nota, setNota] = useState('');
  const [modo, setModo] = useState(false);

  useEffect(() => {
    try {
      const p = new URLSearchParams(window.location.search);
      if (p.has('mod')) {
        localStorage.setItem(MOD_KEY, p.get('mod') === '0' ? '0' : '1');
      }
      setModo(localStorage.getItem(MOD_KEY) === '1');
    } catch {
      setModo(false);
    }
  }, []);

  if (!modo) return null;

  const guardarFlag = () => {
    track('observer_flag', { nota: nota.trim() || '(sin nota)' });
    setNota('');
    setFlagOpen(false);
  };

  const porTipo = resumenEventos();
  const tareaMap = tareas();
  const sus = susResultado();

  return (
    <>
      <div className="sess-tab">
        <button className="flag" onClick={() => setFlagOpen(true)} title="Marcar momento de interes">
          ⚑ Marcar
        </button>
        <button onClick={() => setPanel(true)} title="Sesion de prueba">
          Sesion · {events.length}
        </button>
      </div>

      {flagOpen && (
        <div className="panel-backdrop" onClick={() => setFlagOpen(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Marcar momento de interes</h2>
            <p className="small muted">
              Nota del observador. Se registra como <code>observer_flag</code> con timestamp.
            </p>
            <textarea
              className="control"
              style={{ width: '100%' }}
              rows={3}
              value={nota}
              placeholder="Ej. El participante dudo al elegir el plazo"
              onChange={(e) => setNota(e.target.value)}
            />
            <div className="row" style={{ marginTop: 12, gap: 8 }}>
              <button className="btn ghost" onClick={() => setFlagOpen(false)}>
                Cancelar
              </button>
              <button className="btn primary" onClick={guardarFlag}>
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {panel && (
        <div className="panel-backdrop" onClick={() => setPanel(false)}>
          <div className="panel" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>Sesion de prueba</h2>
              <button className="btn ghost sm" onClick={() => setPanel(false)}>
                Cerrar
              </button>
            </div>
            <p className="tiny" style={{ marginTop: 4 }}>
              ID {meta?.sessionId?.slice(0, 8)} · inicio{' '}
              {meta?.startedAtISO ? new Date(meta.startedAtISO).toLocaleString('es-MX') : '—'}
            </p>

            <h3 className="small" style={{ marginBottom: 4 }}>
              Eventos ({events.length})
            </h3>
            <div className="tiny mono" style={{ whiteSpace: 'pre-wrap' }}>
              {Object.entries(porTipo)
                .map(([k, v]) => `${k}: ${v}`)
                .join('   ')}
            </div>

            <h3 className="small" style={{ marginBottom: 4, marginTop: 14 }}>
              Tareas
            </h3>
            <div className="stack" style={{ gap: 6 }}>
              {Object.keys(tareaMap).length === 0 && (
                <span className="tiny muted">Sin tareas iniciadas.</span>
              )}
              {Object.entries(tareaMap).map(([t, d]) => (
                <div key={t} className="tiny">
                  <strong>{t}</strong> — {d.resultado || 'en curso'}
                  {d.duracionMs != null && ` · ${(d.duracionMs / 1000).toFixed(1)}s`}
                  {d.seq != null && ` · SEQ ${d.seq}/7`}
                  {d.errores ? ` · ${d.errores} errores` : ''}
                </div>
              ))}
            </div>

            {sus.completo && (
              <p className="small" style={{ marginTop: 12 }}>
                <strong>SUS: {sus.puntaje}</strong> / 100 — {sus.interpretacion}
              </p>
            )}

            <div className="stack" style={{ marginTop: 16 }}>
              <button
                className="btn primary"
                onClick={() => descargarSesion()}
              >
                Descargar sesion actual (JSON + CSV)
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  setPanel(false);
                  location.href = '/moderador';
                }}
              >
                Ver todas las sesiones
              </button>
              <button
                className="btn ghost"
                onClick={() => {
                  if (
                    confirm(
                      'Reiniciar la sesion? Se borran los eventos y los datos de la solicitud guardados.'
                    )
                  ) {
                    resetSession();
                    localStorage.removeItem('toko.solicitud.v1');
                    location.href = '/';
                  }
                }}
              >
                Reiniciar sesion de prueba
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
