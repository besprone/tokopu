import { getSesiones } from './_lib/blob.js';
import { requireAuth } from './_lib/auth.js';
import { sesionesCSV } from './_lib/format.js';

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  let todas;
  try {
    todas = await getSesiones();
  } catch (e) {
    return res.status(500).json({ error: 'error', detalle: String(e?.message || e) });
  }

  if (req.query.format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="toko-sesiones.csv"');
    return res.status(200).send(sesionesCSV(todas));
  }

  res.setHeader('Content-Disposition', 'attachment; filename="toko-sesiones.json"');
  return res.status(200).json({
    generadoISO: new Date().toISOString(),
    total: todas.length,
    sesiones: todas,
  });
}
