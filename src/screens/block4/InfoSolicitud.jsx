import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, TABS_INFO } from '../../state/store.jsx';
import * as V from '../../domain/validators.js';
import {
  ESTADOS_MX,
  GENEROS,
  ESTADO_CIVIL,
  ORIGEN_RECURSOS,
  DESTINO_RECURSOS,
  BANCOS,
  TALON_MOCK,
  CUENTA_MOCK,
} from '../../domain/catalogs.js';

const OPCIONAL = { required: false };

// Tabs que permiten escanear un documento para autollenar sus campos, con el
// mismo patron que el OCR de la INE en el bloque 2.
const CONSEJOS_CAPTURA = [
  'Consigue que el documento entre completamente en la pantalla.',
  'Asegurate de no moverte en el momento de la fotografia.',
  'Evita reflejos y luces directas. Un lugar con luz de dia o cerca de una ventana suele dar mejor resultado.',
];

const ESCANEO_TAB = {
  laborales: {
    doc: 'talon-1',
    label: 'Talon de pagos',
    titulo: 'Capturar del recibo de nomina',
    subtitulo: 'Por favor, captura el recibo de nomina del cliente.',
    img: '/talon/talon',
    campos: {
      numSegSocial: TALON_MOCK.numSegSocial,
      entidadFederativa: TALON_MOCK.entidadFederativa,
      centroTrabajo: TALON_MOCK.centroTrabajo,
      puesto: TALON_MOCK.puesto,
      fechaIngreso: TALON_MOCK.fechaIngreso,
    },
  },
  bancarios: {
    doc: 'edo-cuenta',
    label: 'Estado de cuenta',
    titulo: 'Capturar el estado de cuenta',
    subtitulo: 'Por favor, captura la caratula del estado de cuenta del cliente.',
    img: '/estado_cuenta/edocuenta',
    campos: {
      banco: CUENTA_MOCK.banco,
      cuentaClabe: CUENTA_MOCK.cuentaClabe,
    },
  },
};

const DOC_EXTS = ['png', 'jpg', 'jpeg', 'webp'];

// Foto "capturada" del documento. Usa /public/<img>.<ext> y si no existe
// ninguna extension cae a un recuadro simulado.
function DocShot({ src, alt }) {
  const [i, setI] = useState(0);
  if (i >= DOC_EXTS.length) {
    return (
      <div className="docscan-shot docscan-shot--mock">
        <span aria-hidden="true">📄</span>
        <span className="tiny">{alt}</span>
      </div>
    );
  }
  return (
    <img
      className="docscan-shot"
      src={`${src}.${DOC_EXTS[i]}`}
      alt={alt}
      onError={() => setI((n) => n + 1)}
    />
  );
}

// Flujo de captura de un documento: encuadre + consejos -> revision de la foto.
// Vive dentro del marco (.screen) y sube desde abajo, igual que CartaSheet.
function DocScanSheet({ cfg, onAceptar, onClose }) {
  const [fase, setFase] = useState('captura');
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
        className="carta-sheet docscan-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={cfg.titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="carta-sheet-close" aria-label="Cerrar" onClick={onClose}>
          ✕
        </button>
        <h2>{cfg.titulo}</h2>
        <p className="lead">{cfg.subtitulo}</p>

        {fase === 'captura' ? (
          <>
            <div className="docscan-frame">
              <span className="docscan-frame-ico" aria-hidden="true">📄</span>
              <span className="tiny">Encuadra el documento</span>
            </div>
            <div className="sec-label" style={{ borderBottom: 'none', margin: '14px 0 2px' }}>
              Consejos
            </div>
            <ul className="consejos tiny">
              {CONSEJOS_CAPTURA.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <div className="grow" />
            <div className="docscan-actions">
              <Button variant="ghost" onClick={() => setFase('revision')} track="docscan_carrete">
                Desde carrete
              </Button>
              <Button variant="dark" onClick={() => setFase('revision')} track="docscan_capturar">
                Capturar
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="docscan-doc">
              <DocShot src={cfg.img} alt={`${cfg.label} capturado`} />
            </div>
            <div className="grow" />
            <div className="docscan-actions">
              <Button variant="ghost" onClick={() => setFase('captura')} track="docscan_reintentar">
                Escanea de nuevo
              </Button>
              <Button variant="dark" onClick={onAceptar} track="docscan_aceptar">
                Aceptar captura ✓
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const TAB_LABEL = {
  personales: 'Personales',
  laborales: 'Laborales',
  contacto: 'Contacto',
  ingresos: 'Ingresos',
  bancarios: 'Bancarios',
};

const TAB_DEFS = {
  personales: {
    titulo: 'Datos personales',
    ocr: ['curp', 'rfc', 'nombre', 'segundoNombre', 'apellidoPaterno', 'apellidoMaterno', 'fechaNacimiento', 'paisNacimiento', 'nacionalidad', 'genero', 'estadoCivil'],
    campos: [
      { name: 'curp', label: 'CURP', validate: V.curp, mono: true, maxLength: 18 },
      { name: 'rfc', label: 'RFC', validate: V.rfc, mono: true, maxLength: 13 },
      { name: 'nombre', label: 'Nombre', validate: V.soloLetras },
      { name: 'segundoNombre', label: 'Segundo nombre', validate: () => null, ...OPCIONAL },
      { name: 'apellidoPaterno', label: 'Apellido paterno', validate: V.soloLetras },
      { name: 'apellidoMaterno', label: 'Apellido materno', validate: V.soloLetras },
      { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', validate: V.fechaNacimiento },
      { name: 'genero', label: 'Genero', options: GENEROS, validate: V.req },
      { name: 'estadoCivil', label: 'Estado civil', options: ESTADO_CIVIL, validate: V.req },
      { name: 'paisNacimiento', label: 'Pais de nacimiento', validate: V.req },
      { name: 'nacionalidad', label: 'Nacionalidad', validate: V.req },
    ],
  },
  laborales: {
    titulo: 'Datos laborales',
    ocr: ['numSegSocial', 'entidadFederativa', 'centroTrabajo', 'puesto', 'fechaIngreso'],
    campos: [
      { name: 'numSegSocial', label: 'Numero de seguridad social', validate: V.nss, inputMode: 'numeric', maxLength: 11 },
      { name: 'entidadFederativa', label: 'Entidad federativa', options: ESTADOS_MX, validate: V.req },
      { name: 'centroTrabajo', label: 'Centro de trabajo', validate: V.req },
      { name: 'puesto', label: 'Puesto', validate: V.req },
      { name: 'fechaIngreso', label: 'Fecha de ingreso laboral', type: 'date', validate: V.fechaPasada },
    ],
  },
  contacto: {
    titulo: 'Datos de contacto',
    ocr: ['telefonoCelular', 'calle', 'cp', 'colonia', 'delegacion', 'estado', 'pais'],
    campos: [
      { name: 'telefonoCelular', label: 'Telefono celular', validate: V.telefono, type: 'tel', inputMode: 'numeric', maxLength: 10 },
      { name: 'telefonoDomicilio', label: 'Telefono de domicilio', validate: V.telefonoOpcional, type: 'tel', inputMode: 'numeric', maxLength: 10, ...OPCIONAL },
      { name: 'telefonoOficina', label: 'Telefono de oficina', validate: V.telefonoOpcional, type: 'tel', inputMode: 'numeric', maxLength: 10, ...OPCIONAL },
      { name: 'calle', label: 'Calle y numero', validate: V.req },
      { name: 'cp', label: 'Codigo postal', validate: V.cp, inputMode: 'numeric', maxLength: 5 },
      { name: 'colonia', label: 'Colonia', validate: V.req },
      { name: 'delegacion', label: 'Delegacion / Municipio', validate: V.req },
      { name: 'estado', label: 'Estado', options: ESTADOS_MX, validate: V.req },
      { name: 'pais', label: 'Pais', validate: V.req },
    ],
  },
  ingresos: {
    titulo: 'Origen y destino de ingresos',
    ocr: ['ingresoMensualComprobable'],
    campos: [
      { name: 'ingresoMensualComprobable', label: 'Ingreso mensual comprobable (MXN)', type: 'number', inputMode: 'numeric', validate: (v) => V.entero(v, { min: 3000, max: 200000 }), hint: 'Define la capacidad de pago usada en el cotizador.' },
      { name: 'origenRecursos', label: 'Origen de los recursos', options: ORIGEN_RECURSOS, validate: V.req },
      { name: 'destinoRecursos', label: 'Destino de los recursos', options: DESTINO_RECURSOS, validate: V.req },
      { name: 'liquidacionAnticipada', label: 'Tiene planeada la liquidacion anticipada', options: ['No', 'Si'], validate: V.req },
    ],
  },
  bancarios: {
    titulo: 'Datos bancarios',
    ocr: [],
    campos: [
      { name: 'banco', label: 'Banco', options: BANCOS, validate: V.req },
      { name: 'cuentaClabe', label: 'Cuenta CLABE', validate: V.clabe, mono: true, inputMode: 'numeric', maxLength: 18, hint: '18 digitos. Debe coincidir con los datos en la dependencia.' },
    ],
  },
};

export default function InfoSolicitud() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, setTabData, markTab, toggleDoc } = useStore();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const q = sp.get('tab');
    if (q && TABS_INFO.includes(q)) return q;
    return TABS_INFO.find((t) => !solicitud.tabsCompletadas[t]) || 'personales';
  });
  const [forceSig, setForceSig] = useState(0);
  const [scanOpen, setScanOpen] = useState(false);

  const def = TAB_DEFS[tab];
  const valores = solicitud.datos[tab] || {};
  const idxTab = TABS_INFO.indexOf(tab);

  // Escaneo de documento del tab actual (talon de pagos / estado de cuenta).
  const escaneoCfg = ESCANEO_TAB[tab] || null;
  const escaneado = escaneoCfg ? !!solicitud.documentos[escaneoCfg.doc] : false;
  const camposEscaneo = escaneoCfg ? Object.keys(escaneoCfg.campos) : [];

  useEffect(() => {
    setScanOpen(false);
  }, [tab]);

  const aceptarEscaneo = () => {
    setTabData(tab, { ...escaneoCfg.campos });
    toggleDoc(escaneoCfg.doc, true);
    track('click', { target: `info_${tab}_escaneo_aceptado`, doc: escaneoCfg.doc });
    setScanOpen(false);
  };

  const erroresTab = useMemo(() => {
    const out = {};
    for (const c of def.campos) {
      if (c.required === false && (valores[c.name] == null || valores[c.name] === '')) continue;
      const e = c.validate ? c.validate(valores[c.name]) : null;
      if (e) out[c.name] = e;
    }
    return out;
  }, [def, valores]);

  const tabValido = Object.keys(erroresTab).length === 0;

  const continuar = () => {
    if (!tabValido) {
      setForceSig((n) => n + 1);
      track('click', { target: `info_${tab}_continuar_bloqueado`, errores: Object.keys(erroresTab) });
      return;
    }
    markTab(tab, true);
    track('click', { target: `info_${tab}_continuar_ok` });
    if (idxTab < TABS_INFO.length - 1) {
      setTab(TABS_INFO[idxTab + 1]);
    } else {
      navigate('/informacion/confirmar');
    }
  };

  const atras = () => {
    if (idxTab === 0) return;
    setTab(TABS_INFO[idxTab - 1]);
    track('click', { target: `info_${tab}_atras` });
  };

  const irAPaso = (i) => {
    // solo se puede volver a un paso ya completado
    if (i < idxTab || solicitud.tabsCompletadas[TABS_INFO[i]]) {
      setTab(TABS_INFO[i]);
      track('click', { target: `info_paso_${TABS_INFO[i]}` });
    }
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Solicitud de credito" right={<CerrarSolicitud />} />
      <Content>
        <div className="stepper">
          {TABS_INFO.map((t, i) => {
            const hecho = !!solicitud.tabsCompletadas[t];
            const actual = i === idxTab;
            const clickable = i < idxTab || hecho;
            return (
              <React.Fragment key={t}>
                <button
                  type="button"
                  className={`dot${actual ? ' current' : ''}${hecho && !actual ? ' done' : ''}`}
                  onClick={() => irAPaso(i)}
                  disabled={!clickable && !actual}
                  aria-label={`Paso ${i + 1}: ${TAB_LABEL[t]}`}
                >
                  {hecho && !actual ? '✓' : i + 1}
                </button>
                {i < TABS_INFO.length - 1 && (
                  <span className={`stepper-bar${hecho ? ' done' : ''}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <span className="tiny">
          Paso {idxTab + 1} de {TABS_INFO.length}
        </span>
        <h1 style={{ marginTop: 2 }}>{def.titulo}</h1>
        {(escaneado || (solicitud.auth.ocrAplicado && def.ocr.length > 0)) && (
          <p className="tiny" style={{ marginBottom: 12 }}>
            Los campos resaltados se autollenaron con un documento escaneado. Verifica y
            corrige si es necesario.
          </p>
        )}

        {escaneoCfg && (
          <>
            <div className="sec-label" style={{ marginTop: 4 }}>
              Escaneo
            </div>
            <button
              type="button"
              className={`scan-ine${escaneado ? ' done' : ''}`}
              onClick={() => {
                track('click', { target: `info_${tab}_escanear` });
                setScanOpen(true);
              }}
            >
              <span>{escaneoCfg.label}</span>
              <span className="scan-ico" aria-hidden="true">
                {escaneado ? '✓' : '↑'}
              </span>
            </button>
            {escaneado ? (
              <p className="tiny scan-hint">
                El {escaneoCfg.label} ha sido escaneado y agregado a la lista de documentos.
              </p>
            ) : (
              <p className="tiny scan-hint">
                Escanea el {escaneoCfg.label.toLowerCase()} para autollenar los campos, o
                capturalos a mano.
              </p>
            )}
            <div className="sec-label">{def.titulo}</div>
          </>
        )}

        {def.campos.map((c) => (
          <Field
            key={c.name}
            name={c.name}
            tab={tab}
            label={c.label}
            type={c.type}
            options={c.options}
            inputMode={c.inputMode}
            maxLength={c.maxLength}
            hint={c.hint}
            required={c.required !== false}
            prefilled={
              ((solicitud.auth.ocrAplicado && def.ocr.includes(c.name)) ||
                (escaneado && camposEscaneo.includes(c.name))) &&
              !!valores[c.name]
            }
            value={valores[c.name] ?? ''}
            validate={c.validate}
            forceValidateSignal={forceSig}
            onChange={(v) => setTabData(tab, { [c.name]: v })}
          />
        ))}
      </Content>
      <FooterActions>
        <div className="row" style={{ gap: 8 }}>
          <Button
            variant="ghost"
            className="grow"
            disabled={idxTab === 0}
            onClick={atras}
            track={`info_${tab}_atras`}
          >
            ← Atras
          </Button>
          <Button variant="primary" className="grow" onClick={continuar} track={`info_${tab}_continuar`}>
            {idxTab < TABS_INFO.length - 1 ? 'Continuar →' : 'Revisar datos →'}
          </Button>
        </div>
      </FooterActions>
      {scanOpen && escaneoCfg && (
        <DocScanSheet cfg={escaneoCfg} onAceptar={aceptarEscaneo} onClose={() => setScanOpen(false)} />
      )}
    </Screen>
  );
}
