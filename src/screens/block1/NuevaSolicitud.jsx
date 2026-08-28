import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar } from '../../components/ui.jsx';
import Field from '../../components/Field.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore, tareaCompletada } from '../../state/store.jsx';
import { DEPENDENCIAS, CONVENIOS } from '../../domain/catalogs.js';
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

  const puede = dep && conv && firma;

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
      <TopBar onClose={() => navigate('/inicio')} />
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
          onChange={setDep}
          options={DEPENDENCIAS}
          validate={req}
        />
        <Field
          name="convenio"
          label="Convenio"
          value={conv}
          onChange={setConv}
          options={CONVENIOS}
          validate={req}
        />

        <div className="field">
          <label>Tipo de firma</label>
          <div className="segmented">
            <button
              className={firma === 'autografa' ? 'active' : ''}
              onClick={() => {
                setFirma('autografa');
                track('field_change', { campo: 'tipoFirma', valor: 'autografa' });
              }}
            >
              Firma autografa
            </button>
            <button
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
