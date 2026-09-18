import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud, DocTrigger } from '../../components/ui.jsx';
import CapturaDocumento from '../../components/CapturaDocumento.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, DOCS_AUTOGRAFA, DOCS_DIGITAL } from '../../state/store.jsx';
import { obtenerArchivo, guardarArchivoDeMuestra } from '../../state/archivosDB.js';

// Carga simulada: tiempo de "subida" antes de marcar el documento como listo.
const SIM_CARGA_MS = 1200;

// Imagenes de muestra para el autocompletado demo: nunca hubo una foto real,
// pero asi se puede revisar algo en vez de solo texto. INE guarda frente y
// reverso (ver guardarImagenDemoPara).
const IMAGEN_DEMO = {
  'edo-cuenta': { url: '/estado_cuenta/edocuenta.webp', nombre: 'estado-cuenta-muestra.webp' },
  'talon-1': { url: '/talon/talon.webp', nombre: 'talon-muestra.webp' },
  'talon-2': { url: '/talon/talon.webp', nombre: 'talon-muestra.webp' },
};
const IMAGEN_DEMO_GENERICA = { url: '/documentos-demo/generico.svg', nombre: 'documento-muestra.svg' };

function guardarImagenDemoPara(id) {
  if (id === 'ine') {
    return Promise.all([
      guardarArchivoDeMuestra('ine-frente', '/ine/frente.webp', 'ine-frente-muestra.webp'),
      guardarArchivoDeMuestra('ine-reverso', '/ine/reverso.jpeg', 'ine-reverso-muestra.jpeg'),
    ]);
  }
  const cfg = IMAGEN_DEMO[id] || IMAGEN_DEMO_GENERICA;
  return guardarArchivoDeMuestra(id, cfg.url, cfg.nombre);
}

export default function Documentos() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, toggleDoc } = useStore();
  const [cargando, setCargando] = useState({});
  // Documento "done" tocado sin un File real en el cache (autocompletado demo,
  // o cargado desde otra pantalla como la INE): { doc, abrir } mientras se
  // muestra la confirmacion ligera de solo texto en vez de saltar directo a
  // la camara/administrador de archivos.
  const [revisarDemo, setRevisarDemo] = useState(null);
  // INE: unico documento de dos imagenes (frente/reverso). Cuando ya hay
  // archivos reales guardados (docId 'ine-frente'/'ine-reverso'), se revisan
  // en secuencia -mismo patron que Identificacion.jsx- en vez de la
  // confirmacion ligera de solo texto.
  const [ineFrenteListo, setIneFrenteListo] = useState(false);
  const timers = useRef({});

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const docs = solicitud.tipoFirma === 'autografa' ? DOCS_AUTOGRAFA : DOCS_DIGITAL;
  const grupos = useMemo(() => {
    const g = {};
    for (const d of docs) (g[d.grupo] = g[d.grupo] || []).push(d);
    return g;
  }, [docs]);

  const hechos = docs.filter((d) => solicitud.documentos[d.id]).length;
  const todos = hechos === docs.length;
  // El comprobante de domicilio es el que el asesor sube de verdad (los demas
  // ya vienen de la identificacion / bloque 4); al adjuntarlo se completa el
  // resto en la demo. Si no estuviera en la lista, cae al primer documento.
  const gatilloId =
    docs.find((d) => d.id === 'comprobante-dom')?.id || docs[0]?.id;

  // Autocompleta (demo) los documentos que aun no estan cargados.
  const autocompletarResto = () => {
    const pend = docs.filter((d) => d.id !== gatilloId && !solicitud.documentos[d.id]);
    if (!pend.length) return;
    setCargando((c) => {
      const n = { ...c };
      pend.forEach((d) => (n[d.id] = true));
      return n;
    });
    clearTimeout(timers.current.__resto);
    timers.current.__resto = setTimeout(() => {
      pend.forEach((d) => {
        toggleDoc(d.id, { nombre: 'cargado con el comprobante', tamKB: 0, tipo: 'demo', demo: true, auto: true });
        guardarImagenDemoPara(d.id);
      });
      setCargando((c) => {
        const n = { ...c };
        pend.forEach((d) => (n[d.id] = false));
        return n;
      });
      track('click', { target: 'doc_autocompletar', desde: gatilloId, nDocs: pend.length });
    }, 800);
  };

  const confirmarCaptura = (d, file) => {
    const reemplazo = !!solicitud.documentos[d.id];
    setCargando((c) => ({ ...c, [d.id]: true }));
    clearTimeout(timers.current[d.id]);
    timers.current[d.id] = setTimeout(() => {
      toggleDoc(d.id, {
        nombre: file.name,
        tamKB: Math.max(1, Math.round(file.size / 1024)),
        tipo: file.type || 'desconocido',
      });
      setCargando((c) => ({ ...c, [d.id]: false }));
      track('click', {
        target: `doc_${d.id}`,
        doc: d.id,
        accion: reemplazo ? 'reemplazar' : 'cargar',
        tipoArchivo: file.type || 'desconocido',
        tamanoKB: Math.round(file.size / 1024),
      });
      // Al cargar el comprobante de domicilio por primera vez, se completan los demas.
      if (d.id === gatilloId && !reemplazo) autocompletarResto();
    }, SIM_CARGA_MS);
  };

  // Acepta un lado (frente/reverso) de la INE: combina su nombre/tamano con
  // el del otro lado (ya guardado en IndexedDB) para el documento "ine" del
  // store, igual que hace Identificacion.jsx al terminar de capturarla.
  const actualizarIne = (lado, file) => {
    setCargando((c) => ({ ...c, ine: true }));
    clearTimeout(timers.current.ine);
    timers.current.ine = setTimeout(async () => {
      const otroLado = lado === 'frente' ? 'reverso' : 'frente';
      const otroFile = await obtenerArchivo(`ine-${otroLado}`);
      const frenteFile = lado === 'frente' ? file : otroFile;
      const reversoFile = lado === 'reverso' ? file : otroFile;
      if (frenteFile && reversoFile) {
        toggleDoc('ine', {
          nombre: `Frente: ${frenteFile.name} · Reverso: ${reversoFile.name}`,
          tamKB: Math.max(1, Math.round((frenteFile.size + reversoFile.size) / 1024)),
          tipo: frenteFile.type || 'desconocido',
        });
      }
      setCargando((c) => ({ ...c, ine: false }));
      track('click', { target: 'doc_ine_actualizado', lado });
    }, SIM_CARGA_MS);
  };

  const subLinea = (meta, load) => {
    if (load) return 'Cargando…';
    if (!meta) return 'Adjuntar imagen o PDF';
    if (meta.auto) return 'cargado con el comprobante';
    if (meta.demo) return meta.nombre;
    return `${meta.nombre}${meta.tamKB ? ` · ${meta.tamKB} KB` : ''}`;
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Captura de documentos" right={<CerrarSolicitud />} />
      <Content>
        <h1>Captura de documentos</h1>
        <p className="lead">
          {hechos} de {docs.length} documentos cargados. Los de la identificacion ya vienen
          adjuntos; al subir el comprobante de domicilio se completan los demas (demo).
        </p>

        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo}>
            <div className="doc-group-title">{grupo}</div>
            <div className="stack" style={{ gap: 8 }}>
              {items.map((d) => {
                const meta = solicitud.documentos[d.id];
                const load = !!cargando[d.id];
                const done = !!meta && !load;

                // INE: unico documento de dos imagenes. Si ya hay archivos
                // reales guardados (frente y/o reverso), se revisan en
                // secuencia -mismo patron que Identificacion.jsx- en vez de
                // la confirmacion ligera de solo texto que usan los demas.
                if (d.id === 'ine') {
                  return !ineFrenteListo ? (
                    <CapturaDocumento
                      key="ine-frente"
                      docId="ine-frente"
                      titulo="Capturar el frente de la INE"
                      subtitulo="Verifica que se lea bien antes de aceptar."
                      onAceptar={(file) => {
                        actualizarIne('frente', file);
                        setIneFrenteListo(true);
                      }}
                      trigger={(abrir, mostrarSiExiste) => (
                        <DocTrigger
                          nombre={d.nombre}
                          sub={subLinea(meta, load)}
                          done={done}
                          load={load}
                          disabled={load}
                          onClick={async () => {
                            if (!done) return abrir();
                            const encontrado = await mostrarSiExiste();
                            if (encontrado) return;
                            // done pero sin File real en el cache (autocompletado
                            // demo): confirmacion ligera en vez de saltar
                            // directo a la camara.
                            setRevisarDemo({ doc: d, abrir });
                          }}
                        />
                      )}
                    />
                  ) : (
                    <CapturaDocumento
                      key="ine-reverso"
                      docId="ine-reverso"
                      titulo="Capturar el reverso de la INE"
                      subtitulo="Verifica que se lea bien antes de aceptar."
                      autoMostrarSiExiste
                      onAceptar={(file) => {
                        actualizarIne('reverso', file);
                        setIneFrenteListo(false);
                      }}
                      onCancelar={() => setIneFrenteListo(false)}
                      trigger={(abrir) =>
                        // Solo se ve si el reverso no estaba guardado aun
                        // (p. ej. se acaba de recapturar el frente y nunca
                        // hubo un reverso real): con autoMostrarSiExiste, si
                        // ya existe, esta sheet ni llega a pintarse.
                        createPortal(
                          <div className="carta-sheet-backdrop">
                            <div
                              className="carta-sheet docscan-sheet"
                              role="dialog"
                              aria-modal="true"
                              aria-label="Capturar el reverso de la INE"
                            >
                              <button
                                type="button"
                                className="carta-sheet-close"
                                aria-label="Cerrar"
                                onClick={() => setIneFrenteListo(false)}
                              >
                                ✕
                              </button>
                              <div className="docscan-body">
                                <h2>Frente listo ✓</h2>
                                <p className="lead">Ahora el reverso de la INE.</p>
                              </div>
                              <div className="docscan-actions">
                                <Button variant="dark" onClick={abrir} track="doc_ine_reverso_continuar">
                                  Escanear el reverso →
                                </Button>
                              </div>
                            </div>
                          </div>,
                          document.getElementById('sheet-portal-root') || document.body
                        )
                      }
                    />
                  );
                }

                return (
                  <CapturaDocumento
                    key={d.id}
                    docId={d.id}
                    titulo={d.nombre}
                    subtitulo="Verifica que se lea bien antes de aceptar."
                    onAceptar={(file) => confirmarCaptura(d, file)}
                    trigger={(abrir, mostrarSiExiste) => (
                      <DocTrigger
                        nombre={d.nombre}
                        sub={subLinea(meta, load)}
                        done={done}
                        load={load}
                        disabled={load}
                        onClick={async () => {
                          if (!done) return abrir();
                          const encontrado = await mostrarSiExiste();
                          if (encontrado) return;
                          // done pero sin File real en el cache (autocompletado
                          // demo, o cargado desde otra pantalla como la INE):
                          // confirmacion ligera en vez de saltar directo a la
                          // camara.
                          setRevisarDemo({ doc: d, abrir });
                        }}
                      />
                    )}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {revisarDemo &&
          createPortal(
            <div className="carta-sheet-backdrop" onClick={() => setRevisarDemo(null)}>
              <div
                className="carta-sheet docscan-sheet"
                role="dialog"
                aria-modal="true"
                aria-label={revisarDemo.doc.nombre}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="carta-sheet-close"
                  aria-label="Cerrar"
                  onClick={() => setRevisarDemo(null)}
                >
                  ✕
                </button>
                <div className="docscan-body">
                  <h2>{revisarDemo.doc.nombre}</h2>
                  <p className="lead">
                    Ya tienes cargado: {subLinea(solicitud.documentos[revisarDemo.doc.id], false)}.
                  </p>
                </div>
                <div className="docscan-actions">
                  <Button
                    variant="ghost"
                    onClick={() => setRevisarDemo(null)}
                    track="doc_demo_mantener"
                  >
                    Mantener este
                  </Button>
                  <Button
                    variant="dark"
                    onClick={() => {
                      const { abrir } = revisarDemo;
                      setRevisarDemo(null);
                      abrir();
                    }}
                    track="doc_demo_adjuntar"
                  >
                    Escanea de nuevo
                  </Button>
                </div>
              </div>
            </div>,
            document.getElementById('sheet-portal-root') || document.body
          )}
      </Content>
      <FooterActions>
        <Button
          variant="primary"
          disabled={!todos}
          onClick={() => {
            track('click', { target: 'documentos_listos' });
            navigate('/solicitud');
          }}
          track="enviar_documentos"
        >
          Continuar →
        </Button>
      </FooterActions>
    </Screen>
  );
}
