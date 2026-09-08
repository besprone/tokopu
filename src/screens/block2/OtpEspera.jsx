import React, { useEffect, useRef, useState } from 'react';
import { Screen, StatusBar, TopBar, Content, FooterActions, Button, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';

// Espera de la autenticacion + biometria del cliente en su propio celular.
// En real puede tardar minutos u horas, asi que el indicador es INDETERMINADO.
// Para el prototipo, tras OTP_ESPERA_MS se resuelve solo.
export const OTP_ESPERA_MS = 30000;

export default function OtpEspera({ onManual, onListo, onBack }) {
  const { track } = useMetrics();
  const [listo, setListo] = useState(false);
  const cerrado = useRef(false);

  const modo = (() => {
    try {
      return localStorage.getItem('toko.mod') === '1';
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    track('click', { target: 'otp_espera_inicio', duracionMs: OTP_ESPERA_MS });
    const id = setTimeout(() => {
      if (cerrado.current) return;
      cerrado.current = true;
      setListo(true);
      track('click', { target: 'otp_autenticado_remoto' });
      setTimeout(() => onListo(), 1100);
    }, OTP_ESPERA_MS);
    return () => clearTimeout(id);
  }, []); // eslint-disable-line

  const saltar = () => {
    if (cerrado.current) return;
    cerrado.current = true;
    track('click', { target: 'otp_espera_saltar_mod' });
    onListo();
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="OTP" onBack={onBack} right={<CerrarSolicitud />} />
      <Content>
        <div className="otp-wait">
          {listo ? (
            <div className="otp-done" aria-hidden="true">
              ✓
            </div>
          ) : (
            <div className="otp-spinner" aria-hidden="true" />
          )}
          <p className={`otp-wait-label${listo ? ' listo' : ''}`}>
            {listo ? 'El cliente autentico su movil' : 'Esperando confirmacion del cliente…'}
          </p>
        </div>

        <h1 style={{ marginTop: 22 }}>
          {listo
            ? 'Listo: el cliente completo la autenticacion y la biometria en su celular'
            : 'El cliente esta autenticando su celular'}
        </h1>
        <p className="lead">
          Enviamos una liga por WhatsApp al cliente. Desde su telefono valida el codigo y
          completa la biometria (selfie e INE). El tiempo depende del cliente.
        </p>
      </Content>

      <FooterActions>
        {!listo && (
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
