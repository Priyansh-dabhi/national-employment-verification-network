import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FileText } from 'lucide-react';


interface DocumentSubmissionFormProps {
    file: File;
    onSubmit: (data: any) => void;
    onCancel: () => void;
}

export const DocumentSubmissionForm: React.FC<DocumentSubmissionFormProps> = ({ file, onSubmit, onCancel }) => {
    const [docType, setDocType] = useState('Identity');
    const [docId, setDocId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            onSubmit({ file, docType, docId });
        }, 1500);
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--glass-border)'
            }}>
                <FileText color="var(--color-highlight)" size={24} />
                <div style={{ overflow: 'hidden' }}>
                    <p style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{(file.size / 1024).toFixed(0)} KB</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Document Type</label>
                <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem 1rem',
                        color: 'var(--color-text-main)',
                        fontSize: '1rem',
                        outline: 'none',
                        width: '100%'
                    }}
                >
                    <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="Identity">Identity (National ID, Passport)</option>
                    <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="Education">Education (Degree, Certificate)</option>
                    <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="Employment">Employment (Contract, Letter)</option>
                    <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="Tax">Tax Record</option>
                    <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="Other">Other</option>
                </select>
            </div>

            <Input
                label="Document ID / Reference Number"
                placeholder="e.g. A-12345678"
                value={docId}
                onChange={(e) => setDocId(e.target.value)}
                required
            />

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={loading}>Submit Document</Button>
            </div>
        </form>
    );
};
