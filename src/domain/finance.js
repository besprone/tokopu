// ---------------------------------------------------------------------------
// Modelo financiero del cotizador (Credito Maestro / credito de nomina, MX)
//
// Supuestos, alineados con financieras de descuento via nomina al sector
// publico (magisterio, gobiernos estatales) tipo Credito Maestro:
//
//  - Amortizacion sistema frances: pago fijo capital+interes por periodo.
//  - Periodicidad quincenal => 24 periodos por anio.
//  - Tasa de interes ANUAL FIJA sobre saldos insolutos (default 42%).
//  - Seguro de vida saldo deudor: pequeno cargo quincenal sobre saldo insoluto.
//  - Comision por apertura: 0% (tipico en nomina). Configurable.
//  - CAT: tasa que iguala el valor presente de los pagos con el monto
//    efectivamente dispersado (metodologia CONDUSEF), anualizada.
//  - Capacidad de pago: porcentaje maximo del ingreso NETO quincenal que
//    puede comprometerse a descuentos via nomina (default 30%), menos otros
//    descuentos vigentes.
//
// Todos los parametros viven en FIN_CONFIG para que el moderador los ajuste.
// ---------------------------------------------------------------------------

export const FIN_CONFIG = {
  tasaAnualFija: 0.42,
  periodosPorAnio: 24,
  comisionAperturaPct: 0,
  ivaPct: 0.16,
  seguroQuincenalPct: 0.0004, // ~0.04% del saldo insoluto por quincena
  montoMin: 5000,
  montoMax: 150000,
  montoStep: 1000,
  plazosQuincenas: [24, 36, 48, 60, 72, 96, 120],
  plazosSugeridos: [36, 48, 60, 72, 96],
  // Capacidad de pago
  factorCapacidadNomina: 0.3,
  ingresoNetoFactor: 0.9,
  // Ingreso demo cuando aun no se captura el bloque 4 (moderador lo ajusta)
  ingresoMensualDemo: 13500,
  otrosDescuentosQuincenalDemo: 0,
};

const money = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export function tasaQuincenal(cfg = FIN_CONFIG) {
  return cfg.tasaAnualFija / cfg.periodosPorAnio;
}

// Pago fijo capital+interes (sistema frances), sin seguro.
export function pagoFrances(monto, nQuincenas, cfg = FIN_CONFIG) {
  const i = tasaQuincenal(cfg);
  if (i === 0) return monto / nQuincenas;
  const factor = Math.pow(1 + i, -nQuincenas);
  return (monto * i) / (1 - factor);
}

export function tablaAmortizacion(monto, nQuincenas, cfg = FIN_CONFIG) {
  const i = tasaQuincenal(cfg);
  const pagoCI = pagoFrances(monto, nQuincenas, cfg);
  let saldo = monto;
  const filas = [];
  for (let k = 1; k <= nQuincenas; k++) {
    const interes = saldo * i;
    const seguro = saldo * cfg.seguroQuincenalPct;
    let capital = pagoCI - interes;
    if (k === nQuincenas || capital > saldo) capital = saldo;
    const saldoFin = Math.max(0, saldo - capital);
    filas.push({
      k,
      saldoIni: money(saldo),
      capital: money(capital),
      interes: money(interes),
      seguro: money(seguro),
      pago: money(capital + interes + seguro),
      saldoFin: money(saldoFin),
    });
    saldo = saldoFin;
  }
  return filas;
}

// CAT anual por biseccion sobre los flujos quincenales.
export function calcularCAT(montoDispersado, pagos, cfg = FIN_CONFIG) {
  if (montoDispersado <= 0 || pagos.length === 0) return 0;
  const vpn = (j) =>
    pagos.reduce((s, p, idx) => s + p / Math.pow(1 + j, idx + 1), 0) - montoDispersado;
  let lo = 1e-9;
  let hi = 3; // 300% quincenal como techo
  if (vpn(lo) < 0) return 0;
  for (let it = 0; it < 200; it++) {
    const mid = (lo + hi) / 2;
    const v = vpn(mid);
    if (Math.abs(v) < 1e-7) {
      lo = mid;
      hi = mid;
      break;
    }
    if (v > 0) lo = mid;
    else hi = mid;
  }
  const j = (lo + hi) / 2;
  return Math.pow(1 + j, cfg.periodosPorAnio) - 1;
}

export function cotizar(monto, nQuincenas, cfg = FIN_CONFIG) {
  const m = Math.max(cfg.montoMin, Math.min(cfg.montoMax, Math.round(monto)));
  const n = Math.max(1, Math.round(nQuincenas));
  const tabla = tablaAmortizacion(m, n, cfg);
  const totalPagar = money(tabla.reduce((s, f) => s + f.pago, 0));
  const totalIntereses = money(tabla.reduce((s, f) => s + f.interes, 0));
  const totalSeguro = money(tabla.reduce((s, f) => s + f.seguro, 0));
  const comision = money(m * cfg.comisionAperturaPct * (1 + cfg.ivaPct));
  const montoDispersado = money(m - comision);
  const cat = calcularCAT(montoDispersado, tabla.map((f) => f.pago), cfg);
  return {
    monto: m,
    nQuincenas: n,
    pagoQuincenal: tabla[0].pago,
    pagoUltimo: tabla[n - 1].pago,
    totalPagar,
    totalIntereses,
    totalSeguro,
    comision,
    montoDispersado,
    tasaAnualFija: cfg.tasaAnualFija,
    cat,
    catPct: cat * 100,
    tabla,
  };
}

export function capacidadPagoQuincenal(
  ingresoMensualComprobable,
  otrosDescuentosQuincenal = 0,
  cfg = FIN_CONFIG
) {
  const bruto = Number(ingresoMensualComprobable) || 0;
  const netoMensual = bruto * cfg.ingresoNetoFactor;
  const netoQuincenal = netoMensual / 2;
  return money(Math.max(0, netoQuincenal * cfg.factorCapacidadNomina - (Number(otrosDescuentosQuincenal) || 0)));
}

// Monto maximo cuyo pago quincenal no rebasa `tope`, para un plazo dado.
export function montoMaximoPorPago(tope, nQuincenas, cfg = FIN_CONFIG) {
  if (tope <= 0) return 0;
  let lo = 0;
  let hi = cfg.montoMax;
  for (let it = 0; it < 60; it++) {
    const mid = (lo + hi) / 2;
    const pago = cotizar(Math.max(1, mid), nQuincenas, cfg).pagoQuincenal;
    if (pago > tope) hi = mid;
    else lo = mid;
  }
  return Math.max(cfg.montoMin, Math.floor(lo / cfg.montoStep) * cfg.montoStep);
}

// Ofertas sugeridas por el sistema a partir de la capacidad de pago.
export function generarOfertas(capacidad, cfg = FIN_CONFIG) {
  const ofertas = [];

  const plazoRec = 60;
  const montoRec = montoMaximoPorPago(capacidad * 0.85, plazoRec, cfg);
  ofertas.push({
    id: 'recomendada',
    titulo: 'Recomendada',
    detalle: 'Buena seleccion: aprovecha el credito sin endeudar en exceso al cliente.',
    ...cotizar(montoRec, plazoRec, cfg),
  });

  const plazoEsp = 48;
  const montoEsp = montoMaximoPorPago(capacidad * 0.9, plazoEsp, cfg);
  const cEsp = cotizar(montoEsp, plazoEsp, cfg);
  ofertas.push({
    id: 'especial24h',
    titulo: 'Oferta especial campana 24 horas',
    detalle: 'Vigencia 24 horas. Incluye descuento en el total a pagar.',
    descuento: 1000,
    ...cEsp,
    totalPagar: money(cEsp.totalPagar - 1000),
  });

  const plazoMax = 96;
  const montoMax = montoMaximoPorPago(capacidad * 0.97, plazoMax, cfg);
  ofertas.push({
    id: 'montomax',
    titulo: 'Monto maximo',
    detalle: 'Utiliza al maximo la capacidad de pago disponible.',
    ...cotizar(montoMax, plazoMax, cfg),
  });

  return ofertas;
}

// ---------------------------- Formato -------------------------------------

export const mxn = (n) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(n) ? n : 0);

export const pct = (n, dec = 1) =>
  `${(Number.isFinite(n) ? n * 100 : 0).toFixed(dec)}%`;
