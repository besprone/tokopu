// Orquestacion de la prueba de usabilidad.
//
// Hay dos capas separadas a proposito:
//  - "Bloques" de producto (5: iniciar_solicitud, identificacion,
//    seleccionar_oferta, informacion_solicitud, documentos_envio). Son los
//    que usa el HUB para su barra de progreso y sus filas independientes
//    (tareaCompletada() en state/store.jsx). No cambian aqui.
//  - "Grupos de prueba" (3): la unidad de investigacion — task_start /
//    task_complete / SEQ. Cada uno agrupa 1-2 bloques de producto. Se
//    definen en GRUPOS_PRUEBA. El hub y el resto del producto no saben que
//    existen; solo le importan a la instrumentacion y al panel de
//    Instrucciones.
import { tareaCompletada } from './state/store.jsx';

export const GRUPOS_PRUEBA = [
  {
    id: 'g1_iniciar_autenticar',
    num: 1,
    titulo: 'Iniciar la solicitud y autenticar al cliente',
    escenario: `Llega Sara a solicitar un crédito. Ábrele una nueva solicitud con sus datos y luego autentícala e identifícala para poder continuar.

Datos de Sara:
• Nombre: Sara Fernanda Pérez López
• Puesto: profesora de primaria
• Dependencia: Secretaría de Educación de Guerrero
• Convenio: Educación
• Tipo de firma: autógrafa
• Celular: 55 6209 5585
• Correo: saraperez@gob.mx`,
    exito:
      'Llega a la pantalla verde "¡Aprobado! Comencemos con una buena oferta", con dependencia/convenio/firma correctos, la INE capturada, los datos verificados (CURP PEMJ850624MDFRRL09) y la firma de la carta de consulta registrada.',
    observar: [
      '¿Encuentra el botón + desde el dashboard para iniciar la solicitud?',
      '¿Elige la dependencia correcta? (hay varias "Secretaría de Educación -" de distintos estados)',
      '¿Distingue "dependencia" de "convenio"? ¿Selecciona "Autógrafa" con seguridad?',
      '¿Captura el celular (10 dígitos, sin +52) y el correo sin errores de dedo?',
      '¿Entiende la liga por WhatsApp y la espera de autenticación? ¿Es una pausa incómoda?',
      'Si el móvil de Sara NO autentica: ¿encuentra "Continuar captura manual"?',
      'En captura manual: ¿escanea la INE o teclea? ¿LEE lo que autollenó el escaneo o lo pasa de largo?',
      '¿Encuentra "Ver la carta que vas a firmar" antes de firmar? ¿Firmar en pantalla es fácil?',
    ],
    // Bloque de producto cuya finalizacion marca el fin de este grupo.
    bloqueFinal: 'identificacion',
    // A donde navegar cuando el grupo termina (tras el SEQ en remota, o
    // directo en moderada).
    next: '/solicitud',
    // A donde navegar al arrancar el grupo (boton "Empezar tarea", solo
    // remota; en moderada se arranca directo, sin pasar por aqui).
    entrada: '/inicio',
  },
  {
    id: 'g2_cotizar_info',
    num: 2,
    titulo: 'Cotizar la oferta y capturar la información',
    escenario: `Sara quiere $45,000 a 60 quincenas. El cotizador ya trae una oferta sugerida: ajústala a lo que Sara pidió y dile cuánto se le descontará cada quincena. Luego completa la información de su solicitud y confírmala.

Datos de Sara:
• Banco: BBVA · CLABE: 012180001234567899
• Ingreso mensual: $13,500 · Origen: Salario · Destino: Crédito al consumo
• Liquidación anticipada: No`,
    exito:
      'Oferta confirmada ($45,000 / 60 quincenas, pago quincenal ~$1,235, CAT ~53%); los 5 grupos de información completos, CLABE y banco capturados, ingreso $13,500, datos confirmados.',
    observar: [
      '¿Nota que el monto precargado (sugerido por el sistema) no es el que pidió Sara y lo ajusta, o confirma la oferta tal cual viene?',
      '¿Entiende la "capacidad de pago" y que el pago debe quedar por debajo? ¿Distingue "Ofertas" de "Cotizador"?',
      '¿Encuentra el pago quincenal y el CAT sin salir del flujo?',
      '¿Verifica los campos autollenados por el OCR o los pasa sin leer?',
      '¿Navega libremente entre los grupos (chips) o espera un orden fijo? ¿Se da cuenta de cuáles le faltan?',
      '¿Captura la CLABE con 18 dígitos exactos? ¿Cuántos intentos?',
      '¿Encuentra "Editar" por sección en "Confirma los datos"? ¿Pierde datos al corregir?',
    ],
    bloqueFinal: 'informacion_solicitud',
    next: '/solicitud',
    entrada: '/solicitud',
  },
  {
    id: 'g3_documentos_cierre',
    num: 3,
    titulo: 'Adjuntar documentos y cerrar la solicitud',
    escenario: `Sube los documentos de Sara y envía la solicitud.
• Adjunta el comprobante de domicilio desde los archivos del equipo.
• Los demás documentos ya vienen de la identificación o se completan solos (es demo).

Luego envía la solicitud para terminar.`,
    exito:
      '13 de 13 documentos cargados; vuelve al hub, toca "Enviar solicitud", ve la pantalla "Felicidades / en evaluación" y termina.',
    observar: [
      '¿El explorador de archivos del equipo se abre bien?',
      '¿Entiende que adjuntar el comprobante de domicilio completa los demás documentos?',
      '¿La lista larga (13 en autógrafa) abruma o se entiende por grupos?',
      '¿El cierre le da confianza de que la solicitud se envió?',
    ],
    bloqueFinal: 'documentos_envio',
    // Ultimo grupo: en remota pasa por SUS antes de terminar.
    next: '/sus',
    entrada: '/solicitud',
  },
];

export const ORDEN_GRUPOS = GRUPOS_PRUEBA.map((g) => g.id);

// Bloque de producto -> grupo de prueba al que pertenece.
export const BLOQUE_A_GRUPO = GRUPOS_PRUEBA.reduce((acc, g) => {
  if (g.id === 'g1_iniciar_autenticar') {
    acc.iniciar_solicitud = g.id;
    acc.identificacion = g.id;
  } else if (g.id === 'g2_cotizar_info') {
    acc.seleccionar_oferta = g.id;
    acc.informacion_solicitud = g.id;
  } else {
    acc.documentos_envio = g.id;
  }
  return acc;
}, {});

const ORDEN_BLOQUES = Object.keys(BLOQUE_A_GRUPO);

// Grupo de prueba en curso: el primero cuyo bloque final aun no esta
// completo. Se usa cuando la ruta actual no es de un bloque especifico
// (dashboard, solicitudes, hub) para saber que grupo mostrar en Instrucciones.
export function grupoEnCurso(solicitud) {
  const bloque = ORDEN_BLOQUES.find((b) => !tareaCompletada(solicitud, b));
  return bloque ? BLOQUE_A_GRUPO[bloque] : null;
}

// Bloque real al que lleva cada item del hub (sin intro intermedio).
export const BLOQUE_TAREA = {
  identificacion: '/identificacion',
  seleccionar_oferta: '/cotizador',
  informacion_solicitud: '/informacion',
  documentos_envio: '/documentos',
};

// Ruta de pantalla -> bloque de producto activo (para el panel de
// Instrucciones y para saber en que grupo de prueba estamos).
const RUTA_TAREA = {
  '/nueva': 'iniciar_solicitud',
  '/identificacion': 'identificacion',
  '/cotizador': 'seleccionar_oferta',
  '/informacion': 'informacion_solicitud',
  '/informacion/confirmar': 'informacion_solicitud',
  '/documentos': 'documentos_envio',
  '/firma-digital': 'documentos_envio',
  '/completada': 'documentos_envio',
};

export function tareaDeRuta(pathname = '') {
  return RUTA_TAREA[pathname] || null;
}

export function grupoDeRuta(pathname = '') {
  const bloque = tareaDeRuta(pathname);
  return bloque ? BLOQUE_A_GRUPO[bloque] : null;
}

// Items del SUS (adaptacion al espanol del cuestionario de Brooke).
// Impares = positivos, pares = negativos (el calculo en track.js depende de
// este orden). Ver susResultado().
export const SUS_ITEMS = [
  'Creo que me gustaría usar Toko con frecuencia.',
  'Encuentro Toko innecesariamente complejo.',
  'Creo que Toko es fácil de usar.',
  'Creo que necesitaría el apoyo de una persona experta para poder usar Toko.',
  'Encuentro que las distintas funciones de Toko están bien integradas.',
  'Creo que Toko es demasiado inconsistente.',
  'Imagino que la mayoría de la gente aprendería a usar Toko muy rápido.',
  'Encuentro Toko muy tedioso de usar.',
  'Me sentí muy seguro/a al usar Toko.',
  'Necesité aprender muchas cosas antes de poder empezar a usar Toko.',
];

export const SUS_ESCALA = [
  'Totalmente en desacuerdo',
  'En desacuerdo',
  'Neutral',
  'De acuerdo',
  'Totalmente de acuerdo',
];

export const SEQ_PREGUNTA =
  'En general, ¿qué tan difícil o fácil te resultó completar esta tarea?';
export const SEQ_MIN_LABEL = 'Muy difícil';
export const SEQ_MAX_LABEL = 'Muy fácil';
