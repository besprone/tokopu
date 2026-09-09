import React, { useEffect, useRef, useState } from 'react';
import { Screen, StatusBar, TopBar, Content, FooterActions, Button, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { AUTENTICACION_REMOTA } from '../../domain/catalogs.js';

// Espera de la autenticacion + biometria del cliente en su propio celular
// (link por WhatsApp). El asesor ve el avance por etapas; para el prototipo la
// simulacion corre por tiempo (AUTENTICACION_REMOTA.duracionMs).
export const OTP_ESPERA_MS = AUTENTICACION_REMOTA.duracionMs;

function etapasRemotas() {
  const e = [
    { id: 'consent', label: 'Consentimientos', desc: 'Aviso de privacidad y consulta al portal' },
    { id: 'otp', label: 'Verificacion de celular', desc: 'Codigo de 6 digitos' },
    { id: 'selfie', label: 'Selfie', desc: 'Fotografia del rostro' },
  ];
  if (AUTENTICACION_REMOTA.subeINE) {
    e.push({ id: 'ine', label: 'Captura de INE', desc: 'Frente y reverso' });
  }
  e.push({ id: 'firma', label: 'Firma de la carta de consulta', desc: 'Firma en pantalla' });
  return e;
}

export default function OtpEspera({ onManual, onListo, onBack }) {
  const { track } = useMetrics();
  const ETAPAS = etapasRemotas();
  const PASO_MS = OTP_ESPERA_MS / ETAPAS.length;

  const [hechas, setHechas] = useState(0);
  const cerrado = useRef(false);
  const completa = hechas >= ETAPAS.length;

  const modo = (() => {
    try {
      return localStorage.getItem('toko.mod') === '1';
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    track('click', { target: 'otp_espera_inicio', duracionMs: OTP_ESPERA_MS });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Avance simulado del cliente, etapa por etapa.
  useEffect(() => {
    if (cerrado.current) return undefined;
    if (hechas >= ETAPAS.length) {
      cerrado.current = true;
      track('click', { target: 'otp_autenticado_remoto' });
      const t = setTimeout(() => onListo(), 900);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      track('click', { target: `otp_remoto_etapa_${ETAPAS[hechas].id}` });
      setHechas((n) => n + 1);
    }, PASO_MS);
    return () => clearTimeout(t);
  }, [hechas]); // eslint-disable-line react-hooks/exhaustive-deps

  const saltar = () => {
    if (cerrado.current) return;
    track('click', { target: 'otp_espera_saltar_mod' });
    setHechas(ETAPAS.length);
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Autenticacion" onBack={onBack} right={<CerrarSolicitud />} />
      <Content>
        <h1>{completa ? 'El cliente completo la autenticacion' : 'El cliente esta autenticando su celular'}</h1>
        <p className="lead">
          {completa
            ? 'Recibimos su verificacion, biometria y firma. Revisa los datos y continua.'
            : 'Enviamos una liga por WhatsApp al cliente. Desde su telefono valida el codigo y completa el proceso. El tiempo depende del cliente.'}
        </p>

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
        {!completa && (
          <>
            <p className="tiny" style={{ margin: '0 0 4px' }}>
              Si el cliente esta contigo en sucursal, puedes hacerlo en este dispositivo.
            </p>
            <Button variant="ghost" onClick={onManual} track="ident_otp_manual">
              Continuar captura manual
            </Button>
            {modo && (
              <button className="btn link" onClick={saltar}>
                saltar espera (moderador)
              </button>
            )}
          </>
        )}
      </FooterActions>
    </Screen>
  );
}
