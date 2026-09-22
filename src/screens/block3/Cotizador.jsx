import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, SummaryRow, Callout, CerrarSolicitud } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';
import {
  FIN_CONFIG,
  cotizar,
  capacidadPagoQuincenal,
  generarOfertas,
  montoMaximoPorPago,
  mxn,
  pct,
} from '../../domain/finance.js';

// Version editable del numero grande de un slider, estilo "monto de envio"
// de una app de pagos: los digitos se acumulan como CENTAVOS de derecha a
// izquierda (igual que Venmo/SPEI en el celular) y siempre se ven con "$",
// separador de miles y los dos decimales -nunca digitos crudos sueltos. El
// slider se sincroniza en vivo con cada digito (onChange se dispara antes
// del blur); al perder el foco se recorta a [min,max].
function MontoInput({ value, min, max, onChange, trackName }) {
  const { track } = useMetrics();
  const [editando, setEditando] = useState(false);
  // Centavos totales, como string de puros digitos (p. ej. "580000" = $5,800.00).
  const [centavos, setCentavos] = useState(String(Math.round(value * 100)));

  useEffect(() => {
    if (!editando) setCentavos(String(Math.round(value * 100)));
  }, [value, editando]);

  const valorDeCentavos = Number(centavos || '0') / 100;

  return (
    <input
      type="text"
      inputMode="numeric"
      className="big-input"
      value={editando ? mxn(valorDeCentavos) : mxn(value)}
      onFocus={(e) => {
        setEditando(true);
        setCentavos(String(Math.round(value * 100)));
        requestAnimationFrame(() => e.target.select());
      }}
      onChange={(e) => {
        // Los caracteres de formato ($, comas, punto) no traen digitos, asi
        // que quitarlos deja exactamente los centavos ya tecleados mas el
        // nuevo digito (si se escribio al final) o menos el ultimo (si se
        // borro) -sin tener que rastrear a mano el cursor.
        const nuevosCentavos = e.target.value.replace(/[^0-9]/g, '');
        setCentavos(nuevosCentavos);
        const n = Number(nuevosCentavos || '0') / 100;
        onChange(n);
        if (trackName) track('field_change', { campo: trackName, valor: n });
      }}
      onBlur={() => {
        const n = Math.min(max, Math.max(min, valorDeCentavos));
        onChange(n);
        setEditando(false);
      }}
    />
  );
}

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

  const ofertas = useMemo(() => generarOfertas(capacidad), [capacidad]);
  // Oferta "recomendada": siempre hay al menos una, es la primera.
  const recomendada = ofertas[0];

  const [tab, setTab] = useState('ofertas');
  // El cotizador arranca precargado con la oferta recomendada (monto y
  // plazo), no en blanco: el asesor debe notar que el monto sugerido no es
  // el que pidio el cliente y ajustarlo -ya no "elegir el plazo desde cero"
  // (el plazo recomendado ya coincide con el pedido en el guion de la
  // tarea; ver flow.js).
  const [monto, setMonto] = useState(
    solicitud.oferta?.monto || recomendada?.monto || FIN_CONFIG.montoMin
  );
  const [plazo, setPlazo] = useState(
    solicitud.oferta?.nQuincenas ?? recomendada?.nQuincenas ?? null
  );

  const r = useMemo(() => (plazo ? cotizar(monto, plazo) : null), [monto, plazo]);
  const [ofertaSel, setOfertaSel] = useState(null);
  const ofertaSelActual = ofertaSel ?? ofertas[0]?.id ?? null;

  // Al mover el monto (slider o input), si el plazo actual ya no alcanza a
  // pagarlo dentro de la capacidad, se busca solo el plazo mas corto de los
  // disponibles que si alcance -asi nunca hace falta llegar al aviso de
  // "excede la capacidad" solo por mover el monto. Si ni el plazo mas largo
  // alcanza (capacidad muy baja), se limita el monto a lo maximo pagable ahi.
  // Cambiar el plazo a mano (los chips) SI puede seguir mostrando "excede":
  // esa es una decision explicita del asesor, no algo que el sistema deba
  // corregir por su cuenta.
  const ajustarPorMonto = (nuevoMonto) => {
    if (!plazo || cotizar(nuevoMonto, plazo).pagoQuincenal <= capacidad) {
      setMonto(nuevoMonto);
      return;
    }
    const plazoQueAlcanza = FIN_CONFIG.plazosSugeridos.find(
      (n) => cotizar(nuevoMonto, n).pagoQuincenal <= capacidad
    );
    if (plazoQueAlcanza) {
      setPlazo(plazoQueAlcanza);
      setMonto(nuevoMonto);
    } else {
      const plazoMax = FIN_CONFIG.plazosSugeridos[FIN_CONFIG.plazosSugeridos.length - 1];
      setPlazo(plazoMax);
      setMonto(montoMaximoPorPago(capacidad, plazoMax));
    }
  };

  const excede = !!r && r.pagoQuincenal > capacidad;
  const usoPct = r ? Math.min(100, Math.round((r.pagoQuincenal / capacidad) * 100)) : 0;
  const montoPct = Math.round(
    ((monto - FIN_CONFIG.montoMin) / (FIN_CONFIG.montoMax - FIN_CONFIG.montoMin)) * 100
  );

  // Rango de pago quincenal alcanzable para el plazo elegido (extremos del
  // monto min/max) -asi el propio medidor de capacidad se puede arrastrar
  // como un slider mas: mueve el pago objetivo y de ahi se despeja el monto
  // (montoMaximoPorPago invierte cotizar()), sin tocar el plazo elegido en
  // los chips. El tope es la capacidad de pago: a diferencia del slider de
  // monto (que si puede llevar a "excede", pues su rango es politica de
  // producto, no la capacidad de ESTE cliente), este slider representa
  // justo esa capacidad, asi que no tiene sentido dejarlo pasarse de ahi.
  const pagoRango = useMemo(() => {
    if (!plazo) return null;
    const min = cotizar(FIN_CONFIG.montoMin, plazo).pagoQuincenal;
    const maxPorMonto = cotizar(FIN_CONFIG.montoMax, plazo).pagoQuincenal;
    return { min, max: Math.min(maxPorMonto, capacidad) };
  }, [plazo, capacidad]);
  const pagoPct =
    r && pagoRango && pagoRango.max > pagoRango.min
      ? Math.round(((r.pagoQuincenal - pagoRango.min) / (pagoRango.max - pagoRango.min)) * 100)
      : 0;

  const ajustarPorPago = (targetPago) => {
    const nuevoMonto = montoMaximoPorPago(targetPago, plazo);
    setMonto(nuevoMonto);
    track('field_change', { campo: 'cotizador_pago_quincenal', valor: targetPago });
  };

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
    // No es frontera de grupo de prueba (va junto con informacion_solicitud
    // en el grupo 2): sigue derecho, sin SEQ.
    track('bloque_completo', {
      bloque: 'seleccionar_oferta',
      origen,
      monto: m,
      nQuincenas: n,
      pagoQuincenal: resumen.pagoQuincenal,
      totalPagar: resumen.totalPagar,
      catPct: Number((resumen.cat * 100).toFixed(2)),
    });
    navigate('/informacion', { replace: true });
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Seleccionar oferta" right={<CerrarSolicitud />} />
      <Content>
        <div className="segmented" style={{ marginBottom: 16 }}>
          <button
            className={tab === 'ofertas' ? 'active' : ''}
            onClick={() => {
              setTab('ofertas');
              track('click', { target: 'tab_ofertas' });
            }}
          >
            Ofertas
          </button>
          <button
            className={tab === 'cotizador' ? 'active' : ''}
            onClick={() => {
              setTab('cotizador');
              track('click', { target: 'tab_cotizador' });
            }}
          >
            Cotizador
          </button>
        </div>

        {tab === 'cotizador' ? (
          <>
            <h1>Configura la oferta para {nombre}</h1>

            <div className="slider-block">
              <div className="cap">Lo que recibira en su cuenta</div>
              <MontoInput
                value={monto}
                min={FIN_CONFIG.montoMin}
                max={FIN_CONFIG.montoMax}
                onChange={ajustarPorMonto}
                trackName="cotizador_monto_input"
              />
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
                  ajustarPorMonto(v);
                  track('field_change', { campo: 'cotizador_monto', valor: v });
                }}
              />
              <div className="range-ends">
                <span>{mxn(FIN_CONFIG.montoMin)}</span>
                <span>{mxn(FIN_CONFIG.montoMax)}</span>
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

            <div className="slider-block" style={{ marginTop: 16 }}>
              <div className="cap">Pago quincenal que realizara</div>
              {r && pagoRango ? (
                <MontoInput
                  value={r.pagoQuincenal}
                  min={Math.floor(pagoRango.min)}
                  max={Math.max(Math.ceil(pagoRango.max), Math.floor(pagoRango.min) + 1)}
                  onChange={ajustarPorPago}
                />
              ) : (
                <div className="big">—</div>
              )}
              {r && pagoRango ? (
                <input
                  type="range"
                  className={`capacity-slider${excede ? ' over' : ''}`}
                  min={Math.floor(pagoRango.min)}
                  max={Math.max(Math.ceil(pagoRango.max), Math.floor(pagoRango.min) + 1)}
                  step={25}
                  value={Math.round(r.pagoQuincenal)}
                  style={{
                    background: `linear-gradient(to right, ${
                      excede ? 'var(--danger)' : 'var(--ok)'
                    } 0 ${pagoPct}%, var(--line) ${pagoPct}% 100%)`,
                  }}
                  onChange={(e) => ajustarPorPago(Number(e.target.value))}
                />
              ) : (
                <div className="capacity-meter">
                  <div className="bar">
                    <i style={{ width: '0%' }} />
                  </div>
                </div>
              )}
              <div className="range-ends">
                <span>{r ? `${usoPct}% de la capacidad` : 'Elige el numero de quincenas'}</span>
                <span>Capacidad de pago {mxn(capacidad)}</span>
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
                const sel = ofertaSelActual === o.id;
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
            disabled={!ofertaSelActual}
            onClick={() => {
              const o = ofertas.find((x) => x.id === ofertaSelActual);
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
