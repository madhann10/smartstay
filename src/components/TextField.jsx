import { useId } from 'react';

export default function TextField({
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  error,
  placeholder,
}) {
  const id = useId();

  return (
    <div className="field">
      <label htmlFor={id} className="field__label">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className={'field__input' + (error ? ' field__input--error' : '')}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? id + '-error' : undefined}
      />
      {error ? (
        <p id={id + '-error'} className="field__error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
