import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMetrics } from '../metrics/MetricsProvider.jsx';
import { useStore } from '../state/store.jsx';

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
      <button
        className="topbar-x"
        aria-label="Cerrar solicitud"
        onClick={() => {
          track('click', { target: 'cerrar_solicitud', desde: location.pathname });
          setOpen(true);
        }}
      >
        ✕
      </button>
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
              <button className="btn link" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function StatusBar() {
  return (
    <div className="statusbar">
      <span>9:41</span>
      <span className="dots">····</span>
      <span>5G ▓▓▓</span>
    </div>
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

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const { track } = useMetrics();
  return (
    <div className="app-header">
      <button
        className="header-help"
        aria-label="Ayuda"
        onClick={() => track('click', { target: 'ayuda' })}
      >
        <IconHelp />
      </button>
      <button
        className="header-add"
        onClick={() => {
          track('click', { target: 'fab_nueva' });
          setOpen(true);
        }}
      >
        <span aria-hidden="true">+</span> Nueva
      </button>
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
          <button
            onClick={() => {
              track('click', { target: 'cerrar' });
              navigate('/inicio');
            }}
          >
            ✕
          </button>
        ) : onClose ? (
          <button onClick={onClose}>✕</button>
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
              <button type="button" className="btn ghost sm" onClick={() => onClose()}>
                Cerrar
              </button>
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

export function Button({ variant = 'primary', className = '', track: trackName, children, onClick, ...rest }) {
  const { track } = useMetrics();
  return (
    <button
      className={`btn ${variant} ${className}`}
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
