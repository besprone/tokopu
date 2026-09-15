import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button, SummaryRow } from '../../components/ui.jsx';
import {
  getSesionAPI,
  descargarSesionAPI,
  haySesionMod,
  cerrarSesionMod,
  descargarBlob,
} from '../../moderador/api.js';
import { getSesionLocal } from '../../metrics/track.js';
import { GRUPOS_PRUEBA, ORDEN_GRUPOS } from '../../flow.js';
const fecha = (iso) => (iso ? new Date(iso).toLocaleString('es-MX') : '—');

export default function ModDetalle() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [s, setS] = useState(null);
  const [modo, setModo] = useState('cargando');
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      if (haySesionMod()) {
        try {
          setS(await getSesionAPI(id));
          setModo('api');
          return;
        } catch (e) {
          if (String(e.message) === '401') {
            cerrarSesionMod();
            navigate('/moderador', { replace: true });
            return;
          }
        }
      }
      const local = getSesionLocal(id);
      if (local) {
        setS(local);
        setModo('local');
      } else {
        setErr('No se encontro la sesion.');
        setModo('local');
      }
    })();
  }, [id]); // eslint-disable-line

  const bajar = async (format) => {
    try {
      if (modo === 'api') {
        await descargarSesionAPI(id, format);
      } else {
        descargarBlob(
          `toko-sesion-${String(id).slice(0, 8)}.json`,
          JSON.stringify(s, null, 2),
          'application/json'
        );
      }
    } catch {
      setErr('No se pudo descargar.');
    }
  };

  if (modo === 'cargando') {
    return (
      <Screen meta>
        <MetaBar label="Area de moderador" />
        <Content>
          <p className="muted">Cargando…</p>
        </Content>
      </Screen>
    );
  }

  if (!s) {
    return (
      <Screen meta>
        <MetaBar label="Area de moderador" />
        <Content>
          <h1>Sesion</h1>
          <div className="callout danger">{err || 'No disponible.'}</div>
        </Content>
        <FooterActions>
          <Button variant="ghost" onClick={() => navigate('/moderador/sesiones')}>
            ← Regresar
          </Button>
        </FooterActions>
      </Screen>
    );
  }

  const m = s.meta || {};
  const sus = s.sus || {};
  const t = s.tareas || {};
  const porTipo = (s.resumen && s.resumen.porTipo) || {};
  const flags = (s.eventos || []).filter((e) => e.evento === 'observer_flag');
  const o = s.solicitud?.oferta;

  return (
    <Screen meta>
      <MetaBar label="Area de moderador" />
      <Content>
        <span className="tiny">{s.completa ? 'Sesion completa' : 'Sesion parcial'}</span>
        <h1>{m.participante || 'sin nombre'}</h1>
        <p className="lead">
          {fecha(m.startedAtISO)} · {(s.eventos || []).length} eventos · ID {String(m.sessionId || '').slice(0, 8)}
          {' · '}
          {m.modoSesion === 'remota' ? 'Remota' : 'Moderada'}
        </p>

        <div className="card" style={{ textAlign: 'center' }}>
          <div className="tiny">Puntaje SUS</div>
          <div className="big-score">{sus.completo ? sus.puntaje : '—'}</div>
          <div className="small muted">
            {sus.completo ? `${sus.interpretacion} · escala 0–100` : 'SUS incompleto'}
          </div>
        </div>

        <h2>SEQ y tiempos por tarea</h2>
        <div className="card">
          {ORDEN_GRUPOS.map((tid, i) => (
            <SummaryRow
              key={tid}
              k={GRUPOS_PRUEBA[i].titulo}
              v={
                <>
                  {t[tid]?.seq != null ? `${t[tid].seq}/7` : '—'}
                  {t[tid]?.duracionMs != null && (
                    <span className="muted small"> · {(t[tid].duracionMs / 1000).toFixed(0)}s</span>
                  )}
                  {t[tid]?.errores ? (
                    <span className="muted small"> · {t[tid].errores} err</span>
                  ) : null}
                </>
              }
            />
          ))}
        </div>

        {o && (
          <>
            <h2>Oferta seleccionada</h2>
            <div className="card">
              <SummaryRow k="Monto" v={o.monto} />
              <SummaryRow k="Quincenas" v={o.nQuincenas} />
              <SummaryRow k="Origen" v={o.origen || '—'} />
              {o.resumen && (
                <>
                  <SummaryRow k="Pago quincenal" v={o.resumen.pagoQuincenal} />
                  <SummaryRow k="Total a pagar" v={o.resumen.totalPagar} />
                  <SummaryRow k="CAT" v={`${((o.resumen.cat || 0) * 100).toFixed(1)}%`} />
                </>
              )}
            </div>
          </>
        )}

        {flags.length > 0 && (
          <>
            <h2>Marcas del observador ({flags.length})</h2>
            <div className="card">
              {flags.map((f, i) => (
                <div key={i} className="small" style={{ padding: '6px 0' }}>
                  <span className="muted tiny">{new Date(f.tsISO).toLocaleTimeString('es-MX')}</span>
                  {' — '}
                  {f.nota || '(sin nota)'}
                </div>
              ))}
            </div>
          </>
        )}

        <h2>Eventos</h2>
        <div className="card tiny mono" style={{ whiteSpace: 'pre-wrap' }}>
          total: {(s.eventos || []).length}
          {'\n'}
          {Object.entries(porTipo)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}
        </div>

        {err && (
          <div className="callout danger" style={{ marginTop: 12 }}>
            {err}
          </div>
        )}
      </Content>
      <FooterActions>
        <div className="row" style={{ gap: 8 }}>
          <Button variant="ghost" className="sm grow" onClick={() => bajar('json')}>
            Descargar · JSON
          </Button>
          {modo === 'api' && (
            <Button variant="ghost" className="sm grow" onClick={() => bajar('md')}>
              Descargar · MD
            </Button>
          )}
        </div>
        <Button variant="ghost" onClick={() => navigate('/moderador/sesiones')}>
          ← Regresar a la lista
        </Button>
      </FooterActions>
    </Screen>
  );
}
