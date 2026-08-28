import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, MetaBar, Content, FooterActions, Button } from '../../components/ui.jsx';
import { loginMod, haySesionMod } from '../../moderador/api.js';

export default function ModLogin() {
  const navigate = useNavigate();
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (haySesionMod()) navigate('/moderador/sesiones', { replace: true });
  }, []); // eslint-disable-line

  const entrar = async () => {
    if (!pw || cargando) return;
    setCargando(true);
    setError('');
    try {
      await loginMod(pw);
      navigate('/moderador/sesiones', { replace: true });
    } catch (e) {
      if (String(e.message) === 'clave') setError('Clave incorrecta.');
      else setError('No se pudo contactar el backend. Puedes ver los datos locales de este navegador.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Screen meta>
      <MetaBar label="Area de moderador" />
      <Content>
        <span className="tiny">Acceso restringido</span>
        <h1>Sesiones de prueba</h1>
        <p className="lead">Ingresa la clave de moderador para ver y descargar los datos.</p>

        <div className="field">
          <label htmlFor="modpw">Clave de moderador</label>
          <input
            id="modpw"
            type="password"
            value={pw}
            autoComplete="off"
            onChange={(e) => setPw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && entrar()}
            placeholder="••••••••"
          />
          {error && <div className="err">{error}</div>}
        </div>
      </Content>
      <FooterActions>
        <Button variant="primary" disabled={!pw || cargando} onClick={entrar}>
          {cargando ? 'Verificando…' : 'Entrar'}
        </Button>
        {error.startsWith('No se pudo') && (
          <Button variant="ghost" onClick={() => navigate('/moderador/sesiones')}>
            Ver datos locales
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate('/')}>
          ← Volver
        </Button>
      </FooterActions>
    </Screen>
  );
}
