import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMetrics } from '../metrics/MetricsProvider.jsx';

// Boton "Guardar y salir" del topbar en el flujo de solicitud. La solicitud se
// autoguarda en cada cambio; esto solo saca al asesor del flujo. Se reanuda
// desde "Guardadas" en la pantalla de Solicitudes.
export function GuardarSalir() {
  const navigate = useNavigate();
  const location = useLocation();
  const { track } = useMetrics();
  return (
    <button
      className="save-exit"
      onClick={() => {
        track('click', { target: 'guardar_y_salir', desde: location.pathname });
        navigate('/solicitudes');
      }}
    >
      Guardar y salir
    </button>
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

const AppleGlyph = () => (
  <svg viewBox="0 0 24 24" fill="#14181f" aria-hidden="true">
    <path d="M16.7 12.6c0-2.5 2-3.7 2.1-3.8-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.15-2.9.87-3.65.87-.76 0-1.9-.85-3.13-.83-1.6.02-3.08.93-3.9 2.36-1.67 2.9-.43 7.2 1.2 9.55.8 1.15 1.74 2.45 2.98 2.4 1.2-.05 1.65-.78 3.1-.78 1.44 0 1.85.78 3.12.75 1.29-.02 2.1-1.17 2.9-2.33.63-.92 1.02-1.79 1.05-1.86-.02-.01-2.35-.9-2.37-3.44z" />
    <path d="M14.6 4.5c.67-.8 1.12-1.92 1-3.04-.96.04-2.13.64-2.82 1.44-.62.7-1.16 1.85-1.02 2.94 1.07.08 2.17-.55 2.84-1.34z" />
  </svg>
);

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

export function AppHeader() {
  return (
    <div className="app-header">
      <span className="brand">
        <AppleGlyph />
      </span>
      <div className="row" style={{ gap: 12 }}>
        <button className="hicon" aria-label="Ayuda">
          ?
        </button>
        <span className="avatar" aria-hidden="true" />
      </div>
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

export function NewRequestFab() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { track } = useMetrics();
  return (
    <>
      <button
        className="fab"
        aria-label="Nueva"
        onClick={() => {
          track('click', { target: 'fab_nueva' });
          setOpen(true);
        }}
      >
        +
      </button>
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
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
            <button className="sheet-item" onClick={() => setOpen(false)}>
              Nueva consulta de capacidad <span>+</span>
            </button>
            <button className="sheet-item" onClick={() => setOpen(false)}>
              Nueva cotizacion <span>+</span>
            </button>
          </div>
        </div>
      )}
    </>
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
