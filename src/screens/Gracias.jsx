import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button } from '../components/ui.jsx';

export default function Gracias() {
  const navigate = useNavigate();
  return (
    <Screen meta>
      <MetaBar label="Prueba de usabilidad" />
      <Content>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
          <div style={{ flex: 1 }}>
            <span className="tiny">Listo</span>
            <h1>Gracias por participar</h1>
            <p className="lead">
              La prueba termino. Tus respuestas y tu recorrido quedaron registrados para el
              analisis del equipo de UX.
            </p>
          </div>
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" onClick={() => navigate('/')} track="gracias_volver">
          Regresar al inicio
        </Button>
      </FooterActions>
    </Screen>
  );
}
