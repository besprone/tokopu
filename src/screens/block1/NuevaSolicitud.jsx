import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, tareaCompletada } from '../../state/store.jsx';
import { DEPENDENCIAS, tieneFirmaDisponible, firmaInicial } from '../../domain/catalogs.js';
import { req } from '../../domain/validators.js';

export default function NuevaSolicitud() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();
  const [dep, setDep] = useState(solicitud.dependencia || '');
  const [conv, setConv] = useState(solicitud.convenio || '');
  const [firma, setFirma] = useState(solicitud.tipoFirma || 'autografa');

  // Tarea 1 ya completada: no se puede volver a levantar la solicitud.
  if (tareaCompletada(solicitud, 'iniciar_solicitud')) {
    return <Navigate to="/solicitud" replace />;
  }

  const dependenciaElegida = DEPENDENCIAS.find((d) => d.nombre === dep);
  const convenioElegido = dependenciaElegida?.convenios.find((c) => c.nombre === conv);

  // Los convenios sin ninguna firma disponible se listan, pero deshabilitados.
  const opcionesConvenio =
    dependenciaElegida?.convenios.map((c) => ({
      nombre: c.nombre,
      disabled: !tieneFirmaDisponible(c),
    })) ?? [];

  const elegirDependencia = (valor) => {
    const d = DEPENDENCIAS.find((x) => x.nombre === valor);
    // Con un solo convenio no hay nada que elegir: se preselecciona aunque no
    // tenga firma disponible, para que el callejon sin salida se vea en vez
    // de dejar el campo vacio sin explicar por que no avanza.
    const unico = d?.convenios.length === 1 ? d.convenios[0] : undefined;
    setDep(valor);
    setConv(unico?.nombre ?? '');
    setFirma(unico ? firmaInicial(unico) : '');
    track('field_change', { campo: 'dependencia', valor });
  };

  const elegirConvenio = (valor) => {
    const c = dependenciaElegida?.convenios.find((x) => x.nombre === valor);
    setConv(valor);
    if (!c) {
      setFirma('');
      return;
    }
    // Si lo que ya venia marcado sigue siendo valido, se respeta.
    const sigueValiendo =
      (firma === 'autografa' && c.firmaAutografa) || (firma === 'digital' && c.firmaDigital);
    setFirma(sigueValiendo ? firma : firmaInicial(c));
    track('field_change', { campo: 'convenio', valor });
  };

  /**
   * Solo se bloquea el segmentado cuando YA hay convenio y ese convenio
   * admite una sola firma: ahi no hay nada que elegir. Mientras no hay
   * convenio el campo se ve normal, con la propuesta marcada.
   */
  const firmaDeterminada =
    convenioElegido != null && !(convenioElegido.firmaAutografa && convenioElegido.firmaDigital);

  const puede = convenioElegido != null && firma !== '';

  const comenzar = () => {
    patch({ iniciada: true, dependencia: dep, convenio: conv, tipoFirma: firma, creadaISO: new Date().toISOString() });
    track('task_complete', {
      tarea: 'iniciar_solicitud',
      resultado: 'exito',
      dependencia: dep,
      convenio: conv,
      tipoFirma: firma,
    });
    navigate('/seq/iniciar_solicitud', { replace: true });
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar onClose={false} />
      <Content>
        <h1>Iniciemos la solicitud</h1>
        <p className="lead">
          Para comenzar la solicitud debes seleccionar en que dependencia y convenio se
          encuentra registrado el cliente.
        </p>

        <Field
          name="dependencia"
          label="Dependencia"
          value={dep}
          onChange={elegirDependencia}
          options={DEPENDENCIAS}
          validate={req}
        />
        <Field
          name="convenio"
          label="Convenio"
          value={conv}
          onChange={elegirConvenio}
          options={opcionesConvenio}
          disabled={!dependenciaElegida}
          validate={req}
        />

        <div className="field">
          <label>Tipo de firma</label>
          <div className="segmented">
            <button
              disabled={firmaDeterminada}
              className={firma === 'autografa' ? 'active' : ''}
              onClick={() => {
                setFirma('autografa');
                track('field_change', { campo: 'tipoFirma', valor: 'autografa' });
              }}
            >
              Firma autografa
            </button>
            <button
              disabled={firmaDeterminada}
              className={firma === 'digital' ? 'active' : ''}
              onClick={() => {
                setFirma('digital');
                track('field_change', { campo: 'tipoFirma', valor: 'digital' });
              }}
            >
              Firma digital
            </button>
          </div>
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" disabled={!puede} onClick={comenzar} track="comenzar_solicitud">
          Comenzar solicitud →
        </Button>
      </FooterActions>
    </Screen>
  );
}
