import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, Callout, CerrarSolicitud } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import SignaturePad from '../../components/SignaturePad.jsx';
import OtpEspera from './OtpEspera.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import { email as vEmail, telefono as vTel } from '../../domain/validators.js';
import { OCR_MOCK, TALON_MOCK, CLIENTE_EXISTENTE_MOCK } from '../../domain/catalogs.js';

// Bloque 2: pantallas simuladas (camara, OTP y OCR). Sin logging fino:
// solo se registran las transiciones de paso como `click`.
const PASOS = [
  'contacto',
  'cliente_existente',
  'solicitudes_activas',
  'otp_espera',
  'otp_codigo',
  'bio_intro',
  'selfie',
  'ine_frente',
  'ine_reverso',
  'ocr',
  'firma_asesor',
  'firma_cliente',
];

export default function Identificacion() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch, setTabData } = useStore();
  const [paso, setPaso] = useState('contacto');
  const [cel, setCel] = useState(solicitud.auth.celular || '');
  const [mail, setMail] = useState(solicitud.auth.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [firmaAsesorOk, setFirmaAsesorOk] = useState(false);
  const [firmaClienteOk, setFirmaClienteOk] = useState(false);
  const [guardarFirma, setGuardarFirma] = useState(true);
  // 'remoto' = cliente autentico y completo biometria en su celular.
  // 'manual' = captura en el dispositivo del asesor (cliente en sucursal).
  const [autVia, setAutVia] = useState(null);

  const ir = (siguiente) => {
    track('click', { target: `ident_paso_${siguiente}` });
    setPaso(siguiente);
  };

  const aplicarOCR = () => {
    setTabData('personales', {
      curp: OCR_MOCK.curp,
      rfc: OCR_MOCK.rfc,
      nombre: OCR_MOCK.nombre,
      segundoNombre: OCR_MOCK.segundoNombre,
      apellidoPaterno: OCR_MOCK.apellidoPaterno,
      apellidoMaterno: OCR_MOCK.apellidoMaterno,
      fechaNacimiento: OCR_MOCK.fechaNacimiento,
      genero: OCR_MOCK.genero,
      estadoCivil: OCR_MOCK.estadoCivil,
      paisNacimiento: OCR_MOCK.paisNacimiento,
      nacionalidad: OCR_MOCK.nacionalidad,
    });
    setTabData('laborales', {
      numSegSocial: TALON_MOCK.numSegSocial,
      entidadFederativa: TALON_MOCK.entidadFederativa,
      centroTrabajo: TALON_MOCK.centroTrabajo,
      puesto: TALON_MOCK.puesto,
      fechaIngreso: TALON_MOCK.fechaIngreso,
    });
    setTabData('contacto', {
      telefonoCelular: cel,
      calle: OCR_MOCK.calle,
      cp: OCR_MOCK.cp,
      colonia: OCR_MOCK.colonia,
      delegacion: OCR_MOCK.delegacion,
      estado: OCR_MOCK.estado,
      pais: OCR_MOCK.pais,
    });
    setTabData('ingresos', {
      ingresoMensualComprobable: TALON_MOCK.ingresoMensualComprobable,
      rangoIngreso: TALON_MOCK.rangoIngreso,
    });
    patch({ auth: { ocrAplicado: true } });
    track('click', { target: 'ocr_aplicado' });
    ir('firma_asesor');
  };

  const terminar = () => {
    patch({
      auth: {
        celular: cel,
        email: mail,
        otpValidado: true,
        biometriaCliente: true,
        ineFrente: true,
        ineReverso: true,
        firmaAsesor: true,
        firmaCliente: solicitud.tipoFirma === 'autografa',
      },
    });
    track('task_complete', { tarea: 'identificacion', resultado: 'exito' });
    navigate('/seq/identificacion', { replace: true });
  };

  // ---------- render por paso ----------

  if (paso === 'contacto') {
    const ok = !vTel(cel) && !vEmail(mail);
    return (
      <Shell title="Identificacion">
        <Content>
          <h1>Empecemos por autenticar al cliente</h1>
          <p className="lead">
            Introduce su numero de celular. Enviaremos un codigo a su telefono para realizar
            la autenticacion.
          </p>
          <Field name="celular" label="Numero de celular del cliente" value={cel} onChange={setCel}
            validate={vTel} type="tel" inputMode="numeric" maxLength={10} placeholder="55 0000 0000" />
          <Field name="email" label="Email del cliente" value={mail} onChange={setMail}
            validate={vEmail} type="email" placeholder="cliente@correo.com" />
          <p className="tiny">
            Si el cliente esta contigo tendras la opcion de llevar a cabo el proceso de
            biometricos desde tu dispositivo.
          </p>
        </Content>
        <FooterActions>
          <Button
            variant="primary"
            disabled={!ok}
            onClick={() =>
              ir(cel === CLIENTE_EXISTENTE_MOCK.celular ? 'cliente_existente' : 'otp_espera')
            }
            track="ident_iniciar_validacion"
          >
            Iniciar validacion →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'cliente_existente') {
    const c = CLIENTE_EXISTENTE_MOCK;
    return (
      <Shell title="Identificacion">
        <Content>
          <h1>El numero corresponde a un cliente existente</h1>
          <p className="lead">
            Hemos detectado que el numero de celular ya consta en nuestro sistema. Por favor
            revisa si son los datos del cliente antes de continuar.
          </p>
          <div className="card" style={{ marginTop: 8 }}>
            <div className="summary-row"><span className="k">Nombre</span><span className="v">{c.nombre}</span></div>
            <div className="summary-row"><span className="k">RFC</span><span className="v mono">{c.rfc}</span></div>
            <div className="summary-row"><span className="k">CURP</span><span className="v mono">{c.curp}</span></div>
            <div className="summary-row"><span className="k">Celular</span><span className="v">{c.celularFmt}</span></div>
            <div className="summary-row"><span className="k">Email</span><span className="v">{c.email}</span></div>
            <div className="summary-row"><span className="k">Pais de nacimiento</span><span className="v">{c.paisNacimiento}</span></div>
            <div className="summary-row"><span className="k">Nacionalidad</span><span className="v">{c.nacionalidad}</span></div>
          </div>
          <p className="small" style={{ margin: '16px 0 4px' }}>¿Los datos no corresponden?</p>
          <button
            className="btn link"
            style={{ padding: 0, fontWeight: 700 }}
            onClick={() => ir('contacto')}
          >
            Volver a capturar
          </button>
        </Content>
        <FooterActions>
          <Button
            variant="primary"
            onClick={() => ir(c.tieneSolicitudesActivas ? 'solicitudes_activas' : 'otp_espera')}
            track="ident_cliente_existente_confirmar"
          >
            Si, son los datos del cliente →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'solicitudes_activas') {
    const items = CLIENTE_EXISTENTE_MOCK.solicitudesActivas;
    // Tras retomar / crear: si el cliente ya tiene carta de consulta vigente
    // salta directo a la espera de OTP (rama "sin carta vigente" pendiente).
    const continuar = () => ir('otp_espera');
    return (
      <Shell title="Identificacion">
        <Content>
          <h1>Solicitudes guardadas</h1>
          <p className="lead">
            Hemos detectado que existen solicitudes abiertas a nombre de este cliente. Podras
            retomarlas haciendo tap sobre cualquiera de ellas.
          </p>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            {items.map((s, i) => (
              <React.Fragment key={i}>
                <div style={{ fontWeight: 700, fontSize: 14, marginTop: i ? 8 : 0 }}>{s.dia}</div>
                <button
                  className="card"
                  style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px' }}
                  disabled={!s.retomable}
                  onClick={() => {
                    track('click', { target: 'retomar_solicitud_cliente' });
                    continuar();
                  }}
                >
                  <div className="row between">
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.nombre}</div>
                      <div className="tiny">{s.detalle}</div>
                      <div className="small muted" style={{ fontWeight: 600 }}>{s.estado}</div>
                    </div>
                    {s.retomable && <span className="muted">→</span>}
                  </div>
                </button>
              </React.Fragment>
            ))}
          </div>
        </Content>
        <FooterActions>
          <Button variant="primary" onClick={continuar} track="ident_crear_nueva_solicitud">
            Crear una nueva solicitud →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'otp_espera') {
    return (
      <OtpEspera
        onManual={() => {
          setAutVia('manual');
          ir('otp_codigo');
        }}
        onListo={() => {
          setAutVia('remoto');
          patch({
            auth: {
              otpValidado: true,
              biometriaCliente: true,
              ineFrente: true,
              ineReverso: true,
            },
          });
          ir('ocr');
        }}
      />
    );
  }

  if (paso === 'otp_codigo') {
    const full = otp.every((d) => d !== '');
    return (
      <Shell title="OTP">
        <Content>
          <h1>Ingresa el codigo de 6 digitos</h1>
          <p className="lead">Pide al cliente el codigo que recibio por SMS o WhatsApp.</p>
          <div className="otp-inputs">
            {otp.map((d, i) => (
              <input
                key={i}
                inputMode="numeric"
                maxLength={1}
                autoFocus={i === 0}
                value={d}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '');
                  setOtp((o) => o.map((x, k) => (k === i ? v : x)));
                  if (v && e.target.nextElementSibling) e.target.nextElementSibling.focus();
                }}
              />
            ))}
          </div>
          <Callout kind="info">Pantalla simulada: cualquier codigo de 6 digitos es valido.</Callout>
        </Content>
        <FooterActions>
          <Button variant="primary" disabled={!full} onClick={() => ir('bio_intro')} track="ident_otp_validar">
            Validar codigo →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'bio_intro') {
    return (
      <Shell title="Biometricos">
        <Content>
          <div className="mock-oval" style={{ margin: '10px auto 20px' }} />
          <h1>Comencemos por identificar al cliente</h1>
          <p className="lead">
            A continuacion tomaras una fotografia del cliente que nos ayude a validar su
            identidad. Limpia la lente y busca un lugar bien iluminado.
          </p>
        </Content>
        <FooterActions>
          <Button variant="primary" onClick={() => ir('selfie')} track="ident_bio_continuar">
            Continuar
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'selfie') {
    return (
      <Shell title="Selfie">
        <Content>
          <div className="mock-camera">
            <div>
              <div className="mock-oval" style={{ margin: '0 auto' }} />
              <p className="small" style={{ marginTop: 12 }}>
                Enmarca el rostro del cliente y presiona el boton
              </p>
            </div>
          </div>
          <button className="shutter" onClick={() => ir('ine_frente')} aria-label="Tomar foto" />
          <p className="tiny" style={{ textAlign: 'center' }}>Pantalla de camara simulada</p>
        </Content>
      </Shell>
    );
  }

  if (paso === 'ine_frente' || paso === 'ine_reverso') {
    const esFrente = paso === 'ine_frente';
    return (
      <Shell title="Captura INE">
        <Content>
          <h1>Capturar {esFrente ? 'el frente' : 'el reverso'} de la INE</h1>
          <p className="lead">Por favor, captura la parte {esFrente ? 'frontal' : 'trasera'} de la INE del cliente.</p>
          <div className="mock-camera" style={{ aspectRatio: '16/10' }}>
            <div>
              <div style={{ fontSize: 30 }}>🪪</div>
              Encuadra la credencial
            </div>
          </div>
          <ul className="tiny" style={{ paddingLeft: 18 }}>
            <li>Consigue que el documento entre completamente en la pantalla.</li>
            <li>Evita reflejos y luces directas.</li>
          </ul>
        </Content>
        <FooterActions>
          <Button variant="primary" onClick={() => ir(esFrente ? 'ine_reverso' : 'ocr')} track={`ident_${paso}_confirmar`}>
            Confirmar captura ✓
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'ocr') {
    const remoto = autVia === 'remoto';
    return (
      <Shell title="Datos del cliente">
        <Content>
          <h1>Tomemos los datos personales del cliente</h1>
          <p className="lead">
            {remoto
              ? 'El cliente escaneo su INE desde su celular. Revisa los datos detectados y continua.'
              : 'Escanea la INE para autollenar la informacion oficial.'}
          </p>
          <Callout kind="info">
            {remoto
              ? 'Datos recibidos del dispositivo del cliente. Al continuar se llenan los campos del bloque 4.'
              : 'Pantalla simulada de OCR. Al escanear, se autollenan los campos del bloque 4.'}
          </Callout>
          <div style={{ marginTop: 16 }}>
            <div className="card">
              <div className="tiny">Vista previa de datos detectados</div>
              <div className="summary-row"><span className="k">Nombre</span><span className="v">{OCR_MOCK.nombre} {OCR_MOCK.apellidoPaterno} {OCR_MOCK.apellidoMaterno}</span></div>
              <div className="summary-row"><span className="k">CURP</span><span className="v mono">{OCR_MOCK.curp}</span></div>
              <div className="summary-row"><span className="k">RFC</span><span className="v mono">{OCR_MOCK.rfc}</span></div>
              <div className="summary-row"><span className="k">Fecha de nacimiento</span><span className="v">{OCR_MOCK.fechaNacimiento}</span></div>
            </div>
          </div>
        </Content>
        <FooterActions>
          <Button variant="primary" onClick={aplicarOCR} track="ident_ocr_continuar">
            {remoto ? 'Continuar →' : 'Escanear INE y autollenar →'}
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'firma_asesor') {
    return (
      <Shell title="Firma del asesor">
        <Content>
          <h1>Firmar carta de consulta al portal de dependencia</h1>
          <p className="lead">
            Realiza tu firma dentro del recuadro. Si necesitas corregirla usa "Borrar firma".
          </p>
          <label className="row" style={{ gap: 8, marginBottom: 10 }}>
            <input type="checkbox" checked={guardarFirma} onChange={(e) => setGuardarFirma(e.target.checked)} />
            <span className="small">Guardar mi firma para proximas solicitudes.</span>
          </label>
          <SignaturePad onChange={setFirmaAsesorOk} />
        </Content>
        <FooterActions>
          <Button
            variant="primary"
            disabled={!firmaAsesorOk}
            onClick={() => {
              patch({ auth: { firmaAsesor: true } });
              if (solicitud.tipoFirma === 'autografa') ir('firma_cliente');
              else terminar();
            }}
            track="ident_firma_asesor_confirmar"
          >
            Confirmar →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'firma_cliente') {
    return (
      <Shell title="Firma del cliente">
        <Content>
          <h1>Firma autografa del cliente</h1>
          <p className="lead">
            Pide al cliente que firme la carta de consulta al portal de la dependencia.
          </p>
          <SignaturePad onChange={setFirmaClienteOk} />
        </Content>
        <FooterActions>
          <Button variant="primary" disabled={!firmaClienteOk} onClick={terminar} track="ident_firma_cliente_confirmar">
            Confirmar →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  return null;
}

function Shell({ title, children }) {
  return (
    <Screen>
      <StatusBar />
      <TopBar title={title} right={<CerrarSolicitud />} />
      {children}
    </Screen>
  );
}
