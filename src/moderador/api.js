// Cliente del backend de sesiones. Si el backend no responde (dev local sin
// `vercel dev`, o sin conexion), los llamados lanzan y las pantallas caen a
// modo local (localStorage).

const INGEST = import.meta.env.VITE_INGEST_TOKEN || '';
const TOKEN_KEY = 'toko.modtoken';

export function getModToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}
export function setModToken(t) {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}
export function cerrarSesionMod() {
  setModToken('');
}
export function haySesionMod() {
  return !!getModToken();
}

function authHeaders() {
  return { Authorization: `Bearer ${getModToken()}` };
}

// ---- participante ----

export async function enviarSesionAPI(sesion) {
  const r = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-ingest-token': INGEST },
    body: JSON.stringify(sesion),
  });
  if (!r.ok) throw new Error(`POST /api/sessions -> ${r.status}`);
  return r.json();
}

// Envio "fire and forget" que sobrevive al cierre de la pestana / bloqueo del
// telefono: sendBeacon (sin headers -> el token va en el body) y, si no esta,
// fetch con keepalive. Para sesiones parciales al ocultar la pagina.
export function enviarSesionBeacon(sesion) {
  try {
    const payload = JSON.stringify({ ...sesion, ingestToken: INGEST });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon('/api/sessions', blob)) return true;
    }
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ingest-token': INGEST },
      body: payload,
      keepalive: true,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}

// ---- moderador ----

export async function loginMod(password) {
  const r = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (r.status === 401) throw new Error('clave');
  if (!r.ok) throw new Error('backend');
  const { token } = await r.json();
  setModToken(token);
  return token;
}

export async function listarSesionesAPI() {
  const r = await fetch('/api/sessions', { headers: authHeaders() });
  if (r.status === 401) throw new Error('401');
  if (!r.ok) throw new Error('backend');
  return (await r.json()).sesiones;
}

export async function getSesionAPI(id) {
  const r = await fetch(`/api/sessions/${encodeURIComponent(id)}`, { headers: authHeaders() });
  if (r.status === 401) throw new Error('401');
  if (!r.ok) throw new Error('backend');
  return r.json();
}

export async function borrarTodasAPI() {
  const r = await fetch('/api/sessions', { method: 'DELETE', headers: authHeaders() });
  if (r.status === 401) throw new Error('401');
  if (!r.ok) throw new Error('backend');
  return r.json();
}

function descargarBlob(nombre, texto, tipo) {
  const blob = new Blob([texto], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function descargarExportAPI(format) {
  const r = await fetch(`/api/export?format=${format}`, { headers: authHeaders() });
  if (!r.ok) throw new Error('backend');
  const txt = await r.text();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  descargarBlob(
    `toko-sesiones-${stamp}.${format === 'csv' ? 'csv' : 'json'}`,
    txt,
    format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json'
  );
}

export async function descargarSesionAPI(id, format) {
  const r = await fetch(`/api/sessions/${encodeURIComponent(id)}?format=${format}`, {
    headers: authHeaders(),
  });
  if (!r.ok) throw new Error('backend');
  const txt = await r.text();
  descargarBlob(
    `toko-sesion-${String(id).slice(0, 8)}.${format === 'md' ? 'md' : 'json'}`,
    txt,
    format === 'md' ? 'text/markdown;charset=utf-8' : 'application/json'
  );
}

export { descargarBlob };
