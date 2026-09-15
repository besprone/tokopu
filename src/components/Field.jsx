import React, { useEffect, useRef, useState } from 'react';
import { useMetrics } from '../metrics/MetricsProvider.jsx';

// Campo instrumentado: emite field_change, field_error y field_corrected.
// track.js se encarga de redactar valores sensibles (CURP, RFC, CLABE, etc.).
export default function Field({
  name,
  label,
  value = '',
  onChange,
  validate,
  tab,
  type = 'text',
  options,
  hint,
  prefilled = false,
  placeholder,
  inputMode,
  maxLength,
  disabled = false,
  required = true,
  forceValidateSignal = 0,
}) {
  const { track } = useMetrics();
  const [error, setError] = useState(null);
  const [touched, setTouched] = useState(false);
  const hadError = useRef(false);
  const changeCount = useRef(0);

  const runValidate = (v) => (validate ? validate(v) : null);

  useEffect(() => {
    if (forceValidateSignal > 0) {
      setTouched(true);
      const err = runValidate(value);
      setError(err);
      if (err && !hadError.current) {
        hadError.current = true;
        track('field_error', { campo: name, tab, regla: err });
      }
    }
  }, [forceValidateSignal]); // eslint-disable-line

  // Si el valor cambia desde afuera (autollenado por escaneo, datos que
  // llegan de otra pantalla, etc.) el campo no pasa por handleChange: sin
  // esto el error quedaria pegado aunque el valor ya sea valido.
  useEffect(() => {
    if (!touched) return;
    const err = runValidate(value);
    setError(err);
    if (err && !hadError.current) {
      hadError.current = true;
      track('field_error', { campo: name, tab, regla: err });
    } else if (!err && hadError.current) {
      hadError.current = false;
      track('field_corrected', { campo: name, tab });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (raw) => {
    changeCount.current += 1;
    onChange?.(raw);
    track('field_change', {
      campo: name,
      tab,
      valor: raw,
      nCambio: changeCount.current,
    });
    // La revalidacion mientras esta tocado la hace el efecto de [value]
    // arriba, una vez que el valor nuevo llega por props.
  };

  const handleBlur = () => {
    setTouched(true);
    const err = runValidate(value);
    setError(err);
    if (err) {
      hadError.current = true;
      track('field_error', { campo: name, tab, regla: err });
    } else if (hadError.current) {
      hadError.current = false;
      track('field_corrected', { campo: name, tab });
    }
  };

  const cls = `field${error ? ' invalid' : ''}${prefilled ? ' prefilled' : ''}`;
  const common = {
    id: name,
    name,
    value: value ?? '',
    disabled,
    placeholder,
    onChange: (e) => handleChange(e.target.value),
    onBlur: handleBlur,
    'aria-invalid': !!error,
  };

  return (
    <div className={cls}>
      {label && (
        <label htmlFor={name}>
          {label}
          {!required && <span className="muted"> (opcional)</span>}
        </label>
      )}
      {options ? (
        <select {...common}>
          <option value="">Selecciona…</option>
          {options.map((o) => {
            const val = typeof o === 'string' ? o : o.value ?? o.id ?? o.nombre;
            const lab = typeof o === 'string' ? o : o.nombre ?? o.label ?? val;
            return (
              <option key={val} value={val} disabled={!!o?.disabled}>
                {lab}
              </option>
            );
          })}
        </select>
      ) : type === 'textarea' ? (
        <textarea rows={3} {...common} />
      ) : (
        <input type={type} inputMode={inputMode} maxLength={maxLength} {...common} />
      )}
      {error ? (
        <div className="err">{error}</div>
      ) : hint ? (
        <div className="hint">{hint}</div>
      ) : null}
    </div>
  );
}
