import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, DOCS_AUTOGRAFA, DOCS_DIGITAL } from '../../state/store.jsx';

// Carga simulada: tiempo de "subida" antes de marcar el documento como listo.
const SIM_CARGA_MS = 1200;

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V4" />
    <path d="M7.5 8.5 12 4l4.5 4.5" />
    <path d="M5 20h14" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export default function Documentos() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, toggleDoc } = useStore();
  const [cargando, setCargando] = useState({});
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
      pend.forEach((d) =>
        toggleDoc(d.id, { nombre: 'cargado con el comprobante', tamKB: 0, tipo: 'demo', demo: true, auto: true })
      );
      setCargando((c) => {
        const n = { ...c };
        pend.forEach((d) => (n[d.id] = false));
        return n;
      });
      track('click', { target: 'doc_autocompletar', desde: gatilloId, nDocs: pend.length });
    }, 800);
  };

  const seleccionar = (d, e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reelegir el mismo archivo
    if (!file) return;
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
                return (
                  <label key={d.id} className={`hub-item doc-item${done ? ' done' : ''}`}>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      disabled={load}
                      onChange={(e) => seleccionar(d, e)}
                    />
                    <span className="grow" style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{d.nombre}</div>
                      <div className="sub">{subLinea(meta, load)}</div>
                    </span>
                    <span className="doc-trailing">
                      {load ? (
                        <span className="spin-sm" aria-label="Cargando" />
                      ) : done ? (
                        <span className="doc-ic ok">
                          <IconCheck />
                        </span>
                      ) : (
                        <span className="doc-ic">
                          <IconUpload />
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}

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
