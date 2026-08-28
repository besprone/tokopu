// ---------------------------------------------------------------------------
// Capa de metricas de Toko
// track(evento, datos) registra eventos con timestamp en memoria + localStorage.
// Exporta la sesion completa a JSON y CSV.
// ---------------------------------------------------------------------------

import { enviarSesionAPI } from '../moderador/api.js';

const STORAGE_EVENTS = 'toko.metrics.events.v1';
const STORAGE_META = 'toko.metrics.meta.v1';

// Campos que NUNCA se serializan en claro (se guarda solo longitud + validez).
const PII_FIELDS = new Set([
  'curp', 'rfc', 'nss', 'numeroSeguridadSocial', 'numSegSocial',
  'clabe', 'cuentaClabe', 'email', 'celular', 'telefono', 'telefonoCelular',
  'telefonoDomicilio', 'telefonoOficina', 'nombre', 'segundoNombre',
  'apellidoPaterno', 'apellidoMaterno', 'fechaNacimiento', 'fechaIngreso',
  'calle', 'direccion', 'cp', 'codigoPostal', 'colonia', 'delegacion',
  'centroTrabajo', 'otp',
]);

let events = [];
let meta = null;
const listeners = new Set();

function now() {
  return typeof performance !== 'undefined' && performance.now
    ? performance.now()
    : Date.now();
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function loadFromStorage() {
  events = safeParse(localStorage.getItem(STORAGE_EVENTS), []);
  meta = safeParse(localStorage.getItem(STORAGE_META), null);
}

function persist() {
  try {
    localStorage.setItem(STORAGE_EVENTS, JSON.stringify(events));
    localStorage.setItem(STORAGE_META, JSON.stringify(meta));
  } catch {
    /* cuota excedida: la sesion sigue en memoria */
  }
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn({ events, meta });
    } catch {
      /* noop */
    }
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getEvents() {
  return events.slice();
}

export function getMeta() {
  return meta ? { ...meta } : null;
}

function esCampoPii(datos) {
  if (datos.pii === true) return true;
  if (datos.pii === false) return false;
  const nombre = datos.campo || datos.name;
  return typeof nombre === 'string' && PII_FIELDS.has(nombre);
}

function redact(datos) {
  const d = datos || {};
  const out = {};
  const piiField = esCampoPii(d);

  for (const [k, v] of Object.entries(d)) {
    if (k === 'pii') continue;

    // El valor de un campo sensible nunca se serializa en claro:
    // se guarda solo longitud y (si aplica) validez.
    if (k === 'valor' && piiField) {
      if (typeof v === 'string') out.valor_len = v.length;
      else out.valor_omitido = true;
      continue;
    }

    // Clave que ES en si misma un dato sensible (p. ej. track('x', { curp })).
    if (PII_FIELDS.has(k)) {
      if (typeof v === 'string') out[`${k}_len`] = v.length;
      else out[`${k}_omitido`] = true;
      continue;
    }

    out[k] = v;
  }

  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

export function initSession({ force = false, moderador = null, participante = null } = {}) {
  if (events.length === 0 && meta == null) loadFromStorage();
  if (!meta || force) {
    events = [];
    meta = {
      sessionId:
        (crypto.randomUUID && crypto.randomUUID()) ||
        `s-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      startedAtISO: new Date().toISOString(),
      startPerf: now(),
      moderador,
      participante,
      userAgent: navigator.userAgent,
      idioma: navigator.language,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      pantalla: { w: window.screen?.width, h: window.screen?.height, dpr: window.devicePixelRatio },
      appVersion: '0.1.0',
    };
    persist();
    track('session_start', {
      sessionId: meta.sessionId,
      userAgent: meta.userAgent,
      viewport: meta.viewport,
    });
  } else {
    // reanuda sesion existente: recalibra el reloj relativo
    meta.startPerf = now() - (meta._lastRelMs || 0);
  }
  return meta;
}

export function resetSession(extra = {}) {
  // Si la sesion saliente tuvo actividad real y no se envio, la guardamos
  // como parcial antes de borrarla (por si el participante la abandono).
  if (
    meta &&
    !meta._enviada &&
    events.some((e) => !['session_start', 'route_change'].includes(e.evento))
  ) {
    try {
      enviarSesion(construirSesion({ completa: false }));
    } catch {
      /* noop */
    }
  }
  localStorage.removeItem(STORAGE_EVENTS);
  localStorage.removeItem(STORAGE_META);
  events = [];
  meta = null;
  initSession({ force: true, ...extra });
  notify();
}

export function track(evento, datos = {}) {
  if (!meta) initSession();
  const tRelMs = Math.round(now() - meta.startPerf);
  meta._lastRelMs = tRelMs;
  const ev = {
    seq: events.length + 1,
    evento,
    tsISO: new Date().toISOString(),
    tRelMs,
    ...redact(datos),
  };
  events.push(ev);
  persist();
  notify();
  return ev;
}

// ------------------------------ Derivados -----------------------------------

export function resumenEventos() {
  const porTipo = {};
  for (const e of events) porTipo[e.evento] = (porTipo[e.evento] || 0) + 1;
  return porTipo;
}

export function tareas() {
  const map = {};
  for (const e of events) {
    if (e.evento === 'task_start') {
      map[e.tarea] = map[e.tarea] || {};
      map[e.tarea].inicioISO = e.tsISO;
      map[e.tarea].inicioRelMs = e.tRelMs;
    }
    if (e.evento === 'task_complete') {
      map[e.tarea] = map[e.tarea] || {};
      map[e.tarea].finISO = e.tsISO;
      map[e.tarea].finRelMs = e.tRelMs;
      map[e.tarea].resultado = e.resultado;
      if (map[e.tarea].inicioRelMs != null)
        map[e.tarea].duracionMs = e.tRelMs - map[e.tarea].inicioRelMs;
    }
    if (e.evento === 'seq_answer') {
      map[e.tarea] = map[e.tarea] || {};
      map[e.tarea].seq = e.score;
    }
    if (e.evento === 'field_error') {
      map[e.tarea] = map[e.tarea] || {};
      map[e.tarea].errores = (map[e.tarea].errores || 0) + 1;
    }
  }
  return map;
}

// SUS: items impares -> score-1 ; items pares -> 5-score ; suma * 2.5
export function susResultado() {
  const respuestas = {};
  for (const e of events) {
    if (e.evento === 'sus_answer' && e.item >= 1 && e.item <= 10) {
      respuestas[e.item] = e.score;
    }
  }
  const items = Object.keys(respuestas).map(Number).sort((a, b) => a - b);
  if (items.length < 10) return { completo: false, respuestas, puntaje: null, items };
  let suma = 0;
  for (let i = 1; i <= 10; i++) {
    const r = respuestas[i];
    suma += i % 2 === 1 ? r - 1 : 5 - r;
  }
  const puntaje = suma * 2.5;
  return {
    completo: true,
    respuestas,
    puntaje,
    interpretacion: interpretaSus(puntaje),
    items,
  };
}

function interpretaSus(p) {
  if (p >= 85) return 'Excelente (A)';
  if (p >= 72) return 'Bueno (B)';
  if (p >= 52) return 'Aceptable (C/D)';
  return 'Pobre (F)';
}

// --------------------------- Exportacion -----------------------------------

export function exportarJSON() {
  return {
    meta: getMeta(),
    generadoISO: new Date().toISOString(),
    resumen: {
      totalEventos: events.length,
      porTipo: resumenEventos(),
    },
    tareas: tareas(),
    sus: susResultado(),
    eventos: events,
  };
}

const CSV_COLS = [
  'seq',
  'tsISO',
  'tRelMs',
  'evento',
  'tarea',
  'resultado',
  'campo',
  'tab',
  'valor',
  'valor_len',
  'valido',
  'regla',
  'target',
  'from',
  'to',
  'item',
  'pregunta',
  'score',
  'nota',
  'extra',
];

function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportarCSV() {
  const lines = [CSV_COLS.join(',')];
  for (const e of events) {
    const known = new Set(CSV_COLS);
    const extra = {};
    for (const [k, v] of Object.entries(e)) {
      if (!known.has(k)) extra[k] = v;
    }
    const row = CSV_COLS.map((c) => {
      if (c === 'extra') return csvEscape(Object.keys(extra).length ? JSON.stringify(extra) : '');
      return csvEscape(e[c]);
    });
    lines.push(row.join(','));
  }
  return lines.join('\n');
}

function descargarArchivo(nombre, contenido, tipo) {
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function descargarSesion() {
  const sid = (meta?.sessionId || 'sesion').slice(0, 8);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  track('click', { target: 'descargar_sesion' });
  descargarArchivo(
    `toko-${sid}-${stamp}.json`,
    JSON.stringify(exportarJSON(), null, 2),
    'application/json'
  );
  descargarArchivo(`toko-${sid}-${stamp}.csv`, exportarCSV(), 'text/csv;charset=utf-8');
}

// ------------------- Archivo de sesiones + envio al backend -------------------

const STORAGE_ARCHIVO = 'toko.sesiones.v1';

export function marcarEnviada() {
  if (meta) meta._enviada = true;
}

// Payload completo de la sesion actual (para el backend y el archivo local).
export function construirSesion({ completa = false } = {}) {
  const solicitud = safeParse(localStorage.getItem('toko.solicitud.v1'), null);
  return {
    ...exportarJSON(),
    completa: !!completa,
    finISO: new Date().toISOString(),
    solicitud,
  };
}

function leerArchivo() {
  return safeParse(localStorage.getItem(STORAGE_ARCHIVO), []);
}
function escribirArchivo(arr) {
  try {
    localStorage.setItem(STORAGE_ARCHIVO, JSON.stringify(arr));
  } catch {
    /* cuota */
  }
}

export function guardarSesionLocal(sesion) {
  const arr = leerArchivo();
  const id = sesion.meta?.sessionId;
  const i = arr.findIndex((x) => x?.meta?.sessionId === id);
  if (i >= 0) {
    arr[i] = { ...sesion, sincronizada: arr[i].sincronizada || false };
  } else {
    arr.push({ ...sesion, sincronizada: false });
  }
  while (arr.length > 100) arr.shift();
  escribirArchivo(arr);
}

export function listarSesionesLocales() {
  return leerArchivo().slice().reverse();
}
export function getSesionLocal(id) {
  return leerArchivo().find((x) => x?.meta?.sessionId === id) || null;
}
export function borrarSesionesLocales() {
  localStorage.removeItem(STORAGE_ARCHIVO);
}

export function exportarLocalesJSON() {
  const arr = leerArchivo();
  return { generadoISO: new Date().toISOString(), total: arr.length, sesiones: arr };
}

export function exportarLocalesCSV() {
  const cols = [
    'sessionId', 'participante', 'seq', 'tsISO', 'tRelMs', 'evento', 'tarea', 'resultado',
    'campo', 'tab', 'valor', 'valor_len', 'valido', 'regla', 'target', 'from', 'to', 'item',
    'score', 'nota', 'extra',
  ];
  const lines = [cols.join(',')];
  for (const s of leerArchivo()) {
    const sid = s.meta?.sessionId || '';
    const part = s.meta?.participante || '';
    for (const e of s.eventos || []) {
      const known = new Set(cols);
      const extra = {};
      for (const [k, v] of Object.entries(e)) if (!known.has(k)) extra[k] = v;
      lines.push(
        cols
          .map((c) => {
            if (c === 'sessionId') return csvEscape(sid);
            if (c === 'participante') return csvEscape(part);
            if (c === 'extra')
              return csvEscape(Object.keys(extra).length ? JSON.stringify(extra) : '');
            return csvEscape(e[c]);
          })
          .join(',')
      );
    }
  }
  return lines.join('\n');
}

// Guarda local + intenta enviar al backend. Devuelve true si se sincronizo.
export async function enviarSesion(sesion) {
  guardarSesionLocal(sesion);
  marcarEnviada();
  try {
    await enviarSesionAPI(sesion);
    const arr = leerArchivo();
    const i = arr.findIndex((x) => x?.meta?.sessionId === sesion.meta?.sessionId);
    if (i >= 0) {
      arr[i].sincronizada = true;
      escribirArchivo(arr);
    }
    return true;
  } catch {
    return false; // queda pendiente; se reintenta en flushPendientes
  }
}

// Reintenta enviar las sesiones locales que aun no se sincronizaron.
export async function flushPendientes() {
  const arr = leerArchivo();
  const pend = arr.filter((x) => x && !x.sincronizada);
  if (!pend.length) return;
  let mod = false;
  for (const s of pend) {
    try {
      await enviarSesionAPI(s);
      s.sincronizada = true;
      mod = true;
    } catch {
      /* sigue pendiente */
    }
  }
  if (mod) escribirArchivo(arr);
}
