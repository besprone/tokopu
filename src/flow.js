// Orquestacion de las 5 tareas de la prueba de usabilidad.
// Escenarios, resultado esperado y "que observar" tomados del guion del
// facilitador (Anexo A de la propuesta de pruebas). La numeracion de la app
// (Tarea 1-5) fusiona T2 (autenticar) y T3 (firmar) del plan en una sola.

export const TAREAS = {
  iniciar_solicitud: {
    id: 'iniciar_solicitud',
    num: 1,
    titulo: 'Iniciar la solicitud',
    nucleo: false,
    escenario: `Llega Sara a solicitar un crédito. Ábrele una nueva solicitud con sus datos.

Datos de Sara:
• Nombre: Sara Fernanda Pérez López
• Puesto: profesora de primaria
• Dependencia: Secretaría de Educación de Guerrero
• Convenio: Educación
• Tipo de firma: autógrafa`,
    exito:
      'Llegas al hub de progreso con dependencia = "Secretaria de Educacion - Guerrero", convenio = "Educacion" y tipo de firma = Autografa.',
    observar: [
      'Encuentra el boton + desde el dashboard para iniciar la solicitud?',
      'Elige la dependencia correcta? (hay varias "Secretaria de Educacion -" de distintos estados)',
      'Distingue "dependencia" de "convenio"?',
      'Selecciona "Autografa" con seguridad? (es la opcion que abre el flujo largo)',
    ],
    next: '/tarea/identificacion',
  },
  identificacion: {
    id: 'identificacion',
    num: 2,
    titulo: 'Autenticar e identificar al cliente',
    nucleo: true,
    escenario: `Autentica e identifica a Sara para poder continuar. Necesitas:
• Autenticar su identidad
• Capturar su identificación (selfie e INE)
• Firmar tu carta de consulta y que Sara firme la suya

Datos de Sara:
• Celular: 55 6209 5585
• Correo: saraperez@gob.mx`,
    exito:
      'Pantalla "El cliente completo el proceso de autenticacion", con selfie e INE (frente y reverso) capturados, datos del OCR verificados (CURP PEMJ850624MDFRRL09, RFC PEMJ850624PL9, nombre Sara Fernanda Perez Lopez) y ambas firmas registradas.',
    observar: [
      'Captura el celular con 10 digitos exactos (sin +52) y el correo sin errores de dedo?',
      'Entiende la liga por WhatsApp y la espera de autenticacion? Es una pausa incomoda?',
      'Si el movil de Sara NO autentica: encuentra "Continuar con captura manual" en el dispositivo del asesor?',
      'La captura de selfie e INE se logra a la primera?',
      'LEE los datos que autolleno el OCR (CURP, RFC, nombre) o los pasa de largo?',
      'Firmar en pantalla es facil? El traspaso del dispositivo a Sara para su firma se siente natural?',
    ],
    next: '/tarea/seleccionar_oferta',
  },
  seleccionar_oferta: {
    id: 'seleccionar_oferta',
    num: 3,
    titulo: 'Configurar la oferta',
    nucleo: true,
    escenario:
      'Sara quiere $45,000 a 60 quincenas. Configura esa oferta y dile cuánto se le descontará cada quincena.',
    exito:
      'Oferta confirmada con monto $45,000 y 60 quincenas; puedes decir el pago quincenal (~$1,235) y ubicar el CAT (~53%).',
    observar: [
      'Llega al monto EXACTO de $45,000 con el slider?',
      'Nota que el plazo no viene preseleccionado y elige 60 quincenas?',
      'Entiende la "capacidad de pago" (~$1,822) y que el pago debe quedar por debajo?',
      'Distingue la pestana "Cotizador" de "Ofertas"?',
      'Encuentra el pago quincenal y el CAT sin salir del flujo?',
    ],
    next: '/tarea/informacion_solicitud',
  },
  informacion_solicitud: {
    id: 'informacion_solicitud',
    num: 4,
    titulo: 'Llenar la informacion y corregir un dato',
    nucleo: true,
    escenario: `Completa la información de la solicitud de Sara y confírmala. Antes de confirmar, Sara te dice: «me cambié de casa, ahora vivo en Av. Reforma 88, Colonia Centro, CP 45010» — corrige el domicilio.

Datos de Sara:
• Banco: BBVA
• CLABE: 012180001234567899
• Ingreso mensual: $13,500
• Origen de los recursos: Salario
• Destino de los recursos: Crédito al consumo
• Liquidación anticipada: No`,
    exito:
      'Los 5 pasos completos; domicilio corregido (calle, colonia y CP nuevos); CLABE de 18 digitos y banco BBVA capturados; ingreso $13,500; datos confirmados.',
    observar: [
      'Verifica los campos autollenados por el OCR o los pasa sin leer? (campo critico)',
      'Captura la CLABE con 18 digitos exactos? Cuantos intentos? (tiene digito verificador)',
      'El ingreso mensual queda sin "$" ni comas?',
      'Al corregir el domicilio actualiza los 3 campos (calle + colonia + CP)?',
      'Elige bien los combos (Origen = Salario, Destino = Consumo, Liquidacion anticipada = No)?',
      'El wizard de 5 pasos se siente manejable o agotador? Usa "Atras" o el stepper?',
      'Encuentra "Editar" por seccion en "Confirma los datos"? Pierde datos al corregir?',
    ],
    next: '/tarea/documentos_envio',
  },
  documentos_envio: {
    id: 'documentos_envio',
    num: 5,
    titulo: 'Documentos y envio',
    nucleo: true,
    escenario: `Sube los documentos de Sara y envía la solicitud.
• Adjunta la INE desde los archivos del equipo.
• Los demás documentos se completan solos (es demo).

Luego envía la solicitud para terminar.`,
    exito:
      '13 de 13 documentos cargados; vuelve al hub, toca "Enviar solicitud", ve la pantalla "Felicidades / en evaluacion" y termina.',
    observar: [
      'El explorador de archivos del equipo se abre bien?',
      'Entiende que adjuntar la INE completa los demas documentos?',
      'La lista larga (13 en autografa) abruma o se entiende por grupos?',
      'El cierre le da confianza de que la solicitud se envio?',
    ],
    next: '/sus',
  },
};

export const ORDEN_TAREAS = [
  'iniciar_solicitud',
  'identificacion',
  'seleccionar_oferta',
  'informacion_solicitud',
  'documentos_envio',
];

// A donde lleva "Empezar tarea" desde la intro.
// - Tarea 1: al dashboard; el asesor tiene que encontrar el boton + y abrir
//   una nueva solicitud (parte de lo que se observa).
// - Tareas 2-5: al HUB. El asesor debe identificar en el hub que bloque toca;
//   ahi se observa si el hub deja claro el siguiente paso. task_start ya se
//   disparo al pulsar "Empezar", justo antes del hub.
export const ENTRADA_TAREA = {
  iniciar_solicitud: '/inicio',
  identificacion: '/solicitud',
  seleccionar_oferta: '/solicitud',
  informacion_solicitud: '/solicitud',
  documentos_envio: '/solicitud',
};

// Bloque real al que lleva cada item del hub (sin intro intermedio).
export const BLOQUE_TAREA = {
  identificacion: '/identificacion',
  seleccionar_oferta: '/cotizador',
  informacion_solicitud: '/informacion',
  documentos_envio: '/documentos',
};

// Ruta de pantalla -> tarea activa (solo pantallas reales de tarea; no la
// intro ni el SEQ). Sirve para la pestana "Escenario", que se oculta fuera
// de una tarea.
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
