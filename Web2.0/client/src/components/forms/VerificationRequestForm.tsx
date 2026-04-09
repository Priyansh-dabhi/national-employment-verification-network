import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface VerificationRequestFormProps {
    onSubmit: (employeeId: string) => void;
    onCancel: () => void;
}

export const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        employeeId: '',
        position: '',
        reason: '',
        consent: false
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.consent) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onSubmit(formData.employeeId);
        }, 1000);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
                <Input
                    label="Employee ID or Email"
                    name="employeeId"
                    placeholder="e.g. emp@domain.com or 8824-A"
                    value={formData.employeeId}
                    onChange={handleChange}
                    required
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                    Enter the unique Employee Identifier or registered email address.
                </p>
            </div>

            <Input
                label="Position / Role"
                name="position"
                placeholder="e.g. Senior Developer"
                value={formData.position}
                onChange={handleChange}
                required
            />

            <div className="input-group">
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Reason for Verification</label>
                <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="e.g. Background check for new hire"
                    style={{
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-main)',
                        outline: 'none',
                        minHeight: '80px',
                        fontFamily: 'inherit'
                    }}
                    required
                />
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)' }}>
                <input
                    type="checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    style={{ marginTop: '0.2rem', accentColor: 'var(--color-highlight)' }}
                    required
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    I confirm that I have obtained necessary consent from the employee for this verification request as per privacy regulations.
                </span>
            </label>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={loading} disabled={!formData.consent}>Send Request</Button>
            </div>
        </form>
    );
};
