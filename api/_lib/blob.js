import { put, list, del } from '@vercel/blob';
import { sesionMarkdown } from './format.js';

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

export async function guardarSesion(s) {
  const base = `sessions/${s.meta.sessionId}`;
  await put(`${base}.json`, JSON.stringify(s, null, 2), {
    access: 'public',
    contentType: 'application/json',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: TOKEN,
  });
  await put(`${base}.md`, sesionMarkdown(s), {
    access: 'public',
    contentType: 'text/markdown; charset=utf-8',
    allowOverwrite: true,
    addRandomSuffix: false,
    token: TOKEN,
  });
}

async function traerJSONs() {
  const { blobs } = await list({ prefix: 'sessions/', token: TOKEN });
  const jsons = blobs.filter((b) => b.pathname.endsWith('.json'));
  const out = [];
  for (const b of jsons) {
    try {
      const r = await fetch(b.url, { cache: 'no-store' });
      if (r.ok) out.push({ blob: b, sesion: await r.json() });
    } catch {
      /* ignora una sesion corrupta */
    }
  }
  return out;
}

function resumen(sesion, blob) {
  const m = sesion.meta || {};
  return {
    id: m.sessionId,
    nombre: m.participante || 'sin nombre',
    fechaISO: m.startedAtISO || null,
    finISO: sesion.finISO || null,
    completa: !!sesion.completa,
    nEventos: (sesion.eventos || []).length,
    sus: sesion.sus?.completo ? sesion.sus.puntaje : null,
    tamano: blob?.size || null,
  };
}

export async function listarSesiones() {
  const rows = await traerJSONs();
  return rows
    .map(({ blob, sesion }) => resumen(sesion, blob))
    .sort((a, z) => String(z.fechaISO || '').localeCompare(String(a.fechaISO || '')));
}

export async function getSesiones() {
  return (await traerJSONs()).map((r) => r.sesion);
}

export async function getSesion(id) {
  const { blobs } = await list({ prefix: `sessions/${id}.json`, token: TOKEN });
  const b = blobs.find((x) => x.pathname === `sessions/${id}.json`);
  if (!b) return null;
  const r = await fetch(b.url, { cache: 'no-store' });
  return r.ok ? r.json() : null;
}

export async function borrarTodas() {
  const { blobs } = await list({ prefix: 'sessions/', token: TOKEN });
  if (blobs.length) await del(blobs.map((b) => b.url), { token: TOKEN });
  return blobs.length;
}
