import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button } from '../../components/ui.jsx';
import {
  listarSesionesAPI,
  borrarTodasAPI,
  descargarExportAPI,
  cerrarSesionMod,
  haySesionMod,
  descargarBlob,
} from '../../moderador/api.js';
import {
  listarSesionesLocales,
  borrarSesionesLocales,
  exportarLocalesJSON,
  exportarLocalesCSV,
} from '../../metrics/track.js';

function resumenLocal(s) {
  const m = s.meta || {};
  return {
    id: m.sessionId,
    nombre: m.participante || 'sin nombre',
    fechaISO: m.startedAtISO || null,
    completa: !!s.completa,
    nEventos: (s.eventos || []).length,
    sus: s.sus?.completo ? s.sus.puntaje : null,
    sincronizada: s.sincronizada,
  };
}

const fecha = (iso) => (iso ? new Date(iso).toLocaleString('es-MX') : '—');

export default function ModSesiones() {
  const navigate = useNavigate();
  const [modo, setModo] = useState('cargando'); // 'cargando' | 'api' | 'local'
  const [sesiones, setSesiones] = useState([]);
  const [msg, setMsg] = useState('');

  const cargar = async () => {
    if (haySesionMod()) {
      try {
        setSesiones(await listarSesionesAPI());
        setModo('api');
        return;
      } catch (e) {
        if (String(e.message) === '401') {
          cerrarSesionMod();
          navigate('/moderador', { replace: true });
          return;
        }
        // backend caido -> local
      }
    }
    setSesiones(listarSesionesLocales().map(resumenLocal));
    setModo('local');
  };

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line

  const descargar = async (format) => {
    setMsg('');
    try {
      if (modo === 'api') {
        await descargarExportAPI(format);
      } else {
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        if (format === 'csv') {
          descargarBlob(`toko-sesiones-local-${stamp}.csv`, exportarLocalesCSV(), 'text/csv;charset=utf-8');
        } else {
          descargarBlob(
            `toko-sesiones-local-${stamp}.json`,
            JSON.stringify(exportarLocalesJSON(), null, 2),
            'application/json'
          );
        }
      }
    } catch {
      setMsg('No se pudo generar la descarga.');
    }
  };

  const borrar = async () => {
    if (!confirm('Borrar TODAS las sesiones? No se puede deshacer.')) return;
    try {
      if (modo === 'api') await borrarTodasAPI();
      else borrarSesionesLocales();
      cargar();
    } catch {
      setMsg('No se pudo borrar.');
    }
  };

  return (
    <Screen meta>
      <MetaBar label="Area de moderador" />
      <Content>
        <div className="row between">
          <h1 style={{ margin: 0 }}>Sesiones ({sesiones.length})</h1>
          {modo === 'api' && (
            <button
              className="btn link"
              style={{ padding: 0 }}
              onClick={() => {
                cerrarSesionMod();
                navigate('/moderador', { replace: true });
              }}
            >
              Cerrar sesion
            </button>
          )}
        </div>

        {modo === 'local' && (
          <div className="callout info" style={{ marginTop: 10 }}>
            Modo local: mostrando solo las sesiones guardadas en este navegador (backend no
            disponible o sin login).
          </div>
        )}
        {msg && (
          <div className="callout danger" style={{ marginTop: 10 }}>
            {msg}
          </div>
        )}

        <div className="stack" style={{ gap: 8, marginTop: 14 }}>
          {sesiones.length === 0 && <p className="muted small">Sin sesiones todavia.</p>}
          {sesiones.map((s) => (
            <button
              key={s.id}
              className="hub-item"
              onClick={() => navigate(`/moderador/sesion/${s.id}`)}
            >
              <span className="grow" style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.nombre}</div>
                <div className="sub">
                  {fecha(s.fechaISO)} · {s.nEventos} eventos
                  {s.sus != null ? ` · SUS ${s.sus}` : ''}
                  {s.sincronizada === false ? ' · sin sincronizar' : ''}
                </div>
              </span>
              <span className={s.completa ? 'badge-check' : 'muted'} style={{ fontSize: 12 }}>
                {s.completa ? 'completa' : 'parcial'}
              </span>
            </button>
          ))}
        </div>

        <div className="stack" style={{ gap: 8, marginTop: 18 }}>
          <div className="row" style={{ gap: 8 }}>
            <Button variant="ghost" className="sm grow" onClick={() => descargar('json')}>
              Descargar todo · JSON
            </Button>
            <Button variant="ghost" className="sm grow" onClick={() => descargar('csv')}>
              Descargar todo · CSV
            </Button>
          </div>
          <Button variant="ghost" className="sm" onClick={borrar}>
            Borrar todas las sesiones
          </Button>
        </div>
      </Content>
      <FooterActions>
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Regresar al inicio
        </Button>
      </FooterActions>
    </Screen>
  );
}
