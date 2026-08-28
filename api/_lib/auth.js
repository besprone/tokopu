import crypto from 'node:crypto';

const b64 = (s) => Buffer.from(s).toString('base64url');

function sign(payloadStr) {
  return crypto.createHmac('sha256', process.env.MOD_KEY || '').update(payloadStr).digest('base64url');
}

// Token sin estado: base64url(JSON({exp})).firmaHMAC. Se verifica recomputando
// la firma con MOD_KEY. Rotar MOD_KEY invalida todos los tokens.
export function issueToken(days = 7) {
  const payload = b64(JSON.stringify({ exp: Date.now() + days * 864e5 }));
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  if (!process.env.MOD_KEY) return false;
  const [payload, sig] = token.split('.');
  const expected = sign(payload);
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function checkPassword(pw) {
  const key = process.env.MOD_KEY || '';
  if (!pw || !key) return false;
  const a = Buffer.from(String(pw));
  const b = Buffer.from(key);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function requireAuth(req, res) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!verifyToken(token)) {
    res.status(401).json({ error: 'no autorizado' });
    return false;
  }
  return true;
}

export function checkIngest(req) {
  const t = req.headers['x-ingest-token'];
  return !!process.env.INGEST_TOKEN && t === process.env.INGEST_TOKEN;
}
