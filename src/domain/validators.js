// Validaciones reales para el formulario del bloque 4 (formato MX).

export const req = (v) =>
  v == null || String(v).trim() === '' ? 'Campo obligatorio' : null;

export function curp(v) {
  if (!v) return 'Campo obligatorio';
  const s = String(v).toUpperCase().trim();
  const re =
    /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CS|CH|CL|CM|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z]\d$/;
  return re.test(s) ? null : 'CURP invalida (18 caracteres)';
}

export function rfc(v) {
  if (!v) return 'Campo obligatorio';
  const s = String(v).toUpperCase().trim();
  const re = /^[A-ZÑ&]{4}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[A-Z0-9]{2}[0-9A]$/;
  return re.test(s) ? null : 'RFC invalido (13 caracteres, persona fisica)';
}

export function nss(v) {
  if (!v) return 'Campo obligatorio';
  const s = String(v).replace(/\s/g, '');
  return /^\d{11}$/.test(s) ? null : 'El NSS debe tener 11 digitos';
}

// CLABE: 18 digitos con digito verificador (ponderaciones 3,7,1).
export function clabe(v) {
  if (!v) return 'Campo obligatorio';
  const s = String(v).replace(/\s/g, '');
  if (!/^\d{18}$/.test(s)) return 'La CLABE debe tener 18 digitos';
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    suma += ((parseInt(s[i], 10) * pesos[i % 3]) % 10);
  }
  const dv = (10 - (suma % 10)) % 10;
  return dv === parseInt(s[17], 10) ? null : 'CLABE invalida (digito verificador)';
}

export function email(v) {
  if (!v) return 'Campo obligatorio';
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim())
    ? null
    : 'Correo electronico invalido';
}

export function telefono(v) {
  if (!v) return 'Campo obligatorio';
  const s = String(v).replace(/\D/g, '');
  return s.length === 10 ? null : 'El telefono debe tener 10 digitos';
}

export function telefonoOpcional(v) {
  if (!v || String(v).trim() === '') return null;
  return telefono(v);
}

export function cp(v) {
  if (!v) return 'Campo obligatorio';
  return /^\d{5}$/.test(String(v).trim()) ? null : 'El codigo postal debe tener 5 digitos';
}

export function fechaNacimiento(v) {
  if (!v) return 'Campo obligatorio';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Fecha invalida';
  const hoy = new Date();
  let edad = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) edad--;
  if (edad < 18) return 'El cliente debe ser mayor de edad';
  if (edad > 75) return 'Edad fuera de politica (max 75)';
  return null;
}

export function fechaPasada(v) {
  if (!v) return 'Campo obligatorio';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return 'Fecha invalida';
  if (d > new Date()) return 'La fecha no puede ser futura';
  return null;
}

export function entero(v, { min, max } = {}) {
  if (v == null || v === '') return 'Campo obligatorio';
  const n = Number(v);
  if (!Number.isFinite(n)) return 'Valor numerico invalido';
  if (min != null && n < min) return `Debe ser mayor o igual a ${min}`;
  if (max != null && n > max) return `Debe ser menor o igual a ${max}`;
  return null;
}

export function soloLetras(v) {
  if (!v) return 'Campo obligatorio';
  return /^[A-Za-zÁÉÍÓÚÑáéíóúñ.\-\s]{2,}$/.test(String(v).trim())
    ? null
    : 'Solo letras (minimo 2 caracteres)';
}

// Corre un mapa {campo: fn} contra un objeto de valores. Devuelve {campo: error}.
export function validarGrupo(defs, valores) {
  const errores = {};
  for (const [campo, fn] of Object.entries(defs)) {
    const err = fn(valores[campo]);
    if (err) errores[campo] = err;
  }
  return errores;
}
