
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import type { VerificationStatus } from '../../types';

export type StatusType = VerificationStatus;


interface StatusBadgeProps {
    status: StatusType;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const styles = {
        verified: { bg: '#ecfdf3', color: '#15803d', border: '#bbf7d0', icon: CheckCircle, label: 'Verified' },
        pending: { bg: '#fffbeb', color: '#b45309', border: '#fcd34d', icon: Clock, label: 'Pending' },
        rejected: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', icon: XCircle, label: 'Rejected' },
        unverified: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1', icon: XCircle, label: 'Unverified' },
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
            border: `1px solid ${config.border}`
        }}>
            <Icon size={14} strokeWidth={2.5} />
            {config.label}
        </span>
    );
};
