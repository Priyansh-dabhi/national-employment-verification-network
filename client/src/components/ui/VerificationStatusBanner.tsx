import React from 'react';
import { ShieldCheck, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import type { VerificationStatus, UserRole } from '../../types';

interface VerificationStatusBannerProps {
    status: VerificationStatus;
    userRole: UserRole;
    feedbackReason?: string;
    onApply?: () => void;
}

export const VerificationStatusBanner: React.FC<VerificationStatusBannerProps> = ({ status, feedbackReason, onApply }) => {
    const getContent = () => {
        switch (status) {
            case 'verified':
                return {
                    icon: <ShieldCheck size={24} color="#22c55e" />,
                    title: "Verified Account",
                    message: "Your account is fully verified by the Government Authority.",
                    color: "var(--color-success)",
                    bg: "rgba(34, 197, 94, 0.1)",
                    border: "rgba(34, 197, 94, 0.2)"
                };
            case 'pending':
                return {
                    icon: <Clock size={24} color="#eab308" />,
                    title: "Verification Pending",
                    message: "Your verification request is under review by the Government Authority.",
                    color: "var(--color-warning)",
                    bg: "rgba(234, 179, 8, 0.1)",
                    border: "rgba(234, 179, 8, 0.2)"
                };
            case 'rejected':
                return {
                    icon: <ShieldAlert size={24} color="#ef4444" />,
                    title: "Verification Rejected",
                    message: "Your verification request was rejected. Please update your documents and try again.",
                    color: "var(--color-error)",
                    bg: "rgba(239, 68, 68, 0.1)",
                    border: "rgba(239, 68, 68, 0.2)"
                };
            case 'unverified':
            default:
                return {
                    icon: <AlertTriangle size={24} color="#f97316" />,
                    title: "Account Not Verified",
                    message: "Apply for verification to unlock full access to the platform.",
                    color: "#f97316",
                    bg: "rgba(249, 115, 22, 0.1)",
                    border: "rgba(249, 115, 22, 0.2)",
                    action: true
                };
        }
    };

    const content = getContent();

    return (
        <div style={{
            background: content.bg,
            border: `1px solid ${content.border}`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {content.icon}
                </div>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: content.color, marginBottom: '0.25rem' }}>
                        {content.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        {content.message}
                    </p>
                    {feedbackReason && status === 'rejected' && (
                        <div className="mt-2 text-sm bg-red-100 text-red-800 p-2 rounded-md border border-red-200">
                            <strong>Admin Feedback:</strong> {feedbackReason}
                        </div>
                    )}
                </div>
            </div>

            {content.action && (
                onApply ? (
                    <Button
                        onClick={onApply}
                        style={{
                            background: content.color,
                            color: '#fff',
                            border: 'none',
                            fontWeight: 600
                        }}
                    >
                        Apply for Verification
                    </Button>
                ) : (
                    <p style={{ fontSize: '0.82rem', color: '#f97316', fontStyle: 'italic', maxWidth: '220px', textAlign: 'right' }}>
                        Upload a document first to apply for verification.
                    </p>
                )
            )}
        </div>
    );
};
