
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { VerificationStatus } from '../../types';

export type StatusType = VerificationStatus;


interface StatusBadgeProps {
    status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const styles = {
        verified: { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', icon: CheckCircle, label: 'Verified' },
        pending: { bg: 'rgba(234, 179, 8, 0.1)', color: '#eab308', icon: Clock, label: 'Pending' },
        rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: XCircle, label: 'Rejected' },
        unverified: { bg: 'rgba(148, 163, 184, 0.1)', color: '#94a3b8', icon: XCircle, label: 'Unverified' },
    };

    const config = styles[status] || styles.unverified;
    const Icon = config.icon;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: config.bg,
            color: config.color,
            fontSize: '0.875rem',
            fontWeight: 500,
            border: `1px solid ${config.color}30`
        }}>
            <Icon size={14} strokeWidth={2.5} />
            {config.label}
        </span>
    );
};
