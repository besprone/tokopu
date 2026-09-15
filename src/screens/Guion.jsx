import React from 'react';
import { Screen, MetaBar, Content } from '../components/ui.jsx';
import {
  GRUPOS_PRUEBA,
  SEQ_PREGUNTA,
  SEQ_MIN_LABEL,
  SEQ_MAX_LABEL,
  SUS_ITEMS,
  SUS_ESCALA,
} from '../flow.js';

// Guion del facilitador para sesiones EN PISO (moderadas): todo lo que hay
// que decir/observar, de principio a fin, en un solo lugar. Se arma desde
// GRUPOS_PRUEBA (la misma fuente que usa el panel de Instrucciones) para que
// nunca se desactualice si cambia el contenido de las tareas. Sin login: se
// necesita acceso rapido desde el celular del moderador mientras corre la
// prueba, a diferencia de /moderador (que sí revisa datos de participantes).
export default function Guion() {
  return (
    <Screen meta>
      <MetaBar label="Guion del facilitador" />
      <Content>
        <h1>Guion del facilitador</h1>
        <p className="lead">
          Para sesiones moderadas, de principio a fin. Dilo con tus palabras, no hace falta
          leerlo textual. Los recuadros "Qué observar" son solo para ti — no se los digas al
          participante.
        </p>

        <div className="card">
          <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Apertura
          </div>
          <p className="small" style={{ margin: '4px 0 0' }}>
            Gracias por tu tiempo. Vas a levantar una solicitud de crédito por descuento vía
            nómina, de principio a fin, como lo harías con un cliente real.
            <br />
            <br />
            Evaluamos la app, no a ti — no hay respuestas correctas ni incorrectas; si algo se
            traba o confunde, eso es justo lo que nos sirve.
            <br />
            <br />
            Trabaja como lo harías normalmente y piensa en voz alta: dime qué buscas, qué
            esperas que pase y qué te confunde. Yo te voy a ir haciendo algunas preguntas
            mientras avanzas.
          </p>
        </div>

        {GRUPOS_PRUEBA.map((g) => (
          <div key={g.id} style={{ marginTop: 20 }}>
            <h2>
              Tarea {g.num} de {GRUPOS_PRUEBA.length} · {g.titulo}
            </h2>
            <div className="card">
              <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Diles
              </div>
              <p className="small" style={{ margin: '4px 0 0', whiteSpace: 'pre-line' }}>
                {g.escenario}
              </p>
            </div>
            <div className="card" style={{ marginTop: 10 }}>
              <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Qué observar (no leer)
              </div>
              <ul className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {g.observar.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
            <div className="card" style={{ marginTop: 10 }}>
              <div className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '.04em' }}>
                Éxito esperado
              </div>
              <p className="small" style={{ margin: '4px 0 0' }}>{g.exito}</p>
            </div>
            <div className="callout warn" style={{ marginTop: 10, flexDirection: 'column' }}>
              <strong className="small">No se te olvide: pregúntale el SEQ</strong>
              <p className="small" style={{ margin: '2px 0 0' }}>{SEQ_PREGUNTA}</p>
              <p className="tiny" style={{ margin: '2px 0 0' }}>
                1 · {SEQ_MIN_LABEL} — 7 · {SEQ_MAX_LABEL}
              </p>
            </div>
          </div>
        ))}

        <h2 style={{ marginTop: 20 }}>Cierre</h2>
        <div className="card">
          <p className="small" style={{ margin: 0 }}>
            La prueba terminó. Cuéntame en general qué tal te pareció usar la app — qué se
            sintió fácil, qué se sintió confuso, y si hay algo que cambiarías.
          </p>
        </div>

        <div className="callout warn" style={{ marginTop: 10, marginBottom: 24, flexDirection: 'column' }}>
          <strong className="small">No se te olvide: el cuestionario SUS completo</strong>
          <p className="tiny" style={{ margin: '4px 0 8px' }}>
            Léele las 10 afirmaciones y anota su respuesta en cada una (escala 1-5: 1 ·{' '}
            {SUS_ESCALA[0]}, 5 · {SUS_ESCALA[4]}).
          </p>
          <ol className="small" style={{ margin: 0, paddingLeft: 18 }}>
            {SUS_ITEMS.map((item, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {item}
              </li>
            ))}
          </ol>
        </div>
      </Content>
    </Screen>
  );
}
