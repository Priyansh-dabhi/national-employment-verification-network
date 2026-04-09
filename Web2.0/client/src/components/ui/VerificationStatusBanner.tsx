import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import type { VerificationStatus, UserRole } from '../../types';

interface VerificationStatusBannerProps {
  status: VerificationStatus;
  userRole: UserRole;
  feedbackReason?: string;
  onApply?: () => void;
  isApplying?: boolean;
}

export const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({
  status,
  userRole,
  feedbackReason,
  onApply,
  isApplying = false,
}) => {
  const normalized = status.toLowerCase() as VerificationStatus;

  const configMap = {
    verified: {
      icon: ShieldCheck,
      title: 'Verification complete',
      color: 'var(--color-success)',
      border: '#bbf7d0',
      bg: '#f0fdf4',
      message: 'Your account is verified and all gated features are unlocked.',
    },
    pending: {
      icon: Clock,
      title: 'Verification in progress',
      color: 'var(--color-warning)',
      border: '#fcd34d',
      bg: '#fffbeb',
      message: 'Your submitted details are being reviewed by the authority team.',
    },
    processing: {
      icon: Clock,
      title: 'Verification processing via Webhook',
      color: 'var(--color-info, #0ea5e9)',
      border: '#bae6fd',
      bg: '#f0f9ff',
      message: 'Your verification has been approved and is currently being processed on the blockchain network.',
    },
    rejected: {
      icon: ShieldAlert,
      title: 'Verification rejected',
      color: 'var(--color-error)',
      border: '#fecaca',
      bg: '#fef2f2',
      message: 'Please update the required details and submit again.',
    },
    unverified: {
      icon: AlertTriangle,
      title: 'Verification required',
      color: '#b45309',
      border: '#fcd34d',
      bg: '#fffbeb',
      message: 'Start the verification flow to unlock full portal functionality.',
    },
  } as const;

  const cfg = configMap[normalized] ?? configMap.unverified;
  const Icon = cfg.icon;

  return (
    <div
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '1.1rem 1.2rem',
        marginBottom: '1.4rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flex: 1, minWidth: '250px' }}>
        <span
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            background: '#ffffff',
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          <Icon size={20} color={cfg.color} />
        </span>
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.14rem', color: cfg.color }}>{cfg.title}</h3>
          <p className="muted" style={{ fontSize: '0.88rem' }}>
            {cfg.message}
            {userRole === 'employer' && normalized === 'verified' ? ' You can now add employees and post jobs.' : ''}
          </p>
          {normalized === 'rejected' && feedbackReason ? (
            <p style={{ marginTop: '0.4rem', fontSize: '0.84rem', color: '#b91c1c' }}>
              Admin feedback: {feedbackReason}
            </p>
          ) : null}
        </div>
      </div>

      {normalized === 'unverified' &&
        (onApply ? (
          <Button onClick={onApply} isLoading={isApplying} size="sm">
            Apply for verification
          </Button>
        ) : (
          <span style={{ color: '#b45309', fontSize: '0.82rem' }}>Upload at least one document first.</span>
        ))}
    </div>
  );
};
