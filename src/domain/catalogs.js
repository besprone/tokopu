// Catalogos mock y datos simulados de OCR / escaneos.

// Catalogo real de dependencias/convenios (misma fuente que tokocalipso).
// Cada convenio declara que tipos de firma admite; un convenio sin ninguna
// firma disponible no permite iniciar la solicitud, y uno con una sola firma
// disponible la deja fija (sin opcion a elegir la otra).
export const DEPENDENCIAS = [
  {
    nombre: 'Baja California Norte',
    convenios: [
      { nombre: 'Educación Baja California', firmaAutografa: true, firmaDigital: true },
      { nombre: 'Poder Judicial', firmaAutografa: true, firmaDigital: false },
    ],
  },
  {
    nombre: 'Campeche',
    convenios: [{ nombre: 'Educación', firmaAutografa: true, firmaDigital: false }],
  },
  {
    nombre: 'CDMX',
    convenios: [
      { nombre: 'Gobierno', firmaAutografa: true, firmaDigital: true },
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: true },
      { nombre: 'PBI', firmaAutografa: true, firmaDigital: false },
    ],
  },
  {
    nombre: 'Chihuahua',
    convenios: [{ nombre: 'Salud', firmaAutografa: false, firmaDigital: false }],
  },
  {
    nombre: 'Estado de México',
    convenios: [{ nombre: 'Educación', firmaAutografa: true, firmaDigital: false }],
  },
  {
    nombre: 'Guerrero',
    convenios: [
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Salud', firmaAutografa: true, firmaDigital: false },
    ],
  },
  {
    nombre: 'Hidalgo',
    convenios: [{ nombre: 'Educación', firmaAutografa: true, firmaDigital: false }],
  },
  {
    nombre: 'Michoacán',
    convenios: [
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: true },
      { nombre: 'Salud', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Gobierno', firmaAutografa: true, firmaDigital: true },
      { nombre: 'CECYT', firmaAutografa: false, firmaDigital: false },
    ],
  },
  {
    nombre: 'Nacional',
    convenios: [
      { nombre: 'IPN', firmaAutografa: true, firmaDigital: true },
      { nombre: 'IMSS Ley', firmaAutografa: false, firmaDigital: true },
      { nombre: 'IMSS Bienestar', firmaAutografa: true, firmaDigital: false },
    ],
  },
  {
    nombre: 'Nayarit',
    convenios: [{ nombre: 'Fiscalía', firmaAutografa: true, firmaDigital: false }],
  },
  {
    nombre: 'Nuevo León',
    convenios: [{ nombre: 'Gobierno', firmaAutografa: false, firmaDigital: false }],
  },
  {
    nombre: 'Oaxaca',
    convenios: [
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: true },
      { nombre: 'Gobierno', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Pensiones', firmaAutografa: true, firmaDigital: true },
    ],
  },
  {
    nombre: 'Puebla',
    convenios: [
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Magisterio', firmaAutografa: false, firmaDigital: false },
    ],
  },
  {
    nombre: 'Querétaro',
    convenios: [
      { nombre: 'Educación', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Magisterio', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Gobierno', firmaAutografa: true, firmaDigital: false },
    ],
  },
  {
    nombre: 'Quintana Roo',
    convenios: [{ nombre: 'Educación', firmaAutografa: true, firmaDigital: true }],
  },
  {
    nombre: 'San Luis Potosi',
    convenios: [{ nombre: 'Educación', firmaAutografa: true, firmaDigital: false }],
  },
  {
    nombre: 'Sonora',
    convenios: [{ nombre: 'Gobierno', firmaAutografa: false, firmaDigital: false }],
  },
  {
    nombre: 'Tabasco',
    convenios: [
      { nombre: 'Colegio de Bachilleres', firmaAutografa: true, firmaDigital: false },
      { nombre: 'Gobierno', firmaAutografa: false, firmaDigital: false },
    ],
  },
];

/** Un convenio sin ninguna firma disponible no permite iniciar solicitud. */
export function tieneFirmaDisponible(convenio) {
  return convenio.firmaAutografa || convenio.firmaDigital;
}

/**
 * Que firma queda seleccionada al elegir un convenio. Si solo admite una, esa
 * queda fija; si admite las dos, se propone la autografa y el asesor decide.
 */
export function firmaInicial(convenio) {
  if (convenio.firmaAutografa && convenio.firmaDigital) return 'autografa';
  if (convenio.firmaAutografa) return 'autografa';
  if (convenio.firmaDigital) return 'digital';
  return '';
}

export const BANCOS = [
  'BBVA',
  'Banorte',
  'Santander',
  'Banamex',
  'HSBC',
  'Scotiabank',
  'Banco Azteca',
  'Inbursa',
  'BanCoppel',
  'Afirme',
];

export const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de Mexico', 'Coahuila', 'Colima',
  'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico',
  'Michoacan', 'Morelos', 'Nayarit', 'Nuevo Leon', 'Oaxaca', 'Puebla',
  'Queretaro', 'Quintana Roo', 'San Luis Potosi', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatan', 'Zacatecas',
];

export const GENEROS = ['Femenino', 'Masculino', 'No binario', 'Prefiero no decir'];
export const ESTADO_CIVIL = ['Soltero/a', 'Casado/a', 'Union libre', 'Divorciado/a', 'Viudo/a'];

export const ORIGEN_RECURSOS = [
  'Salario',
  'Actividad empresarial',
  'Honorarios',
  'Pension',
  'Rentas',
  'Otro',
];

export const DESTINO_RECURSOS = [
  'Credito al consumo',
  'Consolidacion de deudas',
  'Gastos medicos',
  'Educacion',
  'Mejoras al hogar',
  'Otro',
];

export const RANGOS_INGRESO = [
  { id: '0-10000', nombre: 'Menos de $10,000', valor: 8000 },
  { id: '10000-15000', nombre: 'De $10,000 a $15,000', valor: 12500 },
  { id: '15000-20000', nombre: 'De $15,000 a $20,000', valor: 17500 },
  { id: '20000-30000', nombre: 'De $20,000 a $30,000', valor: 25000 },
  { id: '30000+', nombre: 'Mas de $30,000', valor: 35000 },
];

// Datos simulados que "devuelve" el OCR de la INE + talon de pagos.
export const OCR_MOCK = {
  curp: 'PEMJ850624MDFRRL09',
  rfc: 'PEMJ850624PL9',
  nombre: 'Sara',
  segundoNombre: 'Fernanda',
  apellidoPaterno: 'Perez',
  apellidoMaterno: 'Lopez',
  fechaNacimiento: '1985-06-24',
  genero: 'Femenino',
  estadoCivil: 'Soltero/a',
  paisNacimiento: 'Mexico',
  nacionalidad: 'Mexicana',
  calle: 'Los Olivos 145',
  cp: '45001',
  colonia: 'Del Valle',
  delegacion: 'Del Valle III',
  estado: 'Jalisco',
  pais: 'Mexico',
};

export const TALON_MOCK = {
  numSegSocial: '12193333429',
  entidadFederativa: 'Oaxaca',
  centroTrabajo: 'Escuela Primaria "Benito Juarez"',
  puesto: 'Profesor de primaria',
  fechaIngreso: '2015-08-25',
  ingresoMensualComprobable: 13500,
  rangoIngreso: '10000-15000',
};

// Datos simulados que "devuelve" el escaneo del estado de cuenta (bloque 4).
export const CUENTA_MOCK = {
  banco: 'BBVA',
  cuentaClabe: '012180001234567899',
};

// Autenticacion remota del cliente (link por WhatsApp). El asesor solo ve el
// avance por etapas; la simulacion corre por tiempo.
// Orden: Validar celular (OTP) -> Carga del INE -> Biometricos -> Carta de
// consulta al portal. OTP y Carta son obligatorios; el INE y los biometricos
// van juntos (el "proceso de identificacion") y se pueden saltar: si no los
// hace el cliente, los captura el asesor en su dispositivo.
export const AUTENTICACION_REMOTA = {
  subeIdentificacion: true, // el cliente hace INE + biometricos desde el link
  duracionMs: 36000,
};

export const FOLIO_DEMO = '66FKJSK';

// Cliente que YA existe en el sistema. Escenario alterno de la Tarea 2, se
// dispara cuando el celular tecleado es CLIENTE_EXISTENTE_MOCK.celular. NO es
// la persona del guion (Sara Fernanda Perez Lopez).
export const CLIENTE_EXISTENTE_MOCK = {
  celular: '5540506070',
  celularFmt: '55 4050 6070',
  nombre: 'Sara Fernandez Diaz',
  rfc: 'FEDS850624MG3',
  curp: 'FEDS850624MDFRZR05',
  email: 'sara@gmail.com',
  paisNacimiento: 'Mexico',
  nacionalidad: 'Mexicana',
  // Validaciones simuladas tras "Si, son los datos del cliente":
  tieneSolicitudesActivas: true, // -> pantalla "Solicitudes guardadas"
  // SI hay carta de consulta vigente -> se "procesa" y va a la pantalla verde
  // "Aprobado". Si NO -> flujo normal de autenticacion (espera de OTP).
  tieneCartaVigente: true,
  ingresoMensual: 8580, // capacidad ~ $1,158/quincena en la pantalla "Aprobado"
  solicitudesActivas: [
    { dia: 'Hoy', nombre: 'Sara Fernandez', detalle: '45,000mxn / 22 semanas', estado: 'Se abrio con otro asesor', retomable: false },
    { dia: '22 de agosto', nombre: 'Sara Fernandez', detalle: '33,000mxn / 22 semanas', estado: 'Guardada', retomable: true },
    { dia: '22 de abril', nombre: 'Sara Fernandez', detalle: '33,000mxn / 22 semanas', estado: 'Guardada', retomable: true },
  ],
};
