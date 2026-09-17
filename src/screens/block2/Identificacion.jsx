import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, Callout, CerrarSolicitud } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import SignaturePad from '../../components/SignaturePad.jsx';
import CapturaDocumento from '../../components/CapturaDocumento.jsx';
import OtpEspera from './OtpEspera.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import { email as vEmail, telefono as vTel } from '../../domain/validators.js';
import { OCR_MOCK, TALON_MOCK, CLIENTE_EXISTENTE_MOCK, AUTENTICACION_REMOTA } from '../../domain/catalogs.js';
import { capacidadPagoQuincenal, mxn } from '../../domain/finance.js';

// Bloque 2: pantallas simuladas (camara, OTP y OCR). Sin logging fino:
// solo se registran las transiciones de paso como `click`.
const PASOS = [
  'contacto',
  'cliente_existente',
  'solicitudes_activas',
  'aprobado_interno',
  'otp_espera',
  // 'otp_codigo' se conserva en el archivo pero YA NO va en el flujo del asesor:
  // el OTP lo captura el cliente desde el link de WhatsApp (flujo remoto).
  'datos_captura', // captura manual: escanear INE (autollena) o teclear los datos
  'bio_intro',
  'selfie',
  'ine_frente',
  'ine_frente_ok', // "¿Es correcta la captura?" del frente
  'ine_reverso',
  'ine_reverso_ok', // "¿Es correcta la captura?" del reverso
  // 'ocr' se conserva en el archivo pero YA NO va en el flujo: los datos del
  // cliente se revisan en 'datos_captura' (pre-llenado si el escaneo/OCR corrio).
  'firma_asesor',
  // Feedback final de la autenticacion. Hay 3 segun si el cliente es sujeto de
  // credito; por ahora solo el mejor de los casos: 'resultado_ok'.
  'resultado_ok',
];

// Tips de encuadre (pantalla de captura de INE).
const CONSEJOS_INE = [
  'Consigue que el documento entre completamente en la pantalla.',
  'Asegurate de no moverte en el momento de la fotografia.',
  'Evita reflejos y luces directas. Un lugar con luz de dia o cerca de una ventana suele dar mejor resultado.',
];

const DATOS_VACIOS = {
  curp: '',
  rfc: '',
  nombre: '',
  segundoNombre: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  fechaNacimiento: '',
};

export default function Identificacion() {
  const navigate = useNavigate();
  const { track, completarGrupo } = useMetrics();
  const { solicitud, patch, setTabData, toggleDoc } = useStore();
  const [paso, setPaso] = useState('contacto');
  // Pila de pasos visitados para que "← Regresar" vuelva al paso anterior de
  // ESTE flujo (no a la ruta previa). Vacia en 'contacto' => sale del flujo.
  const [historial, setHistorial] = useState([]);
  const [cel, setCel] = useState(solicitud.auth.celular || '');
  const [mail, setMail] = useState(solicitud.auth.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  // Captura manual de datos del cliente (paso 'datos_captura').
  const [datos, setDatos] = useState(DATOS_VACIOS);
  const [ineEscaneada, setIneEscaneada] = useState(false);
  // Captura manual de la INE desde 'datos_captura': null | 'frente' | 'reverso'.
  // No usa el paso simulado 'ine_frente'/'ine_reverso' (ese se deja intacto
  // para cuando retomemos la simulacion de camara real, colgada de 'selfie').
  const [capturaIne, setCapturaIne] = useState(null);
  const setDato = (k) => (v) => setDatos((d) => ({ ...d, [k]: v }));
  const [firmaAsesorOk, setFirmaAsesorOk] = useState(false);
  const [guardarFirma, setGuardarFirma] = useState(true);
  const [verCarta, setVerCarta] = useState(false); // sheet con la carta a firmar
  // 'remoto' = cliente autentico y completo biometria en su celular.
  // 'manual' = captura en el dispositivo del asesor (cliente en sucursal).
  const [autVia, setAutVia] = useState(null);

  const ir = (siguiente) => {
    track('click', { target: `ident_paso_${siguiente}` });
    setHistorial((h) => [...h, paso]);
    setPaso(siguiente);
  };

  // "← Regresar": vuelve al paso anterior de la pila; si esta vacia (paso
  // inicial) sale del flujo con navigate(-1).
  const atras = () => {
    if (historial.length === 0) {
      track('click', { target: 'ident_atras_salir' });
      navigate(-1);
      return;
    }
    const prev = historial[historial.length - 1];
    track('click', { target: `ident_atras_${prev}` });
    setHistorial((h) => h.slice(0, -1));
    setPaso(prev);
  };

  // Cliente existente, tras revisar solicitudes activas: si tiene carta de
  // consulta vigente se "procesa" y va a la pantalla verde "Aprobado"; si no,
  // sigue el flujo normal (espera de OTP + firma de la carta).
  const trasClienteExistente = () =>
    ir(CLIENTE_EXISTENTE_MOCK.tieneCartaVigente ? 'aprobado_interno' : 'otp_espera');

  // Captura manual: al volver del escaneo de INE se autollenan los campos de
  // identidad de 'datos_captura' con lo que "detecto" el OCR (los datos
  // laborales / ingresos NO: esos vienen del talon en el bloque 4).
  const llenarDesdeINE = () => {
    setDatos({
      curp: OCR_MOCK.curp,
      rfc: OCR_MOCK.rfc,
      nombre: OCR_MOCK.nombre,
      segundoNombre: OCR_MOCK.segundoNombre,
      apellidoPaterno: OCR_MOCK.apellidoPaterno,
      apellidoMaterno: OCR_MOCK.apellidoMaterno,
      fechaNacimiento: OCR_MOCK.fechaNacimiento,
    });
    setIneEscaneada(true);
  };

  // "Continuar" desde 'datos_captura': vuelca los datos de IDENTIDAD al bloque
  // 4. Los datos laborales y de ingresos NO se tocan: se capturan con el talon
  // de pagos en el bloque 4.
  const continuarDatos = () => {
    setTabData('personales', {
      curp: datos.curp,
      rfc: datos.rfc,
      nombre: datos.nombre,
      segundoNombre: datos.segundoNombre,
      apellidoPaterno: datos.apellidoPaterno,
      apellidoMaterno: datos.apellidoMaterno,
      fechaNacimiento: datos.fechaNacimiento,
      ...(ineEscaneada
        ? {
            genero: OCR_MOCK.genero,
            estadoCivil: OCR_MOCK.estadoCivil,
            paisNacimiento: OCR_MOCK.paisNacimiento,
            nacionalidad: OCR_MOCK.nacionalidad,
          }
        : {}),
    });
    setTabData('contacto', { telefonoCelular: cel });
    patch({
      auth: {
        biometriaCliente: true,
        ineFrente: ineEscaneada,
        ineReverso: ineEscaneada,
        ocrAplicado: ineEscaneada,
      },
    });
    if (ineEscaneada) {
      toggleDoc('ine', { nombre: 'Capturada en la identificacion', demo: true });
    }
    track('click', {
      target: 'ident_datos_captura_continuar',
      via: ineEscaneada ? 'ine_ocr' : 'manual',
    });
    ir('firma_asesor');
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
        // El asesor capturo los datos del cliente (por escaneo o a mano): la
        // identificacion queda completa para el calculo de progreso (bloque 2).
        ocrAplicado: true,
        firmaAsesor: true,
        firmaCliente: solicitud.tipoFirma === 'autografa',
      },
    });
    navigate(completarGrupo('g1_iniciar_autenticar'), { replace: true });
  };

  // ---------- render por paso ----------

  if (paso === 'contacto') {
    const ok = !vTel(cel) && !vEmail(mail);
    return (
      <Shell onBack={atras} title="Identificacion">
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
      <Shell onBack={atras} title="Identificacion">
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
            onClick={() =>
              c.tieneSolicitudesActivas ? ir('solicitudes_activas') : trasClienteExistente()
            }
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
    const continuar = () => trasClienteExistente();
    return (
      <Shell onBack={atras} title="Identificacion">
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

  if (paso === 'aprobado_interno') {
    const c = CLIENTE_EXISTENTE_MOCK;
    const cap = capacidadPagoQuincenal(c.ingresoMensual);
    const finalizar = () => {
      // El cliente ya estaba validado internamente: la identificacion queda
      // completa sin OTP/biometria/firma. Guardamos su ingreso para el cotizador.
      setTabData('ingresos', { ingresoMensualComprobable: c.ingresoMensual });
      setTabData('personales', { nombre: c.nombre });
      patch({
        auth: {
          celular: cel,
          email: c.email,
          otpValidado: true,
          biometriaCliente: true,
          ineFrente: true,
          ineReverso: true,
          ocrAplicado: true,
          firmaAsesor: true,
          firmaCliente: solicitud.tipoFirma === 'autografa',
        },
      });
      navigate(completarGrupo('g1_iniciar_autenticar', { via: 'cliente_existente' }), { replace: true });
    };
    return (
      <Screen>
        <StatusBar />
        <TopBar title={null} onBack={atras} right={<CerrarSolicitud />} />
        <div className="success-screen">
          <div className="check">✓</div>
          <h1>¡Aprobado! Comencemos con una buena oferta para {c.nombre}</h1>
          <p>
            El cliente tiene una capacidad de pago de <strong>{mxn(cap)}mxn</strong>
          </p>
          <div className="grow" />
          <Button variant="primary" onClick={finalizar} track="ident_aprobado_interno_terminar">
            Continuar →
          </Button>
        </div>
      </Screen>
    );
  }

  if (paso === 'otp_espera') {
    return (
      <OtpEspera
        onBack={atras}
        onManual={() => {
          setAutVia('manual');
          // Sin paso de OTP: el asesor captura los datos del cliente (escanea
          // la INE o los teclea). El cliente ya hizo biometricos en su celular.
          ir('datos_captura');
        }}
        onListo={() => {
          setAutVia('remoto');
          // El INE y los biometricos van juntos: si el cliente no hizo la
          // identificacion en el link, la hace el asesor en 'datos_captura'.
          const identOk = AUTENTICACION_REMOTA.subeIdentificacion;
          patch({
            auth: {
              otpValidado: true,
              biometriaCliente: identOk,
              ineFrente: identOk,
              ineReverso: identOk,
              ocrAplicado: identOk,
            },
          });
          if (identOk) {
            // Como si el OCR del INE del cliente ya hubiera corrido: 'datos_captura'
            // llega pre-llenado y el INE ya cuenta como documento.
            llenarDesdeINE();
            toggleDoc('ine', { nombre: 'Capturada en la identificacion', demo: true });
          }
          ir('datos_captura');
        }}
      />
    );
  }

  if (paso === 'datos_captura') {
    const listo = datos.curp.trim().length >= 10;
    return (
      <Shell onBack={atras} title="Datos del cliente">
        <Content>
          <h1>Tomemos los datos personales del cliente</h1>
          <p className="lead">
            Puedes llenar la informacion o escanear la identificacion oficial.
          </p>

          <div className="sec-label">Escaneo</div>
          <button
            type="button"
            className={`scan-ine${ineEscaneada ? ' done' : ''}`}
            onClick={() => {
              track('click', { target: 'ident_datos_escanear_ine' });
              setCapturaIne('frente');
            }}
          >
            <span>{ineEscaneada ? 'INE escaneada' : 'Escanear INE'}</span>
            <span className="scan-ico" aria-hidden="true">
              {ineEscaneada ? '✓' : '↑'}
            </span>
          </button>
          {ineEscaneada && (
            <p className="tiny scan-hint">
              Ya esta agregada a la lista de documentos. Toca para volver a escanearla si es
              necesario.
              {autVia === 'remoto' && ' El cliente completo su identificacion desde el link.'}
            </p>
          )}
          {capturaIne === 'frente' && (
            <CapturaDocumento
              titulo="Capturar el frente de la INE"
              subtitulo="Coloca la parte frontal de la INE del cliente."
              onAceptar={() => setCapturaIne('reverso')}
              onCancelar={() => setCapturaIne(null)}
            />
          )}
          {capturaIne === 'reverso' && (
            <CapturaDocumento
              titulo="Capturar el reverso de la INE"
              subtitulo="Ahora la parte trasera de la INE del cliente."
              onAceptar={() => {
                llenarDesdeINE();
                setCapturaIne(null);
              }}
              onCancelar={() => setCapturaIne(null)}
            />
          )}

          <div className="sec-label">
            {ineEscaneada ? 'Datos de identificacion' : 'Identificacion'}
          </div>
          <Field
            name="curp"
            label="CURP"
            value={datos.curp}
            onChange={setDato('curp')}
            maxLength={18}
            placeholder="18 caracteres"
          />
          {ineEscaneada && (
            <Field
              name="rfc"
              label="RFC"
              value={datos.rfc}
              onChange={setDato('rfc')}
              maxLength={13}
            />
          )}

          {ineEscaneada && (
            <>
              <div className="sec-label">Datos personales</div>
              <Field name="nombre" label="Nombre" value={datos.nombre} onChange={setDato('nombre')} />
              <Field
                name="segundoNombre"
                label="Segundo nombre"
                required={false}
                value={datos.segundoNombre}
                onChange={setDato('segundoNombre')}
              />
              <Field
                name="apellidoPaterno"
                label="Apellido paterno"
                value={datos.apellidoPaterno}
                onChange={setDato('apellidoPaterno')}
              />
              <Field
                name="apellidoMaterno"
                label="Apellido materno"
                value={datos.apellidoMaterno}
                onChange={setDato('apellidoMaterno')}
              />
              <Field
                name="fechaNacimiento"
                label="Fecha de nacimiento"
                type="date"
                value={datos.fechaNacimiento}
                onChange={setDato('fechaNacimiento')}
              />
            </>
          )}
        </Content>
        <FooterActions>
          <Button
            variant="primary"
            disabled={!listo}
            onClick={continuarDatos}
            track="ident_datos_captura_continuar_btn"
          >
            Continuar →
          </Button>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'otp_codigo') {
    const full = otp.every((d) => d !== '');
    return (
      <Shell onBack={atras} title="OTP">
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
      <Shell onBack={atras} title="Biometricos">
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
      <Shell onBack={atras} title="Selfie">
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

  if (paso.startsWith('ine_')) {
    const esFrente = paso === 'ine_frente' || paso === 'ine_frente_ok';
    const esRevision = paso.endsWith('_ok');
    const lado = esFrente ? 'frente' : 'reverso';

    // Pantalla de captura: encuadre + consejos + obturador simulado.
    if (!esRevision) {
      return (
        <Shell onBack={atras} title="Captura de INE">
          <Content>
            <h1>Capturar {esFrente ? 'el frente' : 'el reverso'} de la INE</h1>
            <p className="lead">
              Coloca {esFrente ? 'la parte frontal' : 'la parte trasera'} de la INE del cliente
              dentro del recuadro y toma la foto.
            </p>
            <div className="ine-frame">
              <span className="ine-frame-ico" aria-hidden="true">🪪</span>
              <span className="tiny">Encuadra la credencial</span>
            </div>
            <div className="sec-label" style={{ borderBottom: 'none', margin: '14px 0 2px' }}>
              Consejos
            </div>
            <ul className="consejos tiny">
              {CONSEJOS_INE.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <button
              className="shutter"
              aria-label="Tomar foto"
              onClick={() => ir(`ine_${lado}_ok`)}
            />
            <p className="tiny" style={{ textAlign: 'center' }}>Camara simulada</p>
          </Content>
        </Shell>
      );
    }

    // Pantalla de revision: "¿Es correcta la captura?" con la foto capturada.
    const confirmar = () => {
      if (esFrente) return ir('ine_reverso');
      // Captura manual: el escaneo vuelve a 'datos_captura' con los campos
      // autollenados. En el flujo remoto sigue a 'ocr'.
      if (autVia === 'manual') {
        llenarDesdeINE();
        return ir('datos_captura');
      }
      return ir('ocr');
    };
    return (
      <Shell onBack={atras} title="Captura de INE">
        <Content>
          <h1>¿Es correcta la captura?</h1>
          <p className="lead">
            Revisa que se lea bien {esFrente ? 'el frente' : 'el reverso'} de la INE. Si salio
            borrosa o cortada, vuelve a escanearla.
          </p>
          <IneShot lado={lado} />
        </Content>
        <FooterActions>
          <div className="btn-row">
            <Button
              variant="ghost"
              onClick={() => ir(`ine_${lado}`)}
              track={`ident_ine_${lado}_reintentar`}
            >
              Escanea de nuevo
            </Button>
            <Button variant="primary" onClick={confirmar} track={`ident_ine_${lado}_confirmar`}>
              Confirmar ✓
            </Button>
          </div>
        </FooterActions>
      </Shell>
    );
  }

  if (paso === 'ocr') {
    const remoto = autVia === 'remoto';
    return (
      <Shell onBack={atras} title="Datos del cliente">
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
      <Shell onBack={atras} title="Firma del asesor">
        <Content>
          <h1>Firmar carta de consulta al portal de dependencia</h1>
          <p className="lead">
            Realiza tu firma dentro del recuadro. Si necesitas corregirla usa "Borrar firma".
          </p>
          <Button
            variant="ghost"
            onClick={() => {
              track('click', { target: 'ident_ver_carta_dependencia' });
              setVerCarta(true);
            }}
            style={{ marginBottom: 14 }}
          >
            📄 Ver la carta que vas a firmar
          </Button>
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
              // La firma del cliente ya no se hace en el dispositivo del asesor:
              // el cliente firma la carta de consulta desde el link (flujo remoto).
              ir('resultado_ok');
            }}
            track="ident_firma_asesor_confirmar"
          >
            Confirmar →
          </Button>
        </FooterActions>
        {verCarta && <CartaSheet onClose={() => setVerCarta(false)} />}
      </Shell>
    );
  }

  if (paso === 'resultado_ok') {
    const nombre =
      solicitud.datos.personales?.nombre || datos.nombre || 'el cliente';
    const ingreso =
      solicitud.datos.ingresos?.ingresoMensualComprobable ||
      TALON_MOCK.ingresoMensualComprobable;
    const cap = capacidadPagoQuincenal(ingreso);
    return (
      <Screen>
        <StatusBar />
        <TopBar title={null} onBack={atras} right={<CerrarSolicitud />} />
        <div className="success-screen">
          <div className="check">✓</div>
          <h1>¡Aprobado! Comencemos con una buena oferta para {nombre}</h1>
          <p>
            El cliente tiene una capacidad de pago de <strong>{mxn(cap)}mxn</strong>
          </p>
          <div className="grow" />
          <Button variant="dark" onClick={terminar} track="ident_resultado_ok_terminar">
            Continuar →
          </Button>
        </div>
      </Screen>
    );
  }

  return null;
}

// Foto "capturada" de la INE en la pantalla de revision. Usa la imagen de
// muestra en /public/ine/<lado>.<ext>; si no existe cae a un recuadro simulado.
const INE_EXTS = ['webp', 'jpeg', 'jpg', 'png'];
function IneShot({ lado }) {
  const [i, setI] = useState(0);
  if (i >= INE_EXTS.length) {
    return (
      <div className="ine-shot ine-shot--mock">
        <span aria-hidden="true">🪪</span>
        <span className="tiny">Captura simulada de la INE ({lado})</span>
      </div>
    );
  }
  return (
    <img
      className="ine-shot"
      src={`/ine/${lado}.${INE_EXTS[i]}`}
      alt={`INE ${lado} capturada`}
      onError={() => setI((n) => n + 1)}
    />
  );
}

// Sheet de solo lectura con la carta de consulta que firmara el asesor.
// Vive dentro del marco del telefono (.device) y sube desde abajo. Mientras
// esta abierto se oculta el FAB de instrucciones (body.carta-abierta).
function CartaSheet({ onClose }) {
  useEffect(() => {
    document.body.classList.add('carta-abierta');
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('carta-abierta');
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <div className="carta-sheet-backdrop" onClick={onClose}>
      <div
        className="carta-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Carta de consulta al portal de dependencia"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="carta-sheet-close" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
        <h2>Carta de consulta al portal de dependencia</h2>
        <p className="lead">Podras consultar la carta en el espacio inferior.</p>
        <div className="carta-doc">
          <img src="/carta_dependencia/carta.webp" alt="Carta de consulta al portal de dependencia" />
        </div>
      </div>
    </div>
  );
}

function Shell({ title, onBack, children }) {
  return (
    <Screen>
      <StatusBar />
      <TopBar title={title} onBack={onBack} right={<CerrarSolicitud />} />
      {children}
    </Screen>
  );
}
