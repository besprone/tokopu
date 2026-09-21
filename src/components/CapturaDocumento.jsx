import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button, IconButton } from './ui.jsx';
import { guardarArchivo, obtenerArchivo } from '../state/archivosDB.js';

// Captura de un documento: abre DIRECTO el selector nativo del telefono (el
// propio SO ya ofrece "Tomar foto" o "Elegir de archivos/galeria", no hace
// falta que nosotros construyamos esa pantalla) y, una vez elegido el
// archivo, muestra una revision con la imagen REAL capturada (no una de
// muestra) y zoom basico (doble tap), con "Escanea de nuevo" / "Aceptar
// captura ✓". Un solo componente para los 3 lugares del flujo que adjuntan
// un documento (bloque 2: INE manual; bloque 4: talon/estado de cuenta;
// bloque 5: los 13 documentos).
//
// IMPORTANTE: `input.click()` solo abre el selector si el navegador lo
// considera resultado DIRECTO de un toque del usuario (esto es real sobre
// todo en iOS Safari). Por eso `trigger` es obligatorio -el llamador debe
// dibujar su propio boton visible y llamar a `abrir()` ahi mismo, dentro de
// su propio onClick- y por lo que "Escanea de nuevo" llama a `abrir()` de
// forma sincrona, nunca desde un setTimeout/efecto. Encadenar una segunda
// captura (p. ej. frente -> reverso de la INE) tampoco puede auto-abrirse
// sola: hace falta un boton visible para el segundo toque tambien.
//
// `docId` (obligatorio): identifica el documento en el cache compartido de
// IndexedDB (archivosDB.js). Al aceptar una captura, el archivo se guarda
// ahi solo -el llamador no necesita mantener su propio cache en memoria.
// `trigger` recibe (abrir, mostrarSiExiste): `abrir` dispara el selector
// nativo; `mostrarSiExiste()` (async) busca en el cache un archivo YA
// aceptado para este docId -en esta pantalla o en cualquier otra- y si lo
// encuentra abre su revision (sin tocar la camara), devolviendo true; si no
// hay nada devuelve false, para que el llamador decida un fallback (p. ej.
// una confirmacion de solo texto). En ese caso el boton principal de la
// revision dice "Mantener este" en vez de "Aceptar captura ✓", porque no se
// esta aceptando nada nuevo.
// `autoMostrarSiExiste`: como llamar a `mostrarSiExiste()` apenas se monta,
// sin pasar por el trigger -para saltarse un paso intermedio cuando ya hay
// un archivo guardado (p. ej. el reverso de la INE al revisar una que ya se
// cargo antes: ver Identificacion.jsx). Mientras se resuelve esa consulta
// (siempre casi instantanea) no se dibuja nada, ni el trigger, para evitar
// parpadeos.
export default function CapturaDocumento({
  docId,
  titulo,
  subtitulo,
  accept = 'image/*,application/pdf',
  trigger,
  onAceptar,
  onCancelar,
  consejos,
  autoMostrarSiExiste,
}) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null); // { file, url }
  const [zoom, setZoom] = useState(false);
  // true cuando la revision muestra un archivo YA aceptado antes (via
  // mostrarSiExiste/autoMostrarSiExiste, no recien elegido en el selector):
  // el boton principal dice "Mantener este" en vez de "Aceptar captura".
  const [origenExistente, setOrigenExistente] = useState(false);
  const [listo, setListo] = useState(!autoMostrarSiExiste);
  const lastTapRef = useRef(0);
  const archivoRef = useRef(null);

  useEffect(() => {
    archivoRef.current = archivo;
  }, [archivo]);

  // Revoca el object URL si el componente se desmonta con una revision
  // abierta (p. ej. el asesor navega a otro lado a mitad de la revision).
  useEffect(() => {
    return () => {
      if (archivoRef.current) URL.revokeObjectURL(archivoRef.current.url);
    };
  }, []);

  useEffect(() => {
    if (!autoMostrarSiExiste) return;
    let cancelado = false;
    obtenerArchivo(docId).then((file) => {
      if (cancelado) return;
      if (file) {
        setArchivo({ file, url: URL.createObjectURL(file) });
        setOrigenExistente(true);
      }
      setListo(true);
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrir = () => inputRef.current?.click();

  const mostrarSiExiste = async () => {
    const file = await obtenerArchivo(docId);
    if (!file) return false;
    setArchivo({ file, url: URL.createObjectURL(file) });
    setZoom(false);
    setOrigenExistente(true);
    return true;
  };

  const onChangeInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reelegir el mismo archivo
    if (!file) {
      onCancelar?.();
      return;
    }
    setArchivo({ file, url: URL.createObjectURL(file) });
    setZoom(false);
    setOrigenExistente(false);
  };

  const cerrar = () => {
    if (archivo) URL.revokeObjectURL(archivo.url);
    setArchivo(null);
    setZoom(false);
  };

  const cancelar = () => {
    cerrar();
    onCancelar?.();
  };

  // Sincrono a proposito: si esto se retrasara (setTimeout, efecto, promesa)
  // el navegador ya no lo trata como un toque directo y puede no abrir nada.
  const reintentar = () => {
    cerrar();
    abrir();
  };

  const aceptar = () => {
    const file = archivo.file;
    cerrar();
    guardarArchivo(docId, file);
    onAceptar?.(file);
  };

  const tocarImagen = () => {
    const ahora = Date.now();
    if (ahora - lastTapRef.current < 300) setZoom((z) => !z);
    lastTapRef.current = ahora;
  };

  const esPdf = archivo?.file.type === 'application/pdf';

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={onChangeInput} />
      {listo && trigger(abrir, mostrarSiExiste)}

      {archivo &&
        createPortal(
          <div className="carta-sheet-backdrop" onClick={cancelar}>
            <div
              className="carta-sheet docscan-sheet"
              role="dialog"
              aria-modal="true"
              aria-label={titulo}
              onClick={(e) => e.stopPropagation()}
            >
              <IconButton className="carta-sheet-close" aria-label="Cerrar" onClick={cancelar}>
                ✕
              </IconButton>
              <div className="docscan-body">
                <h2>{titulo}</h2>
                {subtitulo && <p className="lead">{subtitulo}</p>}
                <div className={`docscan-doc${esPdf ? ' docscan-doc--pdf' : ''}`}>
                  {esPdf ? (
                    <iframe
                      className="docscan-pdf"
                      src={`${archivo.url}#toolbar=0`}
                      title={`${titulo} capturado`}
                    />
                  ) : (
                    <img
                      className={`docscan-shot${zoom ? ' zoomed' : ''}`}
                      src={archivo.url}
                      alt={`${titulo} capturado`}
                      onClick={tocarImagen}
                    />
                  )}
                </div>
                {!esPdf && (
                  <p className="tiny" style={{ textAlign: 'center', marginTop: 6 }}>
                    Doble tap para {zoom ? 'alejar' : 'acercar'} y verificar que se lea bien
                  </p>
                )}
                {consejos?.length > 0 && (
                  <>
                    <div className="sec-label" style={{ borderBottom: 'none', margin: '14px 0 2px' }}>
                      Consejos
                    </div>
                    <ul className="consejos tiny">
                      {consejos.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
              <div className="docscan-actions">
                <Button variant="ghost" onClick={reintentar} track="docscan_reintentar">
                  Escanea de nuevo
                </Button>
                <Button variant="primary" onClick={aceptar} track="docscan_aceptar">
                  {origenExistente ? 'Mantener este' : 'Aceptar captura ✓'}
                </Button>
              </div>
            </div>
          </div>,
          document.getElementById('sheet-portal-root') || document.body
        )}
    </>
  );
}
