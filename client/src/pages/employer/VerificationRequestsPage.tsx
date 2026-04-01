import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { ClipboardList } from 'lucide-react';

const statusColor: Record<string, { bg: string; text: string }> = {
    VERIFIED: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
    UNVERIFIED: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' },
    PENDING: { bg: 'rgba(234,179,8,0.1)', text: '#eab308' },
    REJECTED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
    ACTIVE: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
    LEFT: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8' },
};

export const VerificationRequestsPage = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') { navigate('/'); return; }
        const token = localStorage.getItem('nevn_token');
        if (!token) { navigate('/login'); return; }
        (async () => {
            try {
                const data = await employerService.getVerificationRequests();
                setRequests(data.requests || []);
            } catch (err: any) {
                // Only hard-redirect on auth failure
                if (err.message?.includes('401') || err.message?.includes('403')) navigate('/login');
                // Otherwise show empty state
            } finally { setLoading(false); }
        })();
    }, [navigate]);

    if (loading) return <EmployerLayout><div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></EmployerLayout>;

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Verification Requests</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>All employees linked to your company and their verification status.</p>

                <div style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                    {requests.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <ClipboardList size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                            <p>No verification requests yet. Add employees from the Employee Management page.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['Employee', 'Email', 'Position', 'Verification Status', 'Employment', 'Date Added'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((req: any) => {
                                    const vSc = statusColor[req.employee_status] || statusColor.UNVERIFIED;
                                    const eSc = statusColor[req.employment_status] || statusColor.ACTIVE;
                                    return (
                                        <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                                    <div style={{
                                                        width: '34px', height: '34px', borderRadius: '50%',
                                                        background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center',
                                                        justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-accent)',
                                                    }}>
                                                        {req.full_name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{req.full_name}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{req.email}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{req.position || '—'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: vSc.bg, color: vSc.text }}>
                                                    {req.employee_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600, background: eSc.bg, color: eSc.text }}>
                                                    {req.employment_status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                                                {req.joined_at ? new Date(req.joined_at).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
};
