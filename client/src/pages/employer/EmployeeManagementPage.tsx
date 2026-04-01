import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { UserCheck, UserX, Users, Plus, X, AlertCircle } from 'lucide-react';

export const EmployeeManagementPage = () => {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'ACTIVE' | 'LEFT'>('ACTIVE');
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [form, setForm] = useState({ employee_email: '', position: '', reason: '' });
    const [formLoading, setFormLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [accountStatus, setAccountStatus] = useState('');

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') { navigate('/'); return; }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [empResult, profileResult] = await Promise.allSettled([
                employerService.getCompanyEmployees(),
                employerService.getProfile(),
            ]);
            if (empResult.status === 'fulfilled') setEmployees(empResult.value.employees || []);
            if (profileResult.status === 'fulfilled') setAccountStatus(profileResult.value.profile?.account_status || '');
            if (empResult.status === 'rejected' && profileResult.status === 'rejected') navigate('/login');
        } catch { navigate('/login'); }
        finally { setLoading(false); }
    };

    const handleMarkLeft = async (employeeId: number) => {
        setMarking(employeeId);
        try {
            await employerService.markEmployeeLeft(employeeId);
            await loadData();
        } catch (e: any) {
            setMessage({ text: e.message, type: 'error' });
        } finally { setMarking(null); }
    };

    const handleAddEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setMessage(null);
        try {
            await employerService.requestEmployeeVerification(form.employee_email, form.position, form.reason);
            setMessage({ text: `Employee added successfully!`, type: 'success' });
            setForm({ employee_email: '', position: '', reason: '' });
            setShowAddForm(false);
            await loadData();
        } catch (err: any) {
            setMessage({ text: err.message || 'Failed to add employee', type: 'error' });
        } finally { setFormLoading(false); }
    };

    const filtered = employees.filter(e => e.employment_status === activeTab);

    if (loading) return <EmployerLayout><div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></EmployerLayout>;

    const isVerified = accountStatus === 'VERIFIED';

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Employee Management</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Track your active and past employees.</p>
                    </div>
                    <button
                        onClick={() => { if (isVerified) setShowAddForm(true); }}
                        disabled={!isVerified}
                        title={!isVerified ? 'Company must be verified first' : ''}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                            background: isVerified ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)',
                            color: isVerified ? '#000' : 'var(--color-text-muted)',
                            border: 'none', cursor: isVerified ? 'pointer' : 'not-allowed',
                            fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s',
                        }}
                    >
                        <Plus size={16} /> Add Employee
                    </button>
                </div>

                {!isVerified && (
                    <div style={{
                        display: 'flex', gap: '0.75rem', padding: '1rem 1.25rem',
                        background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)',
                        borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
                        color: 'var(--color-warning)', fontSize: '0.9rem',
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                        <span>Your company must be <strong>VERIFIED</strong> to add or manage employees. Please complete Company Verification first.</span>
                    </div>
                )}

                {message && (
                    <div style={{
                        padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
                        background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        fontSize: '0.9rem', fontWeight: 500,
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Add Employee Modal-style form */}
                {showAddForm && (
                    <div style={{
                        background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontWeight: 600 }}>Add / Link Employee</h3>
                            <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddEmployee} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Employee Email *</label>
                                <input
                                    required type="email" value={form.employee_email}
                                    onChange={e => setForm({ ...form, employee_email: e.target.value })}
                                    placeholder="employee@example.com"
                                    style={{
                                        width: '100%', padding: '0.65rem 1rem',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Position / Role</label>
                                <input
                                    value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                                    placeholder="e.g. Software Engineer"
                                    style={{
                                        width: '100%', padding: '0.65rem 1rem',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Reason (optional)</label>
                                <input
                                    value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                                    placeholder="e.g. Background check"
                                    style={{
                                        width: '100%', padding: '0.65rem 1rem',
                                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                        borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem', boxSizing: 'border-box',
                                    }}
                                />
                            </div>
                            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem' }}>
                                <button type="submit" disabled={formLoading} style={{
                                    padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)',
                                    background: 'var(--color-accent)', color: '#000',
                                    border: 'none', cursor: 'pointer', fontWeight: 600,
                                }}>{formLoading ? 'Adding…' : 'Add Employee'}</button>
                                <button type="button" onClick={() => setShowAddForm(false)} style={{
                                    padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-md)',
                                    background: 'rgba(255,255,255,0.05)', color: 'var(--color-text-muted)',
                                    border: '1px solid var(--glass-border)', cursor: 'pointer', fontWeight: 600,
                                }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {(['ACTIVE', 'LEFT'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)',
                            background: activeTab === tab ? 'var(--color-accent)' : 'var(--glass-bg)',
                            color: activeTab === tab ? '#000' : 'var(--color-text-muted)',
                            border: activeTab === tab ? 'none' : '1px solid var(--glass-border)',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                            {tab === 'ACTIVE' ? <UserCheck size={15} /> : <UserX size={15} />}
                            {tab === 'ACTIVE' ? 'Active Employees' : 'Past Employees'}
                            <span style={{
                                background: activeTab === tab ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)',
                                padding: '0 0.4rem', borderRadius: '999px', fontSize: '0.75rem',
                            }}>
                                {employees.filter(e => e.employment_status === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Employee Table */}
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <Users size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <p>No {activeTab.toLowerCase()} employees found.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                                    {['Name', 'Email', 'Position', 'Verification', activeTab === 'ACTIVE' ? 'Joined' : 'Left', 'Action'].map(h => (
                                        <th key={h} style={{ padding: '0.85rem 1rem', textAlign: 'left', fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((emp: any) => (
                                    <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{emp.full_name}</td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{emp.email}</td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{emp.position || '—'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 600,
                                                background: emp.account_status === 'VERIFIED' ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                                                color: emp.account_status === 'VERIFIED' ? 'var(--color-success)' : 'var(--color-text-muted)',
                                            }}>{emp.account_status}</span>
                                        </td>
                                        <td style={{ padding: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                                            {activeTab === 'ACTIVE'
                                                ? new Date(emp.joined_at).toLocaleDateString()
                                                : emp.left_at ? new Date(emp.left_at).toLocaleDateString() : '—'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {activeTab === 'ACTIVE' && isVerified && (
                                                <button
                                                    onClick={() => handleMarkLeft(emp.id)}
                                                    disabled={marking === emp.id}
                                                    style={{
                                                        padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-md)',
                                                        background: 'rgba(239,68,68,0.1)', color: 'var(--color-error)',
                                                        border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer',
                                                        fontSize: '0.8rem', fontWeight: 600,
                                                    }}
                                                >
                                                    {marking === emp.id ? '…' : 'Mark Left'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
};
