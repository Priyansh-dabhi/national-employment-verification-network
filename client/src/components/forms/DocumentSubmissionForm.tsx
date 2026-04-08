import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { FileText } from 'lucide-react';

export interface DocumentSubmissionData {
  file: File;
  docType: string;
  docId: string;
}

interface DocumentSubmissionFormProps {
  file: File;
  onSubmit: (data: DocumentSubmissionData) => Promise<void> | void;
  onCancel: () => void;
}

const DOC_OPTIONS = [
  { value: 'Identity', label: 'Identity (National ID, Passport)' },
  { value: 'Education', label: 'Education (Degree, Certificate)' },
  { value: 'Employment', label: 'Employment (Contract, Letter)' },
  { value: 'Tax', label: 'Tax Record' },
  { value: 'Other', label: 'Other' },
];

export const DocumentSubmissionForm: React.FC<DocumentSubmissionFormProps> = ({ file, onSubmit, onCancel }) => {
  const [docType, setDocType] = useState(DOC_OPTIONS[0].value);
  const [docId, setDocId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!docId.trim()) {
      setError('Document reference number is required.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ file, docType, docId: docId.trim() });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to submit document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="stack" style={{ gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          padding: '0.9rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--glass-border)',
        }}
      >
        <FileText color="var(--color-highlight)" size={20} />
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</p>
          <p className="muted" style={{ fontSize: '0.8rem' }}>
            {(file.size / 1024).toFixed(0)} KB
          </p>
        </div>
      </div>

      <div>
        <label className="field-label" htmlFor="doc-type-select">
          Document Type
        </label>
        <select
          id="doc-type-select"
          value={docType}
          onChange={(event) => setDocType(event.target.value)}
          className="field-control"
        >
          {DOC_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Document ID / Reference Number"
        placeholder="e.g. A-12345678"
        value={docId}
        onChange={(event) => setDocId(event.target.value)}
        required
      />

      {error ? <p className="field-error">{error}</p> : null}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.35rem' }}>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={loading}>
          Submit Document
        </Button>
      </div>
    </form>
  );
};