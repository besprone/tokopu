import React, { useEffect, useState } from 'react';
import { Screen, StatusBar, TopBar, Content, FooterActions, Button, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import { AUTENTICACION_REMOTA } from '../../domain/catalogs.js';

// Espera de la autenticacion + biometria del cliente en su propio celular
// (link por WhatsApp). El avance se deriva del reloj (auth.authRemotaISO), asi
// se conserva si el asesor sale a la captura manual y vuelve.
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

export default function OtpEspera({ onManual, onListo, onBack, yaCompletado }) {
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();
  const ETAPAS = etapasRemotas();
  const PASO_MS = OTP_ESPERA_MS / ETAPAS.length;

  const [, setTick] = useState(0);

  const modo = (() => {
    try {
      return localStorage.getItem('toko.mod') === '1';
    } catch {
      return false;
    }
  })();

  // Arranca el reloj la primera vez que se ve la pantalla.
  useEffect(() => {
    if (!solicitud.auth.authRemotaISO) {
      patch({ auth: { authRemotaISO: new Date().toISOString() } });
      track('click', { target: 'otp_espera_inicio', duracionMs: OTP_ESPERA_MS });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const inicio = solicitud.auth.authRemotaISO
    ? new Date(solicitud.auth.authRemotaISO).getTime()
    : Date.now();
  const t = Math.max(0, Date.now() - inicio);
  const hechas = Math.min(ETAPAS.length, Math.floor(t / PASO_MS));
  const completa = yaCompletado || t >= OTP_ESPERA_MS;

  // Refresca la vista cada segundo mientras corre.
  useEffect(() => {
    if (completa) return undefined;
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [completa]);

  const saltar = () => {
    track('click', { target: 'otp_espera_saltar_mod' });
    patch({
      auth: { authRemotaISO: new Date(Date.now() - OTP_ESPERA_MS - 1000).toISOString() },
    });
  };

  const hechasVista = completa ? ETAPAS.length : hechas;

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Autenticacion" onBack={onBack} right={<CerrarSolicitud />} />
      <Content>
        <h1>
          {completa
            ? 'El cliente completo la autenticacion'
            : 'El cliente esta autenticando su celular'}
        </h1>
        <p className="lead">
          {completa
            ? 'Recibimos su verificacion, biometria y firma de la carta. Revisa los datos y continua.'
            : 'Enviamos una liga por WhatsApp al cliente. El avance continua aunque salgas de esta pantalla; el tiempo depende del cliente.'}
        </p>

        <div className="tiny" style={{ margin: '18px 0 8px', fontWeight: 700 }}>
          {hechasVista} de {ETAPAS.length} completados
        </div>
        <ol className="firma-etapas">
          {ETAPAS.map((e, i) => {
            const done = i < hechasVista;
            const current = i === hechasVista && !completa;
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
          <Button variant="primary" onClick={onListo} track="ident_otp_remoto_continuar">
            Continuar →
          </Button>
        ) : (
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
