import React, { useState } from 'react';
import { Screen, StatusBar, AppHeader, BottomNav, NewRequestFab } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';

const STATS = [
  { id: 'totales', n: '12', l: 'Totales' },
  { id: 'guardadas', n: '3', l: 'Guardadas' },
  { id: 'regularizar', n: '1', l: 'Regularizar' },
  { id: 'aprobadas', n: '12', l: 'Aprobadas' },
];

const SOLICITUDES = [
  { dia: 'Hoy', n: 'Sara Fernandez', d: '45,000mxn / 22 semanas', st: 'evaluacion', label: 'En evaluacion' },
  { dia: 'Hoy', n: 'Oliver Fernandez', d: '43,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Gerardo Pina', d: '183,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Elisa Manuel Rodriguez', d: '81,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Alejandra Lanzalde', d: '83,000mxn / 120 semanas', st: 'rechazada', label: 'Rechazada' },
  { dia: '22 de agosto', n: 'Marisa Sami', d: '83,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: '22 de agosto', n: 'Silverio Diaz', d: '33,000mxn / 22 semanas', st: 'aprobada', label: 'Aprobada' },
];

export default function Solicitudes() {
  const { track } = useMetrics();
  const [sel, setSel] = useState('totales');
  let dia = null;

  return (
    <Screen>
      <StatusBar />
      <AppHeader />
      <div className="content" style={{ paddingTop: 8, paddingBottom: 96 }}>
        <strong style={{ display: 'block', marginBottom: 10 }}>Tus solicitudes</strong>

        <div className="stat-grid">
          {STATS.map((s) => (
            <button
              key={s.id}
              className={`stat${sel === s.id ? ' sel' : ''}`}
              onClick={() => {
                setSel(s.id);
                track('click', { target: `solicitudes_filtro_${s.id}` });
              }}
            >
              <span className="arrow">→</span>
              <div className="n">{s.n}</div>
              <div className="l">{s.l}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 18 }}>
          {SOLICITUDES.map((r, i) => {
            const header = r.dia !== dia ? ((dia = r.dia), r.dia) : null;
            return (
              <div key={i}>
                {header && (
                  <div
                    style={{
                      marginTop: i ? 18 : 4,
                      marginBottom: 8,
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {header}
                  </div>
                )}
                <div className="card" style={{ padding: '12px 14px', marginBottom: 8 }}>
                  <div className="row between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{r.n}</div>
                      <div className="tiny">{r.d}</div>
                      <div className={`small st ${r.st}`} style={{ fontWeight: 600 }}>
                        {r.label}
                      </div>
                    </div>
                    <span className="muted">→</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <NewRequestFab />
      <BottomNav active="list" />
    </Screen>
  );
}
