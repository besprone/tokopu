import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Button, TopBar } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import { DEPENDENCIAS } from '../../domain/catalogs.js';

// Feedback tras "Enviar solicitud" en el hub (flujo de FIRMA AUTOGRAFA).
// El flujo digital se retoma despues. Antes habia tambien una pantalla de
// resumen (/completada sin enviar); esa desaparecio: el resumen ahora es el hub.
const CONFETI = [
  { l: '8%', d: 0, c: '#1f7a34', r: -20, y: 300, s: 'rect' },
  { l: '20%', d: 0.15, c: '#f0a020', r: 40, y: 150, s: 'rect' },
  { l: '32%', d: 0.05, c: '#e9a7b0', r: 12, y: 260, s: 'rect' },
  { l: '45%', d: 0.28, c: '#c060d8', r: 0, y: 120, s: 'dot' },
  { l: '55%', d: 0.1, c: '#1f7a34', r: 30, y: 360, s: 'rect' },
  { l: '66%', d: 0.34, c: '#3b82c4', r: -25, y: 210, s: 'rect' },
  { l: '78%', d: 0.08, c: '#c060d8', r: 0, y: 320, s: 'dot' },
  { l: '88%', d: 0.22, c: '#1f7a34', r: 18, y: 180, s: 'rect' },
  { l: '14%', d: 0.42, c: '#f0a020', r: -12, y: 400, s: 'rect' },
  { l: '38%', d: 0.5, c: '#c060d8', r: 0, y: 440, s: 'dot-sm' },
  { l: '60%', d: 0.46, c: '#e9a7b0', r: 22, y: 470, s: 'rect' },
  { l: '72%', d: 0.56, c: '#1f7a34', r: -30, y: 410, s: 'rect' },
];

function Confeti() {
  return (
    <div className="confeti" aria-hidden="true">
      {CONFETI.map((p, i) => (
        <span
          key={i}
          className={`confeti-p ${p.s}`}
          style={{
            left: p.l,
            background: p.c,
            animationDelay: `${p.d}s`,
            '--r': `${p.r}deg`,
            '--fall': `${p.y}px`,
          }}
        />
      ))}
    </div>
  );
}

export default function Completada() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();

  useEffect(() => {
    if (!solicitud.enviada) {
      patch({ enviada: true, enviadaISO: new Date().toISOString() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombre =
    [
      solicitud.datos.personales?.nombre,
      solicitud.datos.personales?.apellidoPaterno,
      solicitud.datos.personales?.apellidoMaterno,
    ]
      .filter(Boolean)
      .join(' ') || 'el cliente';
  const o = solicitud.oferta || {};
  const tasa = o.resumen?.tasaAnualFija;
  const depNombre =
    DEPENDENCIAS.find((d) => d.id === solicitud.dependencia)?.nombre || solicitud.dependencia || '—';

  const terminar = () => {
    track('task_complete', { tarea: 'documentos_envio', resultado: 'exito' });
    navigate('/seq/documentos_envio', { replace: true });
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title={null} onBack={null} onClose={false} />
      <div className="success-screen">
        <Confeti />
        <div className="check-plain" aria-hidden="true">
          ✓
        </div>
        <h1>¡Felicidades! La solicitud ya esta en proceso de evaluacion.</h1>
        <p>
          Te notificaremos lo antes posible del analisis de la solicitud.{' '}
          <strong>El tiempo medio de aprobacion es de 37 minutos.</strong>
        </p>
        <div className="card resumen-envio">
          <div>
            <span className="k">Nombre:</span> {nombre}
          </div>
          <div>
            <span className="k">Cantidad:</span> {Number(o.monto || 0).toLocaleString('es-MX')}mxn
          </div>
          <div>
            <span className="k">Plazos:</span> {o.nQuincenas || 0} quincenas
          </div>
          {tasa != null && (
            <div>
              <span className="k">Tasa:</span> {Math.round(tasa * 100)}%
            </div>
          )}
          <div>
            <span className="k">Dependencia:</span> {depNombre}
          </div>
        </div>
        <div className="grow" />
        <Button variant="dark" onClick={terminar} track="terminar_solicitud">
          Terminar →
        </Button>
      </div>
    </Screen>
  );
}
