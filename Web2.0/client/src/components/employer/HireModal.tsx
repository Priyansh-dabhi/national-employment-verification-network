import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface HireModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantName: string;
  prefilledPosition?: string;
  onSubmit: (data: { position: string; salary: string; compensation: string }) => Promise<void>;
}

export const HireModal: React.FC<HireModalProps> = ({ isOpen, onClose, applicantName, prefilledPosition, onSubmit }) => {
  const [position, setPosition] = useState('');
  const [salary, setSalary] = useState('');
  const [compensation, setCompensation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync prefilledPosition when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPosition(prefilledPosition || '');
      setSalary('');
      setCompensation('');
    }
  }, [isOpen, prefilledPosition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim() || !salary.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({ position, salary, compensation });
      setPosition('');
      setSalary('');
      setCompensation('');
      onClose();
    } catch (error) {
      console.error('Failed to submit hire proposal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Propose Hire for ${applicantName}`}>
      <form onSubmit={handleSubmit} className="stack">
        <div>
          <label className="field-label">Position / Role {!prefilledPosition && <span style={{ color: 'var(--color-error)' }}>*</span>}</label>
          <input
            type="text"
            className="field-control"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            required
            disabled={isSubmitting || !!prefilledPosition}
            style={prefilledPosition ? { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--color-text-muted)', cursor: 'not-allowed' } : {}}
          />
        </div>

        <div>
          <label className="field-label">Salary <span style={{ color: 'var(--color-error)' }}>*</span></label>
          <input
            type="text"
            className="field-control"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="e.g. $120,000"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="field-label">Additional Compensation</label>
          <textarea
            className="field-control"
            value={compensation}
            onChange={(e) => setCompensation(e.target.value)}
            placeholder="e.g. Health Insurance, Equity, Bonus"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !position.trim() || !salary.trim()}>
            {isSubmitting ? 'Proposing...' : 'Send Proposal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
