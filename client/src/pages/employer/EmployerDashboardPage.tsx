import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Building2, ShieldCheck, Users, ClipboardList, BadgeCheck, TrendingUp } from 'lucide-react';

export const EmployerDashboardPage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({ employees: 0, verified: 0, requests: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') {
            navigate('/');
            return;
        }
        (async () => {
            try {
                const profileData = await employerService.getProfile();
                setProfile(profileData.profile);

                // Load stats independently — failures just show zero
                const [empData, verifiedData, reqData] = await Promise.allSettled([
                    employerService.getCompanyEmployees(),
                    employerService.getVerifiedEmployees(),
                    employerService.getVerificationRequests(),
                ]);
                setStats({
                    employees: empData.status === 'fulfilled' ? (empData.value.employees?.length || 0) : 0,
                    verified: verifiedData.status === 'fulfilled' ? (verifiedData.value.employees?.length || 0) : 0,
                    requests: reqData.status === 'fulfilled' ? (reqData.value.requests?.length || 0) : 0,
                });
            } catch {
                navigate('/login');
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    if (loading) return (
        <EmployerLayout>
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem', color: 'var(--color-text-muted)' }}>Loading dashboard...</div>
        </EmployerLayout>
    );

    const statusColor: Record<string, string> = {
        VERIFIED: 'var(--color-success)',
        PENDING: 'var(--color-warning)',
        UNVERIFIED: 'var(--color-text-muted)',
        REJECTED: 'var(--color-error)',
    };

    const statCards = [
        { label: 'Total Employees', value: stats.employees, icon: Users, color: '#6366f1' },
        { label: 'Verified Employees', value: stats.verified, icon: BadgeCheck, color: 'var(--color-success)' },
        { label: 'Verification Requests', value: stats.requests, icon: ClipboardList, color: 'var(--color-warning)' },
    ];

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Welcome back, {profile?.authorized_person_name || 'Employer'} 👋
                    </h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>
                        Here's a quick overview of your employer portal.
                    </p>
                </div>

                {/* Status Banner */}
                {profile?.account_status && (
                    <div style={{
                        padding: '1rem 1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        background: `${statusColor[profile.account_status] || '#fff'}15`,
                        border: `1px solid ${statusColor[profile.account_status] || '#fff'}30`,
                        marginBottom: '2rem',
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                    }}>
                        <ShieldCheck size={20} color={statusColor[profile.account_status]} />
                        <div>
                            <p style={{ fontWeight: 600, color: statusColor[profile.account_status] }}>
                                Company Status: {profile.account_status}
                            </p>
                            {profile.account_status === 'UNVERIFIED' && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Upload your documents and apply for verification to unlock all features.
                                </p>
                            )}
                            {profile.account_status === 'PENDING' && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                    Your verification request is under review by the NEVN Central Authority.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
                    {statCards.map(({ label, value, icon: Icon, color }) => (
                        <div key={label} style={{
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                            display: 'flex', alignItems: 'center', gap: '1rem',
                        }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={22} color={color} />
                            </div>
                            <div>
                                <p style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Company Info Card */}
                <div style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <Building2 size={20} color="var(--color-accent)" />
                        <h2 style={{ fontWeight: 600, fontSize: '1.05rem' }}>Company Overview</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        {[
                            { label: 'Organization', value: profile?.organization_name },
                            { label: 'Industry', value: profile?.industry_sector },
                            { label: 'Type', value: profile?.org_type },
                            { label: 'Authorized Person', value: profile?.authorized_person_name },
                            { label: 'Designation', value: profile?.designation },
                            { label: 'Location', value: profile ? `${profile.city}, ${profile.state}` : '' },
                        ].map(({ label, value }) => (
                            <div key={label} style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</p>
                                <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{value || '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <TrendingUp size={16} color="var(--color-text-muted)" style={{ alignSelf: 'center' }} />
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', alignSelf: 'center' }}>Quick links:</span>
                    {[
                        { label: 'Go to Company Verification →', path: '/employer/company-verification' },
                        { label: 'Manage Employees →', path: '/employer/employees' },
                        { label: 'View Requests →', path: '/employer/verification-requests' },
                        { label: 'Post Jobs →', path: '/employer/jobs' },
                    ].map(({ label, path }) => (
                        <button key={path} onClick={() => navigate(path)} style={{
                            background: 'none', border: 'none', color: 'var(--color-accent)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, padding: 0,
                        }}>{label}</button>
                    ))}
                </div>
            </div>
        </EmployerLayout>
    );
};
