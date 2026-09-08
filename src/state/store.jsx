import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';
import { FOLIO_DEMO } from '../domain/catalogs.js';

const STORAGE = 'toko.solicitud.v1';

export const DOCS_AUTOGRAFA = [
  { grupo: 'Solicitud de credito', id: 'ine', nombre: 'INE' },
  { grupo: 'Solicitud de credito', id: 'edo-cuenta', nombre: 'Estado de cuenta' },
  { grupo: 'Solicitud de credito', id: 'comprobante-dom', nombre: 'Comprobante de domicilio' },
  { grupo: 'Solicitud', id: 'carta-bienvenida', nombre: 'Carta de bienvenida' },
  { grupo: 'Solicitud', id: 'solicitud-h1', nombre: 'Solicitud - Hoja 1' },
  { grupo: 'Solicitud', id: 'solicitud-h2', nombre: 'Solicitud - Hoja 2' },
  { grupo: 'Aviso de privacidad', id: 'aviso-h1', nombre: 'Aviso de privacidad - Hoja 1' },
  { grupo: 'Aviso de privacidad', id: 'aviso-h2', nombre: 'Aviso de privacidad - Hoja 2' },
  { grupo: 'Contrato', id: 'contrato-caratula', nombre: 'Caratula' },
  { grupo: 'Contrato', id: 'contrato-h1', nombre: 'Hoja 1' },
  { grupo: 'Contrato', id: 'contrato-h2', nombre: 'Hoja 2' },
  { grupo: 'Talones de pago', id: 'talon-1', nombre: 'Talon de pagos 1' },
  { grupo: 'Talones de pago', id: 'talon-2', nombre: 'Talon de pagos 2' },
];

export const DOCS_DIGITAL = [
  { grupo: 'Documentos del cliente', id: 'ine', nombre: 'INE' },
  { grupo: 'Documentos del cliente', id: 'edo-cuenta', nombre: 'Estado de cuenta' },
  { grupo: 'Documentos del cliente', id: 'comprobante-dom', nombre: 'Comprobante de domicilio' },
  { grupo: 'Talones de pago', id: 'talon-1', nombre: 'Talon de pagos 1' },
  { grupo: 'Talones de pago', id: 'talon-2', nombre: 'Talon de pagos 2' },
];

export const TABS_INFO = ['personales', 'laborales', 'contacto', 'ingresos', 'bancarios'];

function estadoInicial() {
  return {
    folio: FOLIO_DEMO,
    creadaISO: null,
    // Bloque 1
    iniciada: false,
    dependencia: '',
    convenio: '',
    tipoFirma: 'autografa', // 'autografa' | 'digital'
    // Bloque 2
    auth: {
      celular: '',
      email: '',
      otpValidado: false,
      biometriaCliente: false,
      ineFrente: false,
      ineReverso: false,
      ocrAplicado: false,
      firmaAsesor: false,
      firmaCliente: false,
      // Firma digital remota (link al cliente por WhatsApp/SMS)
      firmaClienteEnviada: false,
      firmaClienteEnviadaISO: null,
      firmaClienteCanal: null, // 'whatsapp' | 'sms'
      firmaClienteISO: null,
    },
    // Bloque 3
    capacidadPago: null,
    oferta: null, // { monto, nQuincenas, origen, resumen, confirmada }
    // Bloque 4
    datos: {
      personales: {},
      laborales: {},
      contacto: {},
      ingresos: {},
      bancarios: {},
    },
    tabsCompletadas: {},
    datosConfirmados: false,
    // Bloque 5
    documentos: {},
    enviada: false,
    enviadaISO: null,
  };
}

function isObj(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}

function deepMerge(base, patch) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    out[k] = isObj(v) && isObj(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out;
}

function reducer(state, action) {
  switch (action.type) {
    case 'PATCH':
      return deepMerge(state, action.patch);
    case 'SET_TAB_DATA': {
      const datos = {
        ...state.datos,
        [action.tab]: { ...state.datos[action.tab], ...action.values },
      };
      return { ...state, datos };
    }
    case 'MARK_TAB':
      return {
        ...state,
        tabsCompletadas: { ...state.tabsCompletadas, [action.tab]: action.done },
      };
    case 'TOGGLE_DOC':
      return {
        ...state,
        documentos: { ...state.documentos, [action.id]: action.value },
      };
    case 'RESET':
      return estadoInicial();
    default:
      return state;
  }
}

function cargar() {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (!raw) return estadoInicial();
    return deepMerge(estadoInicial(), JSON.parse(raw));
  } catch {
    return estadoInicial();
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  const [solicitud, dispatch] = useReducer(reducer, undefined, cargar);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE, JSON.stringify(solicitud));
    } catch {
      /* noop */
    }
  }, [solicitud]);

  const api = useMemo(
    () => ({
      solicitud,
      patch: (patch) => dispatch({ type: 'PATCH', patch }),
      setTabData: (tab, values) => dispatch({ type: 'SET_TAB_DATA', tab, values }),
      markTab: (tab, done = true) => dispatch({ type: 'MARK_TAB', tab, done }),
      toggleDoc: (id, value) => dispatch({ type: 'TOGGLE_DOC', id, value }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [solicitud]
  );

  return <StoreCtx.Provider value={api}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore fuera de StoreProvider');
  return ctx;
}

// --------------------------- Progreso -------------------------------------

const PESOS = { b1: 10, b2: 25, b3: 20, b4: 30, b5: 15 };

export function progresoSolicitud(s) {
  // Bloque 1
  const b1 =
    (s.iniciada ? 0.25 : 0) +
    (s.dependencia ? 0.25 : 0) +
    (s.convenio ? 0.25 : 0) +
    (s.tipoFirma ? 0.25 : 0);

  // Bloque 2 (identificacion y autenticacion). En autografa la firma del
  // cliente es parte de este bloque; en digital es un bloque aparte (la firma
  // remota se hace al final, con el link) y NO cuenta aqui.
  const pasos2 = [
    Boolean(s.auth.celular && s.auth.email),
    s.auth.otpValidado,
    s.auth.biometriaCliente,
    s.auth.ineFrente && s.auth.ineReverso,
    s.auth.ocrAplicado,
    s.auth.firmaAsesor,
  ];
  if (s.tipoFirma === 'autografa') pasos2.push(s.auth.firmaCliente);
  const b2 = pasos2.filter(Boolean).length / pasos2.length;

  // Bloque 3
  const b3 = s.oferta?.confirmada ? 1 : s.oferta?.monto ? 0.4 : 0;

  // Bloque 4
  const tabsOK = TABS_INFO.filter((t) => s.tabsCompletadas[t]).length;
  const b4 = (tabsOK / TABS_INFO.length) * 0.8 + (s.datosConfirmados ? 0.2 : 0);

  // Bloque 5
  const docs = s.tipoFirma === 'autografa' ? DOCS_AUTOGRAFA : DOCS_DIGITAL;
  const docsOK = docs.filter((d) => s.documentos[d.id]).length;
  const b5 = (docs.length ? docsOK / docs.length : 0) * 0.8 + (s.enviada ? 0.2 : 0);

  const pct =
    b1 * PESOS.b1 + b2 * PESOS.b2 + b3 * PESOS.b3 + b4 * PESOS.b4 + b5 * PESOS.b5;

  const resultado = {
    pct: Math.round(pct),
    bloques: [
      { id: 'b1', label: 'Iniciar solicitud', pct: Math.round(b1 * 100) },
      { id: 'b2', label: 'Identificacion y autenticacion', pct: Math.round(b2 * 100) },
      { id: 'b3', label: 'Seleccionar oferta', pct: Math.round(b3 * 100) },
      {
        id: 'b4',
        label: 'Informacion de la solicitud',
        pct: Math.round(b4 * 100),
        extra: `${tabsOK} de ${TABS_INFO.length} completadas`,
      },
      {
        id: 'b5',
        label: 'Documentos',
        pct: Math.round(b5 * 100),
        extra: `${docsOK} de ${docs.length} documentos`,
      },
    ],
  };
  return resultado;
}

// Hay una solicitud empezada y sin enviar -> se puede reanudar desde
// "Guardadas" en la pantalla de Solicitudes.
export function hayBorrador(s) {
  return !!(s.iniciada && !s.enviada);
}

// Solo firma digital: la firma remota del cliente aun no se completa.
export function firmaDigitalPendiente(s) {
  return s.tipoFirma === 'digital' && !s.auth.firmaCliente;
}

// Una tarea "completada" no se puede volver a abrir desde el hub.
export function tareaCompletada(s, id) {
  switch (id) {
    case 'iniciar_solicitud':
      return !!(s.iniciada && s.dependencia && s.convenio);
    case 'identificacion':
      return progresoSolicitud(s).bloques.find((b) => b.id === 'b2').pct === 100;
    case 'seleccionar_oferta':
      return !!s.oferta?.confirmada;
    case 'informacion_solicitud':
      return !!s.datosConfirmados;
    case 'documentos_envio':
      return !!s.enviada;
    default:
      return false;
  }
}
