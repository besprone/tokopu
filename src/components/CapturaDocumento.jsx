import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui.jsx';

// Captura de un documento: abre DIRECTO el selector nativo del telefono (el
// propio SO ya ofrece "Tomar foto" o "Elegir de archivos/galeria", no hace
// falta que nosotros construyamos esa pantalla) y, una vez elegido el
// archivo, muestra una revision con la imagen REAL capturada (no una de
// muestra) y zoom basico (doble tap), con "Escanea de nuevo" / "Aceptar
// captura ✓". Un solo componente para los 3 lugares del flujo que adjuntan
// un documento (bloque 2: INE manual; bloque 4: talon/estado de cuenta;
// bloque 5: los 13 documentos).
//
// Dos modos de uso:
//  - `trigger`: si se pasa, el componente le entrega la funcion `abrir()`
//    para que el llamador dibuje su propio boton/fila (Documentos.jsx,
//    DocScanSheet).
//  - sin `trigger`: se abre solo al montar (util quiando el llamador ya
//    tiene su propio boton visible y solo quiere encadenar una captura,
//    como el frente/reverso de la INE).
export default function CapturaDocumento({
  titulo,
  subtitulo,
  accept = 'image/*',
  trigger,
  onAceptar,
  onCancelar,
}) {
  const inputRef = useRef(null);
  const [archivo, setArchivo] = useState(null); // { file, url }
  const [zoom, setZoom] = useState(false);
  const lastTapRef = useRef(0);

  const abrir = () => inputRef.current?.click();

  useEffect(() => {
    if (!trigger) abrir();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (archivo) URL.revokeObjectURL(archivo.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeInput = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reelegir el mismo archivo
    if (!file) {
      onCancelar?.();
      return;
    }
    setArchivo({ file, url: URL.createObjectURL(file) });
    setZoom(false);
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

  const reintentar = () => {
    cerrar();
    setTimeout(abrir, 0);
  };

  const aceptar = () => {
    const file = archivo.file;
    cerrar();
    onAceptar?.(file);
  };

  const tocarImagen = () => {
    const ahora = Date.now();
    if (ahora - lastTapRef.current < 300) setZoom((z) => !z);
    lastTapRef.current = ahora;
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={accept} hidden onChange={onChangeInput} />
      {trigger?.(abrir)}

      {archivo && (
        <div className="carta-sheet-backdrop" onClick={cancelar}>
          <div
            className="carta-sheet docscan-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="carta-sheet-close" aria-label="Cerrar" onClick={cancelar}>
              ✕
            </button>
            <div className="docscan-body">
              <h2>{titulo}</h2>
              {subtitulo && <p className="lead">{subtitulo}</p>}
              <div className="docscan-doc">
                <img
                  className={`docscan-shot${zoom ? ' zoomed' : ''}`}
                  src={archivo.url}
                  alt={`${titulo} capturado`}
                  onClick={tocarImagen}
                />
              </div>
              <p className="tiny" style={{ textAlign: 'center', marginTop: 6 }}>
                Doble tap para {zoom ? 'alejar' : 'acercar'} y verificar que se lea bien
              </p>
            </div>
            <div className="docscan-actions">
              <Button variant="ghost" onClick={reintentar} track="docscan_reintentar">
                Escanea de nuevo
              </Button>
              <Button variant="dark" onClick={aceptar} track="docscan_aceptar">
                Aceptar captura ✓
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
