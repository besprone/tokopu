import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import { useStore, progresoSolicitud, tareaCompletada, firmaDigitalAvance } from '../../state/store.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { BLOQUE_TAREA } from '../../flow.js';

export default function SolicitudHub() {
  const navigate = useNavigate();
  const { solicitud, patch } = useStore();
  const { track } = useMetrics();
  const prog = progresoSolicitud(solicitud);

  const b = Object.fromEntries(prog.bloques.map((x) => [x.id, x]));
  const identOk = tareaCompletada(solicitud, 'identificacion');
  const ofertaOk = tareaCompletada(solicitud, 'seleccionar_oferta');
  const infoOk = tareaCompletada(solicitud, 'informacion_solicitud');
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

  // Firma autografa: no hay bloque de firma en la app (se firma en papel).
  // Solo el flujo digital tiene bloque de firma (link remoto al cliente).
  const mostrarFirma = solicitud.tipoFirma === 'digital';
  const firmaEnviada = solicitud.auth.firmaClienteEnviada;
  const firmaHecha = solicitud.auth.firmaCliente;

  // La firma remota del cliente avanza por reloj desde que se envio el link:
  // aunque el asesor no entre al tracker, al cumplirse el minuto se marca aqui.
  useEffect(() => {
    if (!mostrarFirma || firmaHecha || !firmaEnviada) return undefined;
    const check = () => {
      if (firmaDigitalAvance(solicitud).completa) {
        patch({ auth: { firmaCliente: true, firmaClienteISO: new Date().toISOString() } });
      }
    };
    check();
    const id = setInterval(check, 2000);
    return () => clearInterval(id);
  }, [mostrarFirma, firmaHecha, firmaEnviada, solicitud.auth.firmaClienteEnviadaISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const haceRato = (iso) => {
    if (!iso) return '';
    const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    return min < 60 ? `hace ${min} min` : `hace ${Math.round(min / 60)} h`;
  };
  const fechaCorta = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}h`;
  };

  const puedeEnviar =
    identOk && ofertaOk && infoOk && docsOk && (!mostrarFirma || firmaHecha);

  // El resumen previo a enviar ahora es este hub. "Enviar solicitud" marca la
  // solicitud como enviada y muestra el feedback (/completada). Desde ahi
  // "Terminar" cierra la ultima tarea. (Flujo autografa; el digital se retoma.)
  const enviar = () => {
    if (!solicitud.enviada) {
      patch({ enviada: true, enviadaISO: new Date().toISOString() });
    }
    track('click', { target: 'hub_enviar_solicitud' });
    navigate('/completada');
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar right={<CerrarSolicitud />} />
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
          {item('documentos', 'Documentos', b.b5.extra, docsOk, 'documentos_envio', infoOk)}
          {mostrarFirma && (
            <button
              className="hub-item"
              disabled={!docsOk || firmaHecha}
              onClick={() => {
                track('click', { target: 'hub_firma_digital' });
                navigate('/firma-digital');
              }}
            >
              <span>
                <div style={{ fontWeight: 600 }}>Firma de la solicitud</div>
                <div className="sub">
                  {firmaHecha
                    ? `Firmado ${fechaCorta(solicitud.auth.firmaClienteISO)}`
                    : firmaEnviada
                      ? `Enviada ${haceRato(solicitud.auth.firmaClienteEnviadaISO)}`
                      : 'Firma digital'}
                </div>
              </span>
              <span className={firmaHecha ? 'badge-check' : 'muted'}>
                {firmaHecha ? (
                  '✓'
                ) : firmaEnviada ? (
                  <span className="spin-sm" aria-label="En proceso" />
                ) : (
                  '+'
                )}
              </span>
            </button>
          )}
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" disabled={!puedeEnviar} onClick={enviar} track="hub_enviar_solicitud">
          Enviar solicitud →
        </Button>
      </FooterActions>
    </Screen>
  );
}
