import { type InputHTMLAttributes, useId, useMemo, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = ({ label, error, hint, className, id, ...props }: PasswordInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;
  const inputType = useMemo(() => (showPassword ? 'text' : 'password'), [showPassword]);

  return (
    <div className="ui-field">
      <label htmlFor={inputId} className="field-label">
        {label}
      </label>
      <div className="ui-password-wrap">
        <input
          id={inputId}
          type={inputType}
          aria-invalid={!!error}
          className={['ui-input', error ? 'is-error' : '', className || ''].filter(Boolean).join(' ')}
          style={{ paddingRight: '2.2rem' }}
          {...props}
        />
        <button
          type="button"
          className="ui-password-toggle"
          onClick={() => setShowPassword((current) => !current)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {!error && hint ? <span className="ui-field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
};
