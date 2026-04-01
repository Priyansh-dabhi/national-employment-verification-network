import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { BadgeCheck, MapPin } from 'lucide-react';

export const VerifiedEmployeesPage = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') { navigate('/'); return; }
        const token = localStorage.getItem('nevn_token');
        if (!token) { navigate('/login'); return; }
        (async () => {
            try {
                const data = await employerService.getVerifiedEmployees();
                setEmployees(data.employees || []);
            } catch (err: any) {
                if (err.message?.includes('401') || err.message?.includes('403')) navigate('/login');
            } finally { setLoading(false); }
        })();
    }, [navigate]);

    const filtered = employees.filter(e =>
        e.full_name.toLowerCase().includes(search.toLowerCase()) ||
        (e.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.position || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <EmployerLayout><div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></EmployerLayout>;

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Verified Employees</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                    Employees who have been verified by NEVN Central Authority.
                </p>

                {/* Search */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <input
                        type="text"
                        placeholder="Search by name, email, or position..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '0.75rem 1rem', boxSizing: 'border-box',
                            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                            borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem',
                        }}
                    />
                </div>

                {filtered.length === 0 ? (
                    <div style={{
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)', padding: '4rem', textAlign: 'center',
                    }}>
                        <BadgeCheck size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            {search ? `No verified employees matching "${search}"` : 'No verified employees yet.'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {filtered.map((emp: any) => (
                            <div key={emp.id} style={{
                                background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-lg)', padding: '1.25rem',
                                transition: 'border-color 0.2s',
                            }}>
                                {/* Avatar + Verified Badge */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                                    <div style={{
                                        width: '46px', height: '46px', borderRadius: '50%',
                                        background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem',
                                        color: 'var(--color-accent)', flexShrink: 0,
                                    }}>
                                        {emp.full_name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.full_name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.email}</p>
                                    </div>
                                    <BadgeCheck size={20} color="var(--color-success)" style={{ flexShrink: 0 }} />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                                    {emp.position && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                            <span>💼</span> {emp.position}
                                        </div>
                                    )}
                                    {(emp.city || emp.state) && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-text-muted)' }}>
                                            <MapPin size={13} /> {[emp.city, emp.state].filter(Boolean).join(', ')}
                                        </div>
                                    )}
                                    <div style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', borderRadius: '999px', background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)', fontSize: '0.78rem', fontWeight: 600, display: 'inline-block' }}>
                                        ✓ NEVN Verified
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </EmployerLayout>
    );
};
