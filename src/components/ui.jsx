import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore } from '../state/store.jsx';
import { GRUPOS_PRUEBA, grupoDeRuta, grupoEnCurso } from '../flow.js';
import TareaProgreso from './TareaProgreso.jsx';

// Icon-button "✕" del topbar en el flujo de solicitud. Al tocarlo abre una
// alerta (estilo producto) preguntando si guardar antes de salir. La solicitud
// se autoguarda; "Guardar y salir" solo lleva a Solicitudes -> Guardadas.
// "Salir sin guardar" descarta la solicitud (reset) y vuelve al dashboard.
export function CerrarSolicitud() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useMetrics();
  const { reset } = useStore();

  const guardar = () => {
    track('click', { target: 'cerrar_guardar', desde: location.pathname });
    navigate('/solicitudes');
  };
  const descartar = () => {
    track('click', { target: 'cerrar_descartar', desde: location.pathname });
    reset();
    try {
      localStorage.removeItem('toko.solicitud.v1');
    } catch {
      /* noop */
    }
    navigate('/inicio');
  };

  return (
    <>
      <IconButton
        aria-label="Cerrar solicitud"
        onClick={() => {
          track('click', { target: 'cerrar_solicitud', desde: location.pathname });
          setOpen(true);
        }}
      >
        ✕
      </IconButton>
      {open && (
        <div className="panel-backdrop" onClick={() => setOpen(false)}>
          <div
            className="panel dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Guardar la solicitud"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>¿Guardar la solicitud?</h2>
            <p className="small">
              Puedes retomarla después desde Solicitudes → Guardadas.
            </p>
            <div className="dialog-actions">
              <Button variant="primary" onClick={guardar}>
                Guardar y salir
              </Button>
              <Button variant="ghost" onClick={descartar}>
                Salir sin guardar
              </Button>
              <Button variant="link" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const IconInstrucciones = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 11h6M9 15h4" />
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
  </svg>
);

// La barra de estatus es puramente decorativa (9:41/5G, para que se vea como
// un telefono real) EXCEPTO mientras hay una tarea de prueba en curso: ahi se
// convierte en el disparador de "Instrucciones" (antes un FAB flotante que en
// movil se encimaba con el contenido). Vive en el mismo lugar en todas las
// pantallas, asi que nunca compite por espacio con botones reales del flujo.
export function StatusBar() {
  const location = useLocation();
  const { solicitud } = useStore();
  const { track } = useMetrics();
  const [open, setOpen] = useState(false);

  const modo = (() => {
    try {
      return localStorage.getItem('toko.mod') === '1';
    } catch {
      return false;
    }
  })();

  // Fuera de una ruta de bloque especifica (dashboard, solicitudes, hub) se
  // usa el grupo en curso: el primero cuyo bloque final aun no esta completo.
  const enNavegacion = ['/inicio', '/solicitudes', '/solicitud'].includes(location.pathname);
  const grupoId = grupoDeRuta(location.pathname) || (enNavegacion ? grupoEnCurso(solicitud) : null);
  const grupo = grupoId ? GRUPOS_PRUEBA.find((g) => g.id === grupoId) : null;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!grupo) {
    return (
      <div className="statusbar">
        <span>9:41</span>
        <span className="dots">····</span>
        <span>5G ▓▓▓</span>
      </div>
    );
  }

  const abrir = () => {
    setOpen(true);
    track('sheet_open', { tipo: 'instrucciones', tarea: grupo.id });
  };

  return (
    <>
      <button
        type="button"
        className="statusbar statusbar-btn"
        onClick={abrir}
        title="Ver las instrucciones de la tarea"
      >
        <IconInstrucciones />
        Instrucciones
      </button>

      {open && (
        <MetaSheet label={`Tarea ${grupo.num} de ${GRUPOS_PRUEBA.length}`} onClose={() => setOpen(false)}>
          <TareaProgreso currentId={grupo.id} />
          <h1 style={{ marginTop: 12 }}>{grupo.titulo}</h1>
          <div className="card">
            <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Escenario
            </div>
            <p className="small" style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>
              {grupo.escenario}
            </p>
          </div>

          {modo && (
            <div className="card">
              <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Que observar (facilitador)
              </div>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {grupo.observar.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </MetaSheet>
      )}
    </>
  );
}

// Barra de contexto para las pantallas de investigacion (no producto).
export function MetaBar({ label }) {
  return (
    <div className="metabar">
      <span>{label}</span>
    </div>
  );
}

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
const IconHome = () => (
  <svg {...svgProps}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V21h14V9.5" />
  </svg>
);
const IconList = () => (
  <svg {...svgProps}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" strokeWidth="2.4" />
  </svg>
);
const IconBell = () => (
  <svg {...svgProps}>
    <path d="M6 9a6 6 0 0 1 12 0c0 4.5 2 5.5 2 5.5H4S6 13.5 6 9" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);
const IconChart = () => (
  <svg {...svgProps}>
    <path d="M4 20V11M10 20V4M16 20v-6M21 20H3" />
  </svg>
);

// Sheet "Nueva ..." — se abre desde el + del header (antes era un FAB flotante).
function NuevaSheet({ open, onClose }) {
  const navigate = useNavigate();
  const { track } = useMetrics();
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="handle" />
        <button
          className="sheet-item"
          onClick={() => {
            track('click', { target: 'nueva_solicitud_credito' });
            navigate('/nueva');
          }}
        >
          Nueva solicitud de credito <span>+</span>
        </button>
        <button className="sheet-item" onClick={onClose}>
          Nueva consulta de capacidad <span>+</span>
        </button>
        <button className="sheet-item" onClick={onClose}>
          Nueva cotizacion <span>+</span>
        </button>
      </div>
    </div>
  );
}

const IconHelp = () => (
  <svg {...svgProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.2a2.4 2.4 0 0 1 4.8.2c0 1.6-2.4 2-2.4 3.8" />
    <path d="M12 17h.01" strokeWidth="2.4" />
  </svg>
);

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

// Fila para disparar CapturaDocumento (INE, talon/estado de cuenta,
// documentos del bloque 5): un solo estilo para "adjuntar un documento" en
// toda la app, para que no se vea distinto segun la pantalla.
export function DocTrigger({ nombre, sub, done, load, onClick, disabled }) {
  return (
    <button
      type="button"
      className={`hub-item doc-item${done ? ' done' : ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      <span className="grow" style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{nombre}</div>
        <div className="sub">{sub}</div>
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
    </button>
  );
}

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const { track } = useMetrics();
  return (
    <div className="app-header">
      <IconButton
        aria-label="Ayuda"
        onClick={() => track('click', { target: 'ayuda' })}
      >
        <IconHelp />
      </IconButton>
      <Button
        variant="primary"
        size="sm"
        onClick={() => {
          track('click', { target: 'fab_nueva' });
          setOpen(true);
        }}
      >
        <span aria-hidden="true">+</span> Nueva
      </Button>
      <NuevaSheet open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

export function BottomNav({ active }) {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const go = (to, id) => {
    track('click', { target: `nav_${id}` });
    navigate(to);
  };
  return (
    <div className="bottom-nav">
      <button className={active === 'home' ? 'active' : ''} aria-label="Inicio" onClick={() => go('/inicio', 'inicio')}>
        <IconHome />
      </button>
      <button className={active === 'list' ? 'active' : ''} aria-label="Solicitudes" onClick={() => go('/solicitudes', 'solicitudes')}>
        <IconList />
      </button>
      <button aria-label="Notificaciones" onClick={() => track('click', { target: 'nav_notificaciones' })}>
        <IconBell />
      </button>
      <button aria-label="Reportes" onClick={() => track('click', { target: 'nav_reportes' })}>
        <IconChart />
      </button>
    </div>
  );
}

export function TopBar({ title, onBack, onClose, right }) {
  const navigate = useNavigate();
  const { track } = useMetrics();
  return (
    <div className="topbar">
      {onBack === null ? (
        <span style={{ width: 60 }} />
      ) : (
        <button
          onClick={() => {
            track('click', { target: 'volver' });
            onBack ? onBack() : navigate(-1);
          }}
        >
          ← Regresar
        </button>
      )}
      {title ? <strong className="small">{title}</strong> : <span className="grow" />}
      {right ??
        (onClose === undefined ? (
          <IconButton
            aria-label="Cerrar"
            onClick={() => {
              track('click', { target: 'cerrar' });
              navigate('/inicio');
            }}
          >
            ✕
          </IconButton>
        ) : onClose ? (
          <IconButton aria-label="Cerrar" onClick={onClose}>
            ✕
          </IconButton>
        ) : (
          <span style={{ width: 24 }} />
        ))}
    </div>
  );
}

export function ProgressHeader({ pct }) {
  return (
    <div className="progress" style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid var(--line-2)' }}>
      <div className="track">
        <div className="fill" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>
      <span className="pctlabel">{Math.round(pct)}%</span>
    </div>
  );
}

export function Screen({ children, meta = false }) {
  return <div className={`screen${meta ? ' meta' : ''}`}>{children}</div>;
}

export function Content({ children, tight }) {
  return <div className={`content${tight ? ' tight' : ''}`}>{children}</div>;
}

// Overlay del instrumento de la prueba (intro de tarea, SEQ, Bienvenida, SUS,
// panel de Instrucciones). Se abre SOBRE la pantalla de fondo: modal centrado
// en desktop, bottom sheet a todo el ancho en movil.
//   - sin onClose  -> OBLIGATORIO: no se cierra (intro, SEQ, Bienvenida, SUS).
//   - con onClose   -> se cierra tocando el fondo o el boton "Cerrar"
//                      (Instrucciones, que se reabre con su FAB).
export function MetaSheet({ label, children, onClose }) {
  const dismissible = typeof onClose === 'function';
  return (
    <div className="flowsheet-backdrop" onClick={dismissible ? () => onClose() : undefined}>
      <div
        className="flowsheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={dismissible ? (e) => e.stopPropagation() : undefined}
      >
        <div className="flowsheet-handle" aria-hidden="true" />
        {(label || dismissible) && (
          <div className="flowsheet-top">
            <span className="flowsheet-label">{label}</span>
            {dismissible && (
              <Button variant="ghost" size="sm" onClick={() => onClose()}>
                Cerrar
              </Button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function FooterActions({ children }) {
  return <div className="footer-actions">{children}</div>;
}

// Boton unico y reutilizable de todo el sistema. variant: primary (amarillo,
// la accion principal) / secondary (tonal, relleno suave del amarillo) /
// ghost (transparente con borde) / link (texto azul subrayado, sin fondo).
// size: sin size = "md" (default); "sm" para espacios chicos. El disabled
// (gris plano, igual en las 3 variantes con fondo) lo resuelve el CSS solo.
export function Button({ variant = 'primary', size, className = '', track: trackName, children, onClick, ...rest }) {
  const { track } = useMetrics();
  return (
    <button
      className={`btn ${variant}${size ? ` ${size}` : ''} ${className}`}
      onClick={(e) => {
        if (trackName) track('click', { target: trackName });
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

// Version icon-only del mismo sistema: mismas 3 variantes (default ghost,
// el uso mas comun para iconos de chrome como regresar/cerrar), cuadrado
// fijo (nunca circulo) y el mismo disabled gris.
export function IconButton({ variant = 'ghost', className = '', track: trackName, children, onClick, ...rest }) {
  const { track } = useMetrics();
  return (
    <button
      type="button"
      className={`icon-btn ${variant} ${className}`}
      onClick={(e) => {
        if (trackName) track('click', { target: trackName });
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SummaryRow({ k, v, total }) {
  return (
    <div className={`summary-row${total ? ' total' : ''}`}>
      <span className="k">{k}</span>
      <span className="v">{v}</span>
    </div>
  );
}

export function Callout({ kind = 'info', children }) {
  return <div className={`callout ${kind}`}>{children}</div>;
}
