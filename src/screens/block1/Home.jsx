import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, AppHeader, BottomNav } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, hayBorrador } from '../../state/store.jsx';

const PROMOS = [
  {
    t: 'promocion navidad',
    d: 'Consigue mas de 4 solicitudes este mes y recibiras 1,000mxn para cada solicitud extra.',
  },
  {
    t: 'promocion bienvenida',
    d: 'Activa a un cliente nuevo y obten un bono adicional en tu siguiente corte.',
  },
];

export default function Home() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud } = useStore();

  const stats = [
    { n: '12', l: 'Totales' },
    { n: String(3 + (hayBorrador(solicitud) ? 1 : 0)), l: 'Guardadas' },
    { n: '1', l: 'Regularizar' },
    { n: '12', l: 'Aprobadas' },
  ];

  return (
    <Screen>
      <StatusBar />
      <AppHeader />
      <div className="content" style={{ paddingTop: 8, paddingBottom: 96 }}>
        <h1 style={{ marginBottom: 16 }}>Hola, Gerardo!</h1>

        <div className="row between" style={{ marginBottom: 10 }}>
          <strong>Tus solicitudes</strong>
          <button
            className="btn link"
            style={{ padding: 0 }}
            onClick={() => {
              track('click', { target: 'home_ver_todas' });
              navigate('/solicitudes');
            }}
          >
            ver todas
          </button>
        </div>

        <div className="stat-grid">
          {stats.map((s) => (
            <button
              key={s.l}
              className="stat"
              onClick={() => {
                track('click', { target: `home_stat_${s.l.toLowerCase()}` });
                navigate('/solicitudes');
              }}
            >
              <span className="arrow">→</span>
              <div className="n">{s.n}</div>
              <div className="l">{s.l}</div>
            </button>
          ))}
        </div>

        <div className="row between" style={{ margin: '22px 0 10px' }}>
          <strong>Promociones y campanas</strong>
          <button className="btn link" style={{ padding: 0 }} onClick={() => track('click', { target: 'home_promos_ver_todas' })}>
            ver todas
          </button>
        </div>

        <div className="promo-scroll">
          {PROMOS.map((p, i) => (
            <div className="promo-card" key={i}>
              <div className="promo-photo" />
              <div className="promo-body">
                <h3>{p.t}</h3>
                <p>{p.d}</p>
                <button
                  className="btn ghost sm"
                  onClick={() => track('click', { target: 'promo_activar', promo: p.t })}
                >
                  Activar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <BottomNav active="home" />
    </Screen>
  );
}
