// Cache compartido de los archivos (File) que el asesor va capturando
// (INE, talon de pagos, estado de cuenta, documentos del bloque 5), en
// IndexedDB -a diferencia de localStorage, sí puede guardar Blob/File
// directamente. Objetivo: que cualquier pantalla pueda volver a mostrar la
// imagen REAL de un documento ya cargado en otra pantalla (p. ej. ver el
// INE capturado en Identificacion.jsx desde Documentos.jsx), y que eso
// sobreviva un refresh accidental a mitad de la prueba.
//
// Se vacia por completo al iniciar una sesion nueva y al terminarla (ver
// Bienvenida.jsx y MetricsProvider.jsx) para que dos corridas de la prueba
// en el mismo dispositivo nunca compartan archivos entre si.

const DB_NAME = 'toko-archivos';
const STORE = 'documentos';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function guardarArchivo(id, file) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function obtenerArchivo(id) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function borrarTodosLosArchivos() {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Guarda como si fuera una captura real una imagen de muestra que ya vive en
// /public (p. ej. public/ine/frente.webp) -para los flujos simulados donde
// nunca hubo una foto de verdad (el cliente "completo todo desde el link", o
// el autocompletado demo del bloque 5), pero igual queremos poder revisar
// algo en vez de solo texto.
export async function guardarArchivoDeMuestra(id, url, nombreArchivo) {
  const res = await fetch(url);
  const blob = await res.blob();
  const file = new File([blob], nombreArchivo, { type: blob.type });
  await guardarArchivo(id, file);
  return file;
}
