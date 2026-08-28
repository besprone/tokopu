import { checkPassword, issueToken } from './_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'metodo' });
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    await new Promise((r) => setTimeout(r, 600)); // frena fuerza bruta
    return res.status(401).json({ error: 'clave incorrecta' });
  }
  return res.status(200).json({ token: issueToken(7), expDias: 7 });
}
