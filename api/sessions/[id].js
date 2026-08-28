import { getSesion } from '../_lib/blob.js';
import { requireAuth } from '../_lib/auth.js';
import { sesionMarkdown } from '../_lib/format.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const { id, format } = req.query;
  let s;
  try {
    s = await getSesion(id);
  } catch (e) {
    return res.status(500).json({ error: 'error', detalle: String(e?.message || e) });
  }
  if (!s) return res.status(404).json({ error: 'sesion no encontrada' });

  if (format === 'md') {
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    return res.status(200).send(sesionMarkdown(s));
  }
  return res.status(200).json(s);
}
