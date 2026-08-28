import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, SummaryRow } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, progresoSolicitud } from '../../state/store.jsx';
import { mxn } from '../../domain/finance.js';
import { DEPENDENCIAS } from '../../domain/catalogs.js';

export default function Completada() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();
  const [enviada, setEnviada] = useState(false);
  const prog = progresoSolicitud(solicitud);

  const nombre =
    [solicitud.datos.personales?.nombre, solicitud.datos.personales?.apellidoPaterno]
      .filter(Boolean)
      .join(' ') || 'el cliente';
  const o = solicitud.oferta || {};
  const depNombre =
    DEPENDENCIAS.find((d) => d.id === solicitud.dependencia)?.nombre || solicitud.dependencia;

  const enviar = () => {
    patch({ enviada: true, enviadaISO: new Date().toISOString() });
    setEnviada(true);
    track('click', { target: 'enviar_solicitud_final' });
  };

  const terminar = () => {
    track('task_complete', { tarea: 'documentos_envio', resultado: 'exito' });
    navigate('/seq/documentos_envio', { replace: true });
  };

  if (enviada) {
    return (
      <Screen>
        <StatusBar />
        <TopBar title="Solicitud completada" onBack={null} onClose={false} />
        <div className="success-screen">
          <div className="check">✓</div>
          <h1>Felicidades! La solicitud ya esta en proceso de evaluacion.</h1>
          <p>
            Te notificaremos lo antes posible el analisis de la solicitud. El tiempo medio de
            aprobacion es de 37 minutos.
          </p>
          <div className="card" style={{ marginTop: 12 }}>
            <SummaryRow k="Cliente" v={nombre} />
            <SummaryRow k="Cantidad" v={mxn(o.monto || 0)} />
            <SummaryRow k="Plazo" v={`${o.nQuincenas || 0} quincenas`} />
            <SummaryRow k="Folio" v={solicitud.folio} />
            <SummaryRow k="Dependencia" v={depNombre} />
          </div>
          <div className="grow" />
          <Button variant="primary" onClick={terminar} track="terminar_solicitud">
            Terminar →
          </Button>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Solicitud completa" onClose={() => navigate('/solicitud')} onBack={null} />
      <Content>
        <h1>Solicitud completa</h1>
        <div className="progress" style={{ margin: '10px 0 18px' }}>
          <div className="track">
            <div className="fill" style={{ width: `${prog.pct}%` }} />
          </div>
          <span className="pctlabel">{prog.pct}%</span>
        </div>

        <div className="card">
          <SummaryRow k="Solicitante" v={nombre} />
          <SummaryRow k="Folio" v={solicitud.folio} />
          <SummaryRow k="Monto a dispersar" v={mxn(o.resumen?.montoDispersado ?? o.monto ?? 0)} />
          <SummaryRow k="Pago quincenal" v={mxn(o.resumen?.pagoQuincenal ?? 0)} />
          <SummaryRow k="Plazo" v={`${o.nQuincenas ?? 0} quincenas`} />
        </div>

        <h2>Bloques</h2>
        <div className="card">
          {prog.bloques.map((b) => (
            <div className="summary-row" key={b.id}>
              <span className="k">{b.label}</span>
              <span className="v" style={{ color: b.pct >= 80 ? 'var(--ok)' : 'var(--ink-3)' }}>
                {b.pct >= 80 ? '✓' : `${b.pct}%`}
              </span>
            </div>
          ))}
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" onClick={enviar} track="completada_enviar">
          Enviar solicitud →
        </Button>
      </FooterActions>
    </Screen>
  );
}
