import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            {label && <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{label}</label>}
            <input
                style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: error ? '1px solid var(--color-error)' : '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    color: 'var(--color-text-main)',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'all 0.2s',
                    width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-highlight)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'var(--color-error)' : 'var(--glass-border)'}
                {...props}
            />
            {error && <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>{error}</span>}
        </div>
    );
};
