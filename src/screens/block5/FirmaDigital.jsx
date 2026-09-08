import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import { capacidadPagoQuincenal, mxn } from '../../domain/finance.js';

// Etapas del proceso de firma digital que corre el CLIENTE en su celular
// (link por WhatsApp/SMS). Aqui solo se refleja el avance para el asesor.
const ETAPAS = [
  { id: 'consent', label: 'Consentimientos', desc: 'Aviso de privacidad y consulta al portal' },
  { id: 'celular', label: 'Verificacion de celular', desc: 'Codigo de 6 digitos' },
  { id: 'selfie', label: 'Selfie', desc: 'Fotografia del rostro' },
  { id: 'ine', label: 'Captura de INE', desc: 'Frente y reverso' },
  { id: 'firma', label: 'Firma de la carta de consulta', desc: 'Firma en pantalla' },
  { id: 'fin', label: 'Proceso completado', desc: 'El cliente cerro la ventana' },
];

const PASO_MS = 3500; // avance simulado por etapa

export default function FirmaDigital() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();

  const enviada = solicitud.auth.firmaClienteEnviada;
  const firmada = solicitud.auth.firmaCliente;

  const [paso, setPaso] = useState(enviada || firmada ? 'tracker' : 'envio');
  const [hechas, setHechas] = useState(firmada ? ETAPAS.length : 0);

  const modo = (() => {
    try {
      return localStorage.getItem('toko.mod') === '1';
    } catch {
      return false;
    }
  })();

  const p = solicitud.datos.personales || {};
  const nombre =
    [p.nombre, p.apellidoPaterno, p.apellidoMaterno].filter(Boolean).join(' ') || 'el cliente';
  const idFiscal = p.rfc || p.curp || '';
  const cap = capacidadPagoQuincenal(solicitud.datos.ingresos?.ingresoMensualComprobable || 0);
  const canal = solicitud.auth.firmaClienteCanal === 'sms' ? 'SMS' : 'WhatsApp';

  const enviarLink = (c) => {
    patch({
      auth: {
        firmaClienteEnviada: true,
        firmaClienteEnviadaISO: new Date().toISOString(),
        firmaClienteCanal: c,
      },
    });
    track('click', { target: 'firma_digital_enviar_link', canal: c });
    setPaso('tracker');
  };

  // Avance automatico del cliente (simulado).
  useEffect(() => {
    if (paso !== 'tracker' || firmada) return;
    if (hechas >= ETAPAS.length) {
      patch({ auth: { firmaCliente: true, firmaClienteISO: new Date().toISOString() } });
      track('click', { target: 'firma_digital_completada' });
      return;
    }
    const t = setTimeout(() => {
      track('click', { target: `firma_digital_etapa_${ETAPAS[hechas].id}` });
      setHechas((n) => n + 1);
    }, PASO_MS);
    return () => clearTimeout(t);
  }, [paso, hechas, firmada]); // eslint-disable-line react-hooks/exhaustive-deps

  const completa = firmada || hechas >= ETAPAS.length;

  if (paso === 'envio') {
    return (
      <Screen>
        <StatusBar />
        <TopBar title="Firma de la solicitud" right={<CerrarSolicitud />} />
        <Content>
          <h1>Se enviara el link de firma al cliente</h1>
          <p className="lead">
            Enviaremos un link al celular registrado del cliente
            {solicitud.auth.celular ? ` (${solicitud.auth.celular})` : ''}. Por favor avisa al
            cliente para que proceda con el proceso de firma. Te notificaremos una vez concluido.
          </p>
        </Content>
        <FooterActions>
          <div className="row" style={{ gap: 8 }}>
            <Button
              variant="ghost"
              className="grow"
              onClick={() => enviarLink('sms')}
              track="firma_digital_sms"
            >
              Via SMS
            </Button>
            <Button
              variant="dark"
              className="grow"
              onClick={() => enviarLink('whatsapp')}
              track="firma_digital_whatsapp"
            >
              Via WhatsApp
            </Button>
          </div>
        </FooterActions>
      </Screen>
    );
  }

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Firma de la solicitud" right={<CerrarSolicitud />} />
      <Content>
        <h1>{completa ? 'Firma completada' : 'El cliente esta firmando'}</h1>
        <p className="lead">
          {completa
            ? 'El cliente completo el proceso de firma digital. Ya puedes enviar la solicitud.'
            : `Link enviado por ${canal}. El avance depende del cliente.`}
        </p>

        <div className="card">
          <div className="row between">
            <div>
              <div style={{ fontWeight: 700 }}>{nombre}</div>
              {idFiscal && <div className="tiny mono">{idFiscal}</div>}
            </div>
            <span className="folio-badge">{solicitud.folio}</span>
          </div>
          {cap > 0 && (
            <div className="row between" style={{ marginTop: 8 }}>
              <span className="small muted">Capacidad disponible</span>
              <span className="small" style={{ fontWeight: 700 }}>
                {mxn(cap)}mxn
              </span>
            </div>
          )}
        </div>

        <div className="tiny" style={{ margin: '18px 0 8px', fontWeight: 700 }}>
          {Math.min(hechas, ETAPAS.length)} de {ETAPAS.length} completados
        </div>
        <ol className="firma-etapas">
          {ETAPAS.map((e, i) => {
            const done = i < hechas;
            const current = i === hechas && !completa;
            return (
              <li key={e.id} className={`firma-etapa${done ? ' done' : ''}${current ? ' current' : ''}`}>
                <span className="fe-ic" aria-hidden="true">
                  {done ? '✓' : current ? <span className="spin-sm" /> : i + 1}
                </span>
                <span className="fe-txt">
                  <span className="fe-label">{e.label}</span>
                  <span className="tiny">{e.desc}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Content>
      <FooterActions>
        {completa ? (
          <Button
            variant="primary"
            onClick={() => navigate('/solicitud')}
            track="firma_digital_volver_hub"
          >
            Volver a la solicitud →
          </Button>
        ) : (
          <>
            <p className="tiny" style={{ textAlign: 'center', margin: '0 0 4px' }}>
              Esperando al cliente…
            </p>
            {modo && (
              <button
                className="btn link"
                onClick={() => setHechas((n) => Math.min(ETAPAS.length, n + 1))}
              >
                avanzar etapa (moderador)
              </button>
            )}
          </>
        )}
      </FooterActions>
    </Screen>
  );
}
