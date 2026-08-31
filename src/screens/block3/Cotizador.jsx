import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, SummaryRow, Callout, GuardarSalir } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import {
  FIN_CONFIG,
  cotizar,
  capacidadPagoQuincenal,
  generarOfertas,
  mxn,
  pct,
} from '../../domain/finance.js';

export default function Cotizador() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();

  const nombre = solicitud.datos.personales?.nombre || 'el cliente';
  const ingreso =
    Number(solicitud.datos.ingresos?.ingresoMensualComprobable) || FIN_CONFIG.ingresoMensualDemo;
  const capacidad = useMemo(
    () => capacidadPagoQuincenal(ingreso, FIN_CONFIG.otrosDescuentosQuincenalDemo),
    [ingreso]
  );

  const [tab, setTab] = useState('cotizador');
  const [monto, setMonto] = useState(solicitud.oferta?.monto || FIN_CONFIG.montoMin);
  // El plazo NO viene preseleccionado: el asesor debe elegirlo (se le indica cual).
  const [plazo, setPlazo] = useState(solicitud.oferta?.nQuincenas ?? null);
  const [ofertaSel, setOfertaSel] = useState(null);

  const r = useMemo(() => (plazo ? cotizar(monto, plazo) : null), [monto, plazo]);
  const ofertas = useMemo(() => generarOfertas(capacidad), [capacidad]);

  const excede = !!r && r.pagoQuincenal > capacidad;
  const usoPct = r ? Math.min(100, Math.round((r.pagoQuincenal / capacidad) * 100)) : 0;
  const montoPct = Math.round(
    ((monto - FIN_CONFIG.montoMin) / (FIN_CONFIG.montoMax - FIN_CONFIG.montoMin)) * 100
  );

  const confirmar = (origen, resumen, m, n) => {
    patch({
      capacidadPago: capacidad,
      oferta: {
        monto: m,
        nQuincenas: n,
        origen,
        confirmada: true,
        resumen: {
          pagoQuincenal: resumen.pagoQuincenal,
          totalPagar: resumen.totalPagar,
          cat: resumen.cat,
          tasaAnualFija: resumen.tasaAnualFija,
          montoDispersado: resumen.montoDispersado,
        },
      },
    });
    track('task_complete', {
      tarea: 'seleccionar_oferta',
      resultado: 'exito',
      origen,
      monto: m,
      nQuincenas: n,
      pagoQuincenal: resumen.pagoQuincenal,
      totalPagar: resumen.totalPagar,
      catPct: Number((resumen.cat * 100).toFixed(2)),
    });
    navigate('/seq/seleccionar_oferta', { replace: true });
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Seleccionar oferta" right={<GuardarSalir />} onBack={null} />
      <Content>
        <div className="segmented" style={{ marginBottom: 16 }}>
          <button
            className={tab === 'cotizador' ? 'active' : ''}
            onClick={() => {
              setTab('cotizador');
              track('click', { target: 'tab_cotizador' });
            }}
          >
            Cotizador
          </button>
          <button
            className={tab === 'ofertas' ? 'active' : ''}
            onClick={() => {
              setTab('ofertas');
              track('click', { target: 'tab_ofertas' });
            }}
          >
            Ofertas
          </button>
        </div>

        {tab === 'cotizador' ? (
          <>
            <h1>Configura la oferta para {nombre}</h1>

            <div className="slider-block">
              <div className="cap">Lo que recibira en su cuenta</div>
              <div className="big">{mxn(monto)}</div>
              <input
                type="range"
                min={FIN_CONFIG.montoMin}
                max={FIN_CONFIG.montoMax}
                step={FIN_CONFIG.montoStep}
                value={monto}
                style={{
                  background: `linear-gradient(to right, var(--brand) 0 ${montoPct}%, var(--line) ${montoPct}% 100%)`,
                }}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMonto(v);
                  track('field_change', { campo: 'cotizador_monto', valor: v });
                }}
              />
              <div className="range-ends">
                <span>{mxn(FIN_CONFIG.montoMin)}</span>
                <span>{mxn(FIN_CONFIG.montoMax)}</span>
              </div>
            </div>

            <div className="slider-block" style={{ marginTop: 12 }}>
              <div className="cap">Pago quincenal que realizara</div>
              <div className="big">{r ? mxn(r.pagoQuincenal) : '—'}</div>
              <div className={`capacity-meter${excede ? ' over' : ''}`}>
                <div className="bar">
                  <i style={{ width: `${usoPct}%` }} />
                </div>
                <div className="range-ends">
                  <span>{r ? `${usoPct}% de la capacidad` : 'Elige el numero de quincenas'}</span>
                  <span>Capacidad de pago {mxn(capacidad)}</span>
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 16 }}>
              <label>Quincenas disponibles</label>
              <div className="chip-row">
                {FIN_CONFIG.plazosSugeridos.map((n) => (
                  <button
                    key={n}
                    className={`chip${plazo === n ? ' active' : ''}`}
                    onClick={() => {
                      setPlazo(n);
                      track('field_change', { campo: 'cotizador_plazo', valor: n });
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {excede && (
              <Callout kind="warn">
                El pago quincenal supera la capacidad de pago del cliente. Reduce el monto o
                aumenta el numero de quincenas.
              </Callout>
            )}

            {!r && (
              <Callout kind="info">
                Selecciona el numero de quincenas para ver el pago y el resumen del credito.
              </Callout>
            )}

            {r && (
              <>
                <h2>Resumen del credito</h2>
                <div className="card">
                  <SummaryRow k="Monto a dispersar" v={mxn(r.montoDispersado)} />
                  <SummaryRow k="Pago quincenal" v={mxn(r.pagoQuincenal)} />
                  <SummaryRow k="Quincenas totales" v={r.nQuincenas} />
                  <SummaryRow k="Intereses + seguro" v={mxn(r.totalPagar - r.monto)} />
                  <SummaryRow k="Total a pagar" v={mxn(r.totalPagar)} total />
                </div>

                <p className="tiny" style={{ marginTop: 12 }}>
                  Prestamo sujeto a aprobacion. Para fines informativos y de comparacion. La tasa
                  presentada es fija, anual, simple y antes de impuestos.
                  <br />
                  <strong>CAT anual de {pct(r.cat)} sin IVA. Tasa anual fija de {pct(r.tasaAnualFija, 2)}.</strong>
                  <br />
                  La tasa de interes se ajusta de acuerdo al historial crediticio del solicitante.
                  Consulta terminos y condiciones en www.creditomaestro.com
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <h1>Selecciona una oferta</h1>
            <div className="card" style={{ marginBottom: 12 }}>
              <SummaryRow k="Capacidad de pago" v={mxn(capacidad)} />
            </div>
            <div className="stack">
              {ofertas.map((o) => {
                const sel = ofertaSel === o.id;
                return (
                  <button
                    key={o.id}
                    className="card"
                    style={{
                      textAlign: 'left',
                      borderColor: sel ? 'var(--brand)' : 'var(--line)',
                      background: sel ? 'var(--brand-50)' : 'var(--surface)',
                    }}
                    onClick={() => {
                      setOfertaSel(o.id);
                      track('click', { target: `oferta_${o.id}` });
                    }}
                  >
                    <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                      {o.titulo}
                    </div>
                    <div className="small muted" style={{ margin: '4px 0 8px' }}>{o.detalle}</div>
                    <div className="row between">
                      <strong>{mxn(o.monto)}</strong>
                      <span>{o.nQuincenas} quincenas</span>
                    </div>
                    {o.descuento ? (
                      <div className="tiny" style={{ color: 'var(--brand-ink)' }}>
                        {mxn(o.descuento)} de descuento
                      </div>
                    ) : null}
                    <div className="row between tiny" style={{ marginTop: 6 }}>
                      <span>Pago {mxn(o.pagoQuincenal)}/quincena</span>
                      <span>CAT {pct(o.cat)}</span>
                    </div>
                    <div className="tiny">Total {mxn(o.totalPagar)}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Content>

      <FooterActions>
        {tab === 'cotizador' ? (
          <Button
            variant="primary"
            disabled={excede || !r}
            onClick={() => confirmar('cotizador', r, r.monto, r.nQuincenas)}
            track="confirmar_oferta_cotizador"
          >
            {r ? 'Confirmar oferta →' : 'Elige el plazo para continuar'}
          </Button>
        ) : (
          <Button
            variant="primary"
            disabled={!ofertaSel}
            onClick={() => {
              const o = ofertas.find((x) => x.id === ofertaSel);
              confirmar(`oferta:${o.id}`, o, o.monto, o.nQuincenas);
            }}
            track="confirmar_oferta_seleccionada"
          >
            Confirmar oferta seleccionada →
          </Button>
        )}
      </FooterActions>
    </Screen>
  );
}
