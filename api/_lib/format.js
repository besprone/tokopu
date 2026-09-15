// Formateadores para exportar sesiones (servidor).

const TAREA_TITULOS = {
  g1_iniciar_autenticar: 'Iniciar la solicitud y autenticar al cliente',
  g2_cotizar_info: 'Cotizar la oferta y capturar la informacion',
  g3_documentos_cierre: 'Adjuntar documentos y cerrar la solicitud',
};

export function sesionMarkdown(s) {
  const m = s.meta || {};
  const sus = s.sus || {};
  const t = s.tareas || {};
  const L = [];
  L.push(`# Sesion de prueba — ${m.participante || 'sin nombre'}`);
  L.push('');
  L.push(`- **ID:** ${m.sessionId || '—'}`);
  L.push(`- **Inicio:** ${m.startedAtISO || '—'}`);
  L.push(`- **Fin:** ${s.finISO || '—'}`);
  L.push(`- **Completa:** ${s.completa ? 'si' : 'no (parcial)'}`);
  L.push(`- **Eventos:** ${(s.eventos || []).length}`);
  L.push(`- **User agent:** ${m.userAgent || '—'}`);
  L.push('');
  L.push('## SUS');
  L.push(sus.completo ? `**${sus.puntaje} / 100** — ${sus.interpretacion}` : 'Incompleto');
  L.push('');
  L.push('## SEQ y tiempos por tarea');
  L.push('');
  L.push('| Tarea | Resultado | Duracion | SEQ (1-7) | Errores |');
  L.push('|---|---|---|---|---|');
  for (const [id, d] of Object.entries(t)) {
    const dur = d.duracionMs != null ? `${(d.duracionMs / 1000).toFixed(1)} s` : '—';
    L.push(
      `| ${TAREA_TITULOS[id] || id} | ${d.resultado || 'en curso'} | ${dur} | ${
        d.seq != null ? d.seq : '—'
      } | ${d.errores || 0} |`
    );
  }
  L.push('');
  const sol = s.solicitud || {};
  if (sol.oferta) {
    L.push('## Oferta seleccionada');
    L.push(
      `- Monto: ${sol.oferta.monto} · Quincenas: ${sol.oferta.nQuincenas} · Origen: ${sol.oferta.origen || '—'}`
    );
    if (sol.oferta.resumen) {
      L.push(
        `- Pago quincenal: ${sol.oferta.resumen.pagoQuincenal} · Total: ${sol.oferta.resumen.totalPagar} · CAT: ${(
          (sol.oferta.resumen.cat || 0) * 100
        ).toFixed(1)}%`
      );
    }
    L.push('');
  }
  L.push('## Conteo de eventos');
  for (const [k, v] of Object.entries((s.resumen && s.resumen.porTipo) || {})) {
    L.push(`- ${k}: ${v}`);
  }
  L.push('');
  const flags = (s.eventos || []).filter((e) => e.evento === 'observer_flag');
  if (flags.length) {
    L.push('## Marcas del observador');
    for (const f of flags) L.push(`- [${f.tsISO}] ${f.nota || ''}`);
    L.push('');
  }
  return L.join('\n');
}

const CSV_COLS = [
  'sessionId',
  'participante',
  'seq',
  'tsISO',
  'tRelMs',
  'evento',
  'tarea',
  'resultado',
  'campo',
  'tab',
  'valor',
  'valor_len',
  'valido',
  'regla',
  'target',
  'from',
  'to',
  'item',
  'score',
  'nota',
  'extra',
];

function esc(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function sesionesCSV(sesiones) {
  const lines = [CSV_COLS.join(',')];
  for (const s of sesiones || []) {
    const sid = s.meta?.sessionId || '';
    const part = s.meta?.participante || '';
    for (const e of s.eventos || []) {
      const known = new Set(CSV_COLS);
      const extra = {};
      for (const [k, v] of Object.entries(e)) if (!known.has(k)) extra[k] = v;
      const row = CSV_COLS.map((c) => {
        if (c === 'sessionId') return esc(sid);
        if (c === 'participante') return esc(part);
        if (c === 'extra') return esc(Object.keys(extra).length ? JSON.stringify(extra) : '');
        return esc(e[c]);
      });
      lines.push(row.join(','));
    }
  }
  return lines.join('\n');
}
