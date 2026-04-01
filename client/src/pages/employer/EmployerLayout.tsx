import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, ShieldCheck, Users, ClipboardList, BadgeCheck, LogOut, Briefcase } from 'lucide-react';

const navItems = [
    { to: '/employer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/employer/profile', icon: User, label: 'Profile' },
    { to: '/employer/company-verification', icon: ShieldCheck, label: 'Company Verification' },
    { to: '/employer/employees', icon: Users, label: 'Employee Management' },
    { to: '/employer/verification-requests', icon: ClipboardList, label: 'Verification Requests' },
    { to: '/employer/verified-employees', icon: BadgeCheck, label: 'Verified Employees' },
    { to: '/employer/jobs', icon: Briefcase, label: 'Job Postings' },
];

export const EmployerLayout = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('nevn_token');
        localStorage.removeItem('nevn_role');
        localStorage.removeItem('nevn_account_status');
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'var(--glass-bg)',
                borderRight: '1px solid var(--glass-border)',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.5rem 1rem',
                position: 'fixed',
                height: '100vh',
                top: 0,
                left: 0,
                zIndex: 100,
            }}>
                {/* Brand */}
                <div style={{ marginBottom: '2rem', padding: '0 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            background: 'var(--color-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#000', fontWeight: 700, fontSize: '1rem'
                        }}>E</div>
                        <div>
                            <p style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.2 }}>NEVN</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Employer Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.65rem 0.75rem',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '0.9rem',
                                fontWeight: isActive ? 600 : 400,
                                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
                                background: isActive ? 'rgba(0, 212, 170, 0.08)' : 'transparent',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                border: isActive ? '1px solid rgba(0, 212, 170, 0.15)' : '1px solid transparent',
                            })}
                        >
                            <Icon size={18} />
                            {label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-md)',
                        fontSize: '0.9rem', color: 'var(--color-error)',
                        background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)',
                        cursor: 'pointer', width: '100%', marginTop: '1rem',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <LogOut size={18} />
                    Sign Out
                </button>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, marginLeft: '260px', padding: '2rem', minHeight: '100vh' }}>
                {children}
            </main>
        </div>
    );
};
