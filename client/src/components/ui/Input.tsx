import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, hint, className, id, ...props }) => {
  const inputId = id ?? props.name;

  return (
    <div className="ui-field">
      {label && (
        <label htmlFor={inputId} className="field-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        className={['ui-input', error ? 'is-error' : '', className || ''].filter(Boolean).join(' ')}
        {...props}
      />
      {!error && hint ? <span className="ui-field-hint">{hint}</span> : null}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
};
