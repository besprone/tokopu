import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, AppHeader, BottomNav } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, hayBorrador, progresoSolicitud } from '../../state/store.jsx';

const SOLICITUDES = [
  { dia: 'Hoy', n: 'Sara Fernandez', d: '45,000mxn / 22 semanas', st: 'evaluacion', label: 'En evaluacion' },
  { dia: 'Hoy', n: 'Oliver Fernandez', d: '43,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Ricardo Pina', d: '183,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Elisa Manuel Rodriguez', d: '81,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: 'Ayer', n: 'Alejandra Lanzalde', d: '83,000mxn / 120 semanas', st: 'rechazada', label: 'Rechazada' },
  { dia: '22 de agosto', n: 'Marisa Sami', d: '83,000mxn / 96 semanas', st: 'aprobada', label: 'Aprobada' },
  { dia: '22 de agosto', n: 'Silverio Diaz', d: '33,000mxn / 22 semanas', st: 'aprobada', label: 'Aprobada' },
];

export default function Solicitudes() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud } = useStore();
  const [sel, setSel] = useState('totales');
  let dia = null;

  const borrador = hayBorrador(solicitud);
  const p = solicitud.datos.personales || {};
  const nombreBorrador =
    [p.nombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ') ||
    'Solicitud en proceso';
  const montoBorrador = solicitud.oferta?.monto;
  const pctBorrador = progresoSolicitud(solicitud).pct;

  const stats = [
    { id: 'totales', n: '12', l: 'Totales' },
    { id: 'guardadas', n: String(3 + (borrador ? 1 : 0)), l: 'Guardadas' },
    { id: 'regularizar', n: '1', l: 'Regularizar' },
    { id: 'aprobadas', n: '12', l: 'Aprobadas' },
  ];

  const reanudar = () => {
    track('click', { target: 'reanudar_solicitud', pct: pctBorrador });
    navigate('/solicitud');
  };

  return (
    <Screen>
      <StatusBar />
      <AppHeader />
      <div className="content" style={{ paddingTop: 8, paddingBottom: 96 }}>
        <strong style={{ display: 'block', marginBottom: 10 }}>Tus solicitudes</strong>

        <div className="stat-grid">
          {stats.map((s) => (
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

        {borrador && (
          <div style={{ marginTop: 18 }}>
            <div style={{ marginBottom: 8, fontWeight: 700, fontSize: 14 }}>Guardadas</div>
            <button
              className="card"
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 8 }}
              onClick={reanudar}
            >
              <div className="row between">
                <div>
                  <div style={{ fontWeight: 600 }}>{nombreBorrador}</div>
                  <div className="tiny">
                    {montoBorrador ? `${montoBorrador.toLocaleString('es-MX')}mxn · ` : ''}
                    {pctBorrador}% completado
                  </div>
                  <div className="small st evaluacion" style={{ fontWeight: 600 }}>
                    Continuar solicitud
                  </div>
                </div>
                <span className="muted">→</span>
              </div>
            </button>
          </div>
        )}

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
      <BottomNav active="list" />
    </Screen>
  );
}
