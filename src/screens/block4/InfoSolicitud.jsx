import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar, CerrarSolicitud } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import CapturaDocumento from '../../components/CapturaDocumento.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, TABS_INFO } from '../../state/store.jsx';
import * as V from '../../domain/validators.js';
import {
  ESTADOS_MX,
  GENEROS,
  ESTADO_CIVIL,
  ORIGEN_RECURSOS,
  DESTINO_RECURSOS,
  BANCOS,
  TALON_MOCK,
  CUENTA_MOCK,
} from '../../domain/catalogs.js';

const OPCIONAL = { required: false };

// Tabs que permiten adjuntar un documento para autollenar sus campos, con el
// mismo componente de captura (CapturaDocumento) que usan los bloques 2 y 5.
const ESCANEO_TAB = {
  laborales: {
    doc: 'talon-1',
    label: 'Talon de pagos',
    titulo: 'Capturar del recibo de nomina',
    subtitulo: 'Por favor, captura el recibo de nomina del cliente.',
    campos: {
      numSegSocial: TALON_MOCK.numSegSocial,
      entidadFederativa: TALON_MOCK.entidadFederativa,
      centroTrabajo: TALON_MOCK.centroTrabajo,
      puesto: TALON_MOCK.puesto,
      fechaIngreso: TALON_MOCK.fechaIngreso,
    },
    // El talon tambien trae el sueldo -> autollena el tab de ingresos.
    camposExtra: {
      ingresos: {
        ingresoMensualComprobable: TALON_MOCK.ingresoMensualComprobable,
        rangoIngreso: TALON_MOCK.rangoIngreso,
      },
    },
  },
  bancarios: {
    doc: 'edo-cuenta',
    label: 'Estado de cuenta',
    titulo: 'Capturar el estado de cuenta',
    subtitulo: 'Por favor, captura la caratula del estado de cuenta del cliente.',
    campos: {
      banco: CUENTA_MOCK.banco,
      cuentaClabe: CUENTA_MOCK.cuentaClabe,
    },
  },
};

const TAB_LABEL = {
  personales: 'Personales',
  laborales: 'Laborales',
  contacto: 'Contacto',
  ingresos: 'Ingresos',
  bancarios: 'Bancarios',
};

const TAB_DEFS = {
  personales: {
    titulo: 'Datos personales',
    ocr: ['curp', 'rfc', 'nombre', 'segundoNombre', 'apellidoPaterno', 'apellidoMaterno', 'fechaNacimiento', 'paisNacimiento', 'nacionalidad', 'genero', 'estadoCivil'],
    campos: [
      { name: 'curp', label: 'CURP', validate: V.curp, mono: true, maxLength: 18 },
      { name: 'rfc', label: 'RFC', validate: V.rfc, mono: true, maxLength: 13 },
      { name: 'nombre', label: 'Nombre', validate: V.soloLetras },
      { name: 'segundoNombre', label: 'Segundo nombre', validate: () => null, ...OPCIONAL },
      { name: 'apellidoPaterno', label: 'Apellido paterno', validate: V.soloLetras },
      { name: 'apellidoMaterno', label: 'Apellido materno', validate: V.soloLetras },
      { name: 'fechaNacimiento', label: 'Fecha de nacimiento', type: 'date', validate: V.fechaNacimiento },
      { name: 'genero', label: 'Genero', options: GENEROS, validate: V.req },
      { name: 'estadoCivil', label: 'Estado civil', options: ESTADO_CIVIL, validate: V.req },
      { name: 'paisNacimiento', label: 'Pais de nacimiento', validate: V.req },
      { name: 'nacionalidad', label: 'Nacionalidad', validate: V.req },
    ],
  },
  laborales: {
    titulo: 'Datos laborales',
    ocr: ['numSegSocial', 'entidadFederativa', 'centroTrabajo', 'puesto', 'fechaIngreso'],
    campos: [
      { name: 'numSegSocial', label: 'Numero de seguridad social', validate: V.nss, inputMode: 'numeric', maxLength: 11 },
      { name: 'entidadFederativa', label: 'Entidad federativa', options: ESTADOS_MX, validate: V.req },
      { name: 'centroTrabajo', label: 'Centro de trabajo', validate: V.req },
      { name: 'puesto', label: 'Puesto', validate: V.req },
      { name: 'fechaIngreso', label: 'Fecha de ingreso laboral', type: 'date', validate: V.fechaPasada },
    ],
  },
  contacto: {
    titulo: 'Datos de contacto',
    subtitulo:
      'En caso de que necesitemos contactar al cliente. El celular ya quedo validado en la autenticacion.',
    ocr: [],
    campos: [
      { name: 'telefonoCelular', label: 'Telefono celular', validate: V.telefono, type: 'tel', inputMode: 'numeric', maxLength: 10, disabled: true },
      { name: 'telefonoDomicilio', label: 'Telefono de domicilio', validate: V.telefonoOpcional, type: 'tel', inputMode: 'numeric', maxLength: 10, ...OPCIONAL },
      { name: 'telefonoOficina', label: 'Telefono de oficina', validate: V.telefonoOpcional, type: 'tel', inputMode: 'numeric', maxLength: 10, ...OPCIONAL },
    ],
  },
  ingresos: {
    titulo: 'Origen y destino de ingresos',
    ocr: ['ingresoMensualComprobable'],
    campos: [
      { name: 'ingresoMensualComprobable', label: 'Ingreso mensual comprobable (MXN)', type: 'number', inputMode: 'numeric', validate: (v) => V.entero(v, { min: 3000, max: 200000 }), lockIfFilled: true, hint: 'Proviene del talon de pagos. Define la capacidad de pago del cotizador.' },
      { name: 'origenRecursos', label: 'Origen de los recursos', options: ORIGEN_RECURSOS, validate: V.req },
      { name: 'destinoRecursos', label: 'Destino de los recursos', options: DESTINO_RECURSOS, validate: V.req },
      { name: 'liquidacionAnticipada', label: 'Tiene planeada la liquidacion anticipada', options: ['No', 'Si'], validate: V.req },
    ],
  },
  bancarios: {
    titulo: 'Datos bancarios',
    ocr: [],
    campos: [
      { name: 'banco', label: 'Banco', options: BANCOS, validate: V.req },
      { name: 'cuentaClabe', label: 'Cuenta CLABE', validate: V.clabe, mono: true, inputMode: 'numeric', maxLength: 18, hint: '18 digitos. Debe coincidir con los datos en la dependencia.' },
    ],
  },
};

export default function InfoSolicitud() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, setTabData, markTab, toggleDoc } = useStore();
  const [sp] = useSearchParams();
  const [tab, setTab] = useState(() => {
    const q = sp.get('tab');
    if (q && TABS_INFO.includes(q)) return q;
    return TABS_INFO.find((t) => !solicitud.tabsCompletadas[t]) || 'personales';
  });
  // Se llego aqui desde un "Editar" en Confirma los datos (unico lugar que
  // manda ?tab=): en vez del Atras/Continuar secuencial, el pie muestra un
  // atajo directo de vuelta a Confirmar. Se fija una sola vez al montar -no
  // se recalcula- para que se mantenga aunque el asesor cambie de grupo con
  // los chips.
  const [vengoDeConfirmar] = useState(() => !!sp.get('tab'));
  // Grupos por los que el asesor ya paso (se marcan al SALIR, no al entrar):
  // el grupo en el que estas parado nunca se marca "visitado" por si mismo,
  // solo los que ya dejaste atras.
  const [visitados, setVisitados] = useState(() => new Set());
  // Si el grupo ACTUAL ya se habia visitado antes, se fuerza la validacion de
  // sus campos para que se vea lo que falta (en la primera visita se deja
  // limpio). Se deriva de `visitados` en cada render -no es un contador
  // global- para que un grupo nunca visitado nunca herede el forzado de otro.
  const forceValidate = visitados.has(tab) ? 1 : 0;
  // Al cambiar de grupo, el chip activo se desplaza a la vista dentro de su
  // carril horizontal (si esta fuera por el scroll).
  const activeChipRef = useRef(null);
  useEffect(() => {
    activeChipRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [tab]);

  const def = TAB_DEFS[tab];
  const valores = solicitud.datos[tab] || {};
  const idxTab = TABS_INFO.indexOf(tab);

  // Validez de cualquier grupo (no solo el actual): navegacion libre entre
  // chips; solo se puede "Revisar datos" cuando los 5 estan completos.
  const grupoValido = (t) => {
    const d = TAB_DEFS[t];
    const vals = solicitud.datos[t] || {};
    return d.campos.every((c) => {
      if (c.required === false && (vals[c.name] == null || vals[c.name] === '')) return true;
      return !(c.validate ? c.validate(vals[c.name]) : null);
    });
  };
  const validez = TABS_INFO.map(grupoValido);
  const nValidos = validez.filter(Boolean).length;
  const todoValido = nValidos === TABS_INFO.length;
  const gruposFaltantes = TABS_INFO.filter((t, i) => !validez[i]);

  // Escaneo de documento del tab actual (talon de pagos / estado de cuenta).
  const escaneoCfg = ESCANEO_TAB[tab] || null;
  const escaneado = escaneoCfg ? !!solicitud.documentos[escaneoCfg.doc] : false;
  const camposEscaneo = escaneoCfg ? Object.keys(escaneoCfg.campos) : [];

  useEffect(() => {
    // El celular de contacto viene de la autenticacion (bloque 2) y va bloqueado.
    if (
      tab === 'contacto' &&
      solicitud.auth.celular &&
      solicitud.datos.contacto.telefonoCelular !== solicitud.auth.celular
    ) {
      setTabData('contacto', { telefonoCelular: solicitud.auth.celular });
    }
    // Al SALIR de este grupo queda "visitado": su chip puede avisar (warning)
    // si falta algo, aunque el asesor no vuelva a entrar.
    return () => {
      setVisitados((prev) => (prev.has(tab) ? prev : new Set(prev).add(tab)));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const aceptarEscaneo = (file) => {
    setTabData(tab, { ...escaneoCfg.campos });
    // Un documento puede autollenar campos de otros tabs (el talon trae el sueldo).
    for (const [t, vals] of Object.entries(escaneoCfg.camposExtra || {})) {
      setTabData(t, vals);
    }
    toggleDoc(escaneoCfg.doc, {
      nombre: file?.name || 'Cargado en la captura de la solicitud',
      tamKB: file ? Math.max(1, Math.round(file.size / 1024)) : 0,
      tipo: file?.type || 'desconocido',
    });
    track('click', { target: `info_${tab}_escaneo_aceptado`, doc: escaneoCfg.doc });
  };

  // Mantiene tabsCompletadas = validez de cada grupo (para el progreso del hub).
  useEffect(() => {
    TABS_INFO.forEach((t) => {
      const v = grupoValido(t);
      if (!!solicitud.tabsCompletadas[t] !== v) markTab(t, v);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitud.datos]);

  const irAGrupo = (t) => {
    setTab(t);
    track('click', { target: `info_grupo_${t}` });
  };

  const irRelativo = (delta) => {
    const t = TABS_INFO[idxTab + delta];
    if (t) irAGrupo(t);
  };

  const revisar = () => {
    if (!todoValido) return;
    TABS_INFO.forEach((t) => markTab(t, true));
    track('click', { target: 'info_revisar_datos_ok' });
    navigate('/informacion/confirmar');
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Solicitud de credito" right={<CerrarSolicitud />} />
      <Content>
        <div className="tab-chips" role="tablist" aria-label="Grupos de datos">
          {TABS_INFO.map((t, i) => {
            const activo = t === tab;
            const ok = validez[i];
            const cls = ['tab-chip'];
            if (ok) cls.push('ok');
            if (activo) cls.push('active');
            return (
              <button
                key={t}
                ref={activo ? activeChipRef : null}
                type="button"
                role="tab"
                aria-selected={activo}
                className={cls.join(' ')}
                onClick={() => irAGrupo(t)}
              >
                {TAB_LABEL[t]}
                {ok && (
                  <span className="chip-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span className="tiny">
          {nValidos} de {TABS_INFO.length} grupos completos · llénalos en el orden que quieras
        </span>
        <h1 style={{ marginTop: 2 }}>{def.titulo}</h1>
        {def.subtitulo && <p className="lead">{def.subtitulo}</p>}
        {((escaneoCfg && escaneado) ||
          (!escaneoCfg && solicitud.auth.ocrAplicado && def.ocr.length > 0) ||
          def.campos.some((c) => c.lockIfFilled && valores[c.name])) && (
          <p className="tiny" style={{ marginBottom: 12 }}>
            Los campos resaltados se autollenaron con un documento escaneado. Verifica y
            corrige si es necesario.
          </p>
        )}

        {escaneoCfg && (
          <>
            <div className="sec-label" style={{ marginTop: 4 }}>
              Escaneo
            </div>
            <CapturaDocumento
              titulo={escaneoCfg.titulo}
              subtitulo={escaneoCfg.subtitulo}
              onAceptar={aceptarEscaneo}
              trigger={(abrir) => (
                <button
                  type="button"
                  className={`scan-ine${escaneado ? ' done' : ''}`}
                  onClick={() => {
                    track('click', { target: `info_${tab}_escanear` });
                    abrir();
                  }}
                >
                  <span>{escaneado ? `${escaneoCfg.label} escaneado` : escaneoCfg.label}</span>
                  <span className="scan-ico" aria-hidden="true">
                    {escaneado ? '✓' : '↑'}
                  </span>
                </button>
              )}
            />
            {escaneado ? (
              <p className="tiny scan-hint">
                Ya fue agregado a la lista de documentos. Toca para volver a escanearlo si es
                necesario.
              </p>
            ) : (
              <p className="tiny scan-hint">
                Escanea el {escaneoCfg.label.toLowerCase()} para autollenar los campos, o
                capturalos a mano.
              </p>
            )}
            <div className="sec-label">{def.titulo}</div>
          </>
        )}

        {def.campos.map((c) => (
          <Field
            key={c.name}
            name={c.name}
            tab={tab}
            label={c.label}
            type={c.type}
            options={c.options}
            inputMode={c.inputMode}
            maxLength={c.maxLength}
            hint={c.hint}
            disabled={!!c.disabled || (!!c.lockIfFilled && !!valores[c.name])}
            required={c.required !== false}
            prefilled={
              !c.disabled &&
              !!valores[c.name] &&
              (!!c.lockIfFilled ||
                (solicitud.auth.ocrAplicado && def.ocr.includes(c.name)) ||
                (escaneado && camposEscaneo.includes(c.name)))
            }
            value={valores[c.name] ?? ''}
            validate={c.validate}
            forceValidateSignal={forceValidate}
            onChange={(v) => setTabData(tab, { [c.name]: v })}
          />
        ))}
      </Content>
      <FooterActions>
        {!todoValido && (
          <p className="tiny" style={{ margin: '0 0 6px', textAlign: 'center' }}>
            Faltan datos obligatorios en: {gruposFaltantes.map((t) => TAB_LABEL[t]).join(', ')}
          </p>
        )}
        {vengoDeConfirmar ? (
          // Edicion puntual desde "Confirma los datos": los chips siguen
          // libres por si hay que tocar otra seccion, pero el CTA regresa
          // derecho a confirmar en vez de obligar a recorrer los demas
          // grupos en orden.
          <Button
            variant="primary"
            disabled={!todoValido}
            onClick={() => navigate('/informacion/confirmar')}
            track="info_volver_confirmar"
          >
            Guardar y volver a confirmar →
          </Button>
        ) : (
          <div className="row">
            {idxTab > 0 && (
              <Button variant="ghost" className="grow" onClick={() => irRelativo(-1)} track="info_atras">
                ← Atrás
              </Button>
            )}
            {idxTab < TABS_INFO.length - 1 ? (
              <Button
                variant="primary"
                className="grow"
                onClick={() => irRelativo(1)}
                track="info_continuar_grupo"
              >
                Continuar →
              </Button>
            ) : todoValido ? (
              <Button
                variant="primary"
                className="grow"
                onClick={revisar}
                track="info_revisar_datos"
              >
                Revisar datos →
              </Button>
            ) : (
              <Button
                variant="primary"
                className="grow"
                onClick={() => irAGrupo(gruposFaltantes[0])}
                track="info_continuar_a_faltante"
              >
                Continuar →
              </Button>
            )}
          </div>
        )}
      </FooterActions>
    </Screen>
  );
}
