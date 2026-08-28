import { guardarSesion, listarSesiones, borrarTodas } from './_lib/blob.js';
import { requireAuth, checkIngest } from './_lib/auth.js';

export default async function handler(req, res) {
  // Guardado (lo llama el navegador del participante al enviar el SUS).
  if (req.method === 'POST') {
    if (!checkIngest(req)) return res.status(401).json({ error: 'ingesta' });
    const s = req.body;
    if (!s || !s.meta || !s.meta.sessionId || !Array.isArray(s.eventos)) {
      return res.status(400).json({ error: 'payload invalido' });
    }
    if (JSON.stringify(s).length > 2_000_000) {
      return res.status(413).json({ error: 'sesion muy grande' });
    }
    try {
      await guardarSesion(s);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: 'no se pudo guardar', detalle: String(e?.message || e) });
    }
  }

  // Lista y borrado: solo moderador.
  if (req.method === 'GET') {
    if (!requireAuth(req, res)) return;
    try {
      return res.status(200).json({ sesiones: await listarSesiones() });
    } catch (e) {
      return res.status(500).json({ error: 'no se pudo listar', detalle: String(e?.message || e) });
    }
  }

  if (req.method === 'DELETE') {
    if (!requireAuth(req, res)) return;
    try {
      const n = await borrarTodas();
      return res.status(200).json({ ok: true, borradas: n });
    } catch (e) {
      return res.status(500).json({ error: 'no se pudo borrar', detalle: String(e?.message || e) });
    }
  }

  return res.status(405).json({ error: 'metodo' });
}
