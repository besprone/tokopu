import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import { useStore, progresoSolicitud, tareaCompletada, firmaDigitalAvance } from '../../state/store.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { BLOQUE_TAREA } from '../../flow.js';
import { capacidadPagoQuincenal, FIN_CONFIG, mxn } from '../../domain/finance.js';

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

  // En cuanto identificacion y autenticacion queda lista ya tenemos los datos
  // del cliente (nombre/RFC) para mostrarlos en el hub, igual que en la
  // pantalla de firma digital. La capacidad se calcula con el mismo ingreso
  // demo que usa el Cotizador mientras no haya un ingreso real capturado, asi
  // que coincide con la que se ve/confirma ahi en cuanto se llega a esa
  // pantalla (no hace falta esperar a que se confirme la oferta).
  const p = solicitud.datos.personales || {};
  const nombreCliente = [p.nombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ');
  const idFiscal = p.rfc || p.curp || '';
  const ingresoCliente =
    solicitud.datos.ingresos?.ingresoMensualComprobable || FIN_CONFIG.ingresoMensualDemo;
  const capacidadCliente = capacidadPagoQuincenal(
    ingresoCliente,
    FIN_CONFIG.otrosDescuentosQuincenalDemo
  );

  // El intro de la tarea ocurre ANTES del hub. Aqui cada bloque lleva directo
  // a su pantalla; los bloques siempre estan activos (se puede entrar a
  // revisar o editar aunque ya esten completos o falte otro por hacer).
  const item = (key, label, sub, done, tareaId) => (
    <button
      className={`hub-item${done ? ' done' : ''}`}
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
  const [, setFirmaTick] = useState(0);

  const avanceFirma = firmaDigitalAvance(solicitud);

  // La firma remota del cliente avanza por reloj desde que se envio el link:
  // aunque el asesor no entre al tracker, el hub refresca el paso actual y, al
  // cumplirse el minuto, marca la firma como hecha.
  useEffect(() => {
    if (!mostrarFirma || firmaHecha || !firmaEnviada) return undefined;
    const check = () => {
      if (firmaDigitalAvance(solicitud).completa) {
        patch({ auth: { firmaCliente: true, firmaClienteISO: new Date().toISOString() } });
      } else {
        setFirmaTick((t) => t + 1);
      }
    };
    check();
    const id = setInterval(check, 3000);
    return () => clearInterval(id);
  }, [mostrarFirma, firmaHecha, firmaEnviada, solicitud.auth.firmaClienteEnviadaISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const haceRato = (iso) => {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 45000) return 'recien';
    const min = Math.round(ms / 60000);
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

        {identOk && nombreCliente && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="row between">
              <div>
                <div style={{ fontWeight: 700 }}>{nombreCliente}</div>
                <div className="tiny mono">{idFiscal}</div>
              </div>
              <span className="folio-badge">{solicitud.folio}</span>
            </div>
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="small muted">Capacidad disponible</span>
              <span className="small" style={{ fontWeight: 700 }}>{mxn(capacidadCliente)}</span>
            </div>
          </div>
        )}

        <div className="progress" style={{ marginBottom: 18 }}>
          <div className="track">
            <div className="fill" style={{ width: `${prog.pct}%` }} />
          </div>
          <span className="pctlabel">{prog.pct}%</span>
        </div>

        <div className="stack">
          {item('identificacion', 'Identificacion y autenticacion', null, identOk, 'identificacion')}
          {item(
            'oferta',
            'Seleccionar oferta',
            solicitud.oferta?.monto
              ? `${solicitud.oferta.monto.toLocaleString('es-MX')} mxn / ${solicitud.oferta.nQuincenas} quincenas`
              : null,
            ofertaOk,
            'seleccionar_oferta'
          )}
          {item('informacion', 'Informacion de la solicitud', b.b4.extra, infoOk, 'informacion_solicitud')}
          {item('documentos', 'Documentos', b.b5.extra, docsOk, 'documentos_envio')}
          {mostrarFirma && (
            <button
              className={`hub-item${firmaHecha ? ' done' : ''}`}
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
                      ? `Enviada ${haceRato(solicitud.auth.firmaClienteEnviadaISO)}${
                          avanceFirma.etapa ? ` · ${avanceFirma.etapa.corto}` : ''
                        }`
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
