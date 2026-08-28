import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button } from '../components/ui.jsx';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { SUS_ITEMS, SUS_ESCALA } from '../flow.js';

export default function SusScreen() {
  const navigate = useNavigate();
  const { track, finalizarSesion } = useMetrics();
  const [resp, setResp] = useState({});
  const [idx, setIdx] = useState(0);

  const total = SUS_ITEMS.length;
  const contestadas = Object.keys(resp).length;
  const listo = contestadas === total;

  const set = (i, val) => setResp((r) => ({ ...r, [i]: val }));

  const enviar = () => {
    if (!listo) return;
    for (let i = 1; i <= total; i++) {
      track('sus_answer', { item: i, score: resp[i], enunciado: SUS_ITEMS[i - 1] });
    }
    finalizarSesion(); // guarda local + envia al backend (fire and forget)
    navigate('/gracias', { replace: true });
  };

  const actual = idx; // index 0..9
  const item = SUS_ITEMS[actual];

  return (
    <Screen meta>
      <MetaBar label="Cuestionario final" />
      <Content>
        <span className="tiny">
          Cuestionario SUS · {actual + 1} de {total}
        </span>
        <h1 style={{ margintop: 8 }}>Tu experiencia general</h1>
        <p className="lead">
          Marca que tanto estas de acuerdo con cada afirmacion sobre la app Toko.
        </p>

        <div className="card">
          <strong>{item}</strong>
          <div className="likert">
            {SUS_ESCALA.map((lab, k) => {
              const val = k + 1;
              return (
                <button
                  key={val}
                  className={resp[actual + 1] === val ? 'sel' : ''}
                  onClick={() => set(actual + 1, val)}
                >
                  {val}. {lab}
                </button>
              );
            })}
          </div>
        </div>

        <div className="row between" style={{ marginTop: 16 }}>
          <Button
            variant="ghost"
            className="sm"
            disabled={actual === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
          >
            ← Anterior
          </Button>
          <span className="tiny">
            {contestadas}/{total} contestadas
          </span>
          <Button
            variant="ghost"
            className="sm"
            disabled={actual === total - 1 || resp[actual + 1] == null}
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
          >
            Siguiente →
          </Button>
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" disabled={!listo} onClick={enviar} track="sus_enviar">
          {listo ? 'Ver resultados' : `Faltan ${total - contestadas} respuestas`}
        </Button>
      </FooterActions>
    </Screen>
  );
}
