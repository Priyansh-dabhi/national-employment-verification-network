import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { User, Building2, MapPin, Mail, Phone } from 'lucide-react';

export const EmployerProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') { navigate('/'); return; }
        (async () => {
            try {
                const data = await employerService.getProfile();
                setProfile(data.profile);
            } catch { navigate('/login'); }
            finally { setLoading(false); }
        })();
    }, [navigate]);

    if (loading) return <EmployerLayout><div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></EmployerLayout>;

    const statusColors: Record<string, { bg: string; text: string; border: string }> = {
        VERIFIED: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' },
        PENDING: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', border: 'rgba(234,179,8,0.2)' },
        UNVERIFIED: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
        REJECTED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    };
    const sc = statusColors[profile?.account_status] || statusColors.UNVERIFIED;

    const fields = [
        { icon: Building2, label: 'Organization Name', value: profile?.organization_name },
        { icon: Building2, label: 'Organization Type', value: profile?.org_type },
        { icon: Building2, label: 'Industry Sector', value: profile?.industry_sector },
        { icon: User, label: 'Authorized Person', value: profile?.authorized_person_name },
        { icon: User, label: 'Designation', value: profile?.designation },
        { icon: Mail, label: 'Email', value: profile?.email },
        { icon: Phone, label: 'Mobile (from login)', value: '— (stored securely)' },
        { icon: MapPin, label: 'City', value: profile?.city },
        { icon: MapPin, label: 'State', value: profile?.state },
    ];

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.5rem' }}>Company Profile</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Your registered organization information.</p>

                {/* Status Badge */}
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.4rem 1rem', borderRadius: '999px',
                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                    fontWeight: 600, fontSize: '0.85rem', marginBottom: '2rem',
                }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: sc.text }} />
                    Account Status: {profile?.account_status || 'UNVERIFIED'}
                </div>

                {/* Profile Card */}
                <div style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                }}>
                    {/* Avatar Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(0,212,170,0.15), rgba(99,102,241,0.15))',
                        padding: '2rem', borderBottom: '1px solid var(--glass-border)',
                        display: 'flex', alignItems: 'center', gap: '1.5rem',
                    }}>
                        <div style={{
                            width: '72px', height: '72px', borderRadius: '50%',
                            background: 'var(--color-accent)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: '#000', fontWeight: 700, fontSize: '1.75rem',
                        }}>
                            {profile?.organization_name?.charAt(0) || 'E'}
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{profile?.organization_name}</h2>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{profile?.industry_sector} · {profile?.org_type}</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '—'}</p>
                        </div>
                    </div>

                    {/* Fields Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
                        {fields.map(({ icon: Icon, label, value }, i) => (
                            <div key={label} style={{
                                padding: '1.25rem 1.5rem',
                                borderBottom: `1px solid var(--glass-border)`,
                                borderRight: i % 2 === 0 ? '1px solid var(--glass-border)' : 'none',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                                    <Icon size={14} color="var(--color-text-muted)" />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                                </div>
                                <p style={{ fontWeight: 500, fontSize: '0.95rem' }}>{value || '—'}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </EmployerLayout>
    );
};
