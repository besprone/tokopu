import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, GuardarSalir } from '../../components/ui.jsx';
import { useStore, progresoSolicitud, tareaCompletada } from '../../state/store.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { BLOQUE_TAREA } from '../../flow.js';

export default function SolicitudHub() {
  const navigate = useNavigate();
  const { solicitud } = useStore();
  const { track } = useMetrics();
  const prog = progresoSolicitud(solicitud);

  const b = Object.fromEntries(prog.bloques.map((x) => [x.id, x]));
  const identOk = tareaCompletada(solicitud, 'identificacion');
  const ofertaOk = tareaCompletada(solicitud, 'seleccionar_oferta');
  const infoOk = tareaCompletada(solicitud, 'informacion_solicitud');
  const enviada = solicitud.enviada;
  const docsOk = b.b5.pct >= 80;

  // El intro de la tarea ocurre ANTES del hub. Aqui cada bloque lleva directo
  // a su pantalla; solo el de la tarea en curso esta habilitado, y una tarea
  // ya completada queda bloqueada.
  const item = (key, label, sub, done, tareaId, prereq) => (
    <button
      className="hub-item"
      disabled={!prereq || done}
      onClick={() => {
        track('click', { target: `hub_${key}` });
        navigate(BLOQUE_TAREA[tareaId]);
      }}
    >
      <span>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div className="sub">{sub}</div>}
      </span>
      <span className={done ? 'badge-check' : 'muted'}>{done ? '✓' : '+'}</span>
    </button>
  );

  const puedeEnviar = identOk && ofertaOk && infoOk && docsOk;

  return (
    <Screen>
      <StatusBar />
      <TopBar right={<GuardarSalir />} />
      <Content>
        <h1>Inicia la solicitud de credito</h1>
        <p className="lead">
          Procede a completar los bloques de informacion. El proceso completo podra tardar
          hasta 15 minutos.
        </p>

        <div className="progress" style={{ marginBottom: 18 }}>
          <div className="track">
            <div className="fill" style={{ width: `${prog.pct}%` }} />
          </div>
          <span className="pctlabel">{prog.pct}%</span>
        </div>

        <div className="stack">
          {item('identificacion', 'Identificacion y autenticacion', null, identOk, 'identificacion', true)}
          {item(
            'oferta',
            'Seleccionar oferta',
            solicitud.oferta?.monto
              ? `${solicitud.oferta.monto.toLocaleString('es-MX')} mxn / ${solicitud.oferta.nQuincenas} quincenas`
              : null,
            ofertaOk,
            'seleccionar_oferta',
            identOk
          )}
          {item('informacion', 'Informacion de la solicitud', b.b4.extra, infoOk, 'informacion_solicitud', ofertaOk)}
          {item('documentos', 'Documentos', b.b5.extra, enviada, 'documentos_envio', infoOk)}
          {item(
            'firma',
            'Firma de la solicitud',
            solicitud.tipoFirma === 'autografa' ? 'Firma autografa' : 'Firma digital',
            enviada,
            'documentos_envio',
            infoOk
          )}
        </div>
      </Content>
      <FooterActions>
        <Button
          variant="primary"
          disabled={!puedeEnviar}
          onClick={() => navigate('/completada')}
          track="hub_enviar_solicitud"
        >
          Enviar solicitud →
        </Button>
      </FooterActions>
    </Screen>
  );
}
