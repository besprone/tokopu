import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, StatusBar, Content, FooterActions, Button, TopBar } from '../../components/ui.jsx';
import { useMetrics } from '../../metrics/MetricsProvider.jsx';
import { useStore } from '../../state/store.jsx';

const SECCIONES = [
  {
    tab: 'personales',
    titulo: 'Datos personales',
    filas: (d) => [
      ['Nombre', [d.nombre, d.segundoNombre, d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(' ')],
      ['CURP', d.curp],
      ['RFC', d.rfc],
      ['Fecha de nacimiento', d.fechaNacimiento],
      ['Genero', d.genero],
      ['Estado civil', d.estadoCivil],
      ['Pais de nacimiento', d.paisNacimiento],
      ['Nacionalidad', d.nacionalidad],
    ],
  },
  {
    tab: 'laborales',
    titulo: 'Datos laborales',
    filas: (d) => [
      ['NSS', d.numSegSocial],
      ['Entidad federativa', d.entidadFederativa],
      ['Centro de trabajo', d.centroTrabajo],
      ['Puesto', d.puesto],
      ['Fecha de ingreso', d.fechaIngreso],
    ],
  },
  {
    tab: 'contacto',
    titulo: 'Datos de contacto',
    filas: (d) => [
      ['Telefono celular', d.telefonoCelular],
      ['Telefono de domicilio', d.telefonoDomicilio || '—'],
      ['Telefono de oficina', d.telefonoOficina || '—'],
      ['Direccion', [d.calle, d.colonia, d.delegacion, d.estado, d.cp].filter(Boolean).join(', ')],
      ['Pais', d.pais],
    ],
  },
  {
    tab: 'ingresos',
    titulo: 'Origen y destino de los ingresos',
    filas: (d) => [
      ['Ingreso mensual comprobable', d.ingresoMensualComprobable ? `$${Number(d.ingresoMensualComprobable).toLocaleString('es-MX')}` : ''],
      ['Origen de los recursos', d.origenRecursos],
      ['Destino de los recursos', d.destinoRecursos],
      ['Liquidacion anticipada', d.liquidacionAnticipada],
    ],
  },
  {
    tab: 'bancarios',
    titulo: 'Datos bancarios',
    filas: (d) => [
      ['Banco', d.banco],
      ['Cuenta CLABE', d.cuentaClabe],
    ],
  },
];

export default function ConfirmaDatos() {
  const navigate = useNavigate();
  const { track } = useMetrics();
  const { solicitud, patch } = useStore();

  const confirmar = () => {
    patch({ datosConfirmados: true });
    track('task_complete', { tarea: 'informacion_solicitud', resultado: 'exito' });
    navigate('/seq/informacion_solicitud', { replace: true });
  };

  return (
    <Screen>
      <StatusBar />
      <TopBar title="Confirma los datos" onClose={() => navigate('/solicitud')} onBack={null} />
      <Content>
        <h1>Confirma los datos de la solicitud</h1>
        <p className="lead">
          Revisa toda la informacion antes de enviarla. Es importante para evitar rechazos y
          reingresos.
        </p>

        {SECCIONES.map((s) => {
          const d = solicitud.datos[s.tab] || {};
          return (
            <div className="card" key={s.tab} style={{ marginBottom: 12 }}>
              <div className="row between" style={{ marginBottom: 4 }}>
                <strong>{s.titulo}</strong>
                <button
                  className="btn link"
                  style={{ padding: 0 }}
                  onClick={() => {
                    track('click', { target: `editar_${s.tab}` });
                    navigate(`/informacion?tab=${s.tab}`);
                  }}
                >
                  Editar
                </button>
              </div>
              {s.filas(d).map(([k, v]) => (
                <div className="summary-row" key={k}>
                  <span className="k">{k}</span>
                  <span className="v">{v || <span className="muted">—</span>}</span>
                </div>
              ))}
            </div>
          );
        })}
      </Content>
      <FooterActions>
        <Button variant="primary" onClick={confirmar} track="confirmar_informacion">
          Confirmar informacion ✓
        </Button>
      </FooterActions>
    </Screen>
  );
}
