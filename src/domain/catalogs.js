// Catalogos mock y datos simulados de OCR / escaneos.

export const DEPENDENCIAS = [
  { id: 'sep-gro', nombre: 'Secretaria de Educacion - Guerrero' },
  { id: 'sep-oax', nombre: 'Secretaria de Educacion - Oaxaca' },
  { id: 'sep-nay', nombre: 'Secretaria de Educacion - Nayarit' },
  { id: 'gob-cdmx', nombre: 'Gobierno de la Ciudad de Mexico' },
  { id: 'issste', nombre: 'ISSSTE' },
  { id: 'imss', nombre: 'IMSS' },
];

export const CONVENIOS = [
  { id: 'educacion', nombre: 'Educacion' },
  { id: 'salud', nombre: 'Salud' },
  { id: 'burocracia', nombre: 'Administracion estatal' },
  { id: 'pensionados', nombre: 'Pensionados' },
];

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
// avance por etapas; la simulacion corre por tiempo. `subeINE` = el cliente
// tambien captura su INE desde el link (si no, el asesor la captura despues).
export const AUTENTICACION_REMOTA = {
  subeINE: true,
  firmaCarta: true, // el cliente firma la carta de consulta desde el link
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
