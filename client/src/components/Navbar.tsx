import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Briefcase, LayoutDashboard, LogOut, ListChecks } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register');

    const token = localStorage.getItem('nevn_token');
    const role = localStorage.getItem('nevn_role'); // 'employee' or 'employer'
    const accountStatus = localStorage.getItem('nevn_account_status'); // 'VERIFIED', 'PENDING', etc.
    const isLoggedIn = !!token;
    const isVerified = accountStatus === 'VERIFIED';

    const handleLogout = () => {
        localStorage.removeItem('nevn_token');
        localStorage.removeItem('nevn_role');
        localStorage.removeItem('nevn_account_status');
        navigate('/');
    };

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--glass-border)'
            }}
        >
            <div className="container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-highlight), var(--color-accent))',
                        padding: '0.5rem',
                        borderRadius: '0.5rem'
                    }}>
                        <ShieldCheck size={28} color="#0f172a" strokeWidth={2.5} />
                    </div>
                    <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>NEVN</span>
                </Link>

                {/* Nav Links */}
                {!isAuthPage && (
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>

                        {isLoggedIn ? (
                            <>
                                {/* Dashboard link */}
                                <Link
                                    to={role === 'employer' ? '/dashboard/employer' : '/dashboard/employee'}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                                    onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                >
                                    <LayoutDashboard size={16} /> Dashboard
                                </Link>

                                {/* Job Portal links — only for verified users */}
                                {isVerified && role === 'employee' && (
                                    <>
                                        <Link
                                            to="/jobs"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                        >
                                            <Briefcase size={16} /> Browse Jobs
                                        </Link>
                                        <Link
                                            to="/my-applications"
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                                            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                        >
                                            <ListChecks size={16} /> My Applications
                                        </Link>
                                    </>
                                )}

                                {isVerified && role === 'employer' && (
                                    <Link
                                        to="/employer/jobs"
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none', transition: 'color 0.2s' }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#e2e8f0')}
                                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                                    >
                                        <Briefcase size={16} /> My Jobs
                                    </Link>
                                )}

                                {/* Logout */}
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        color: '#f87171',
                                        padding: '0.4rem 0.9rem',
                                        borderRadius: 'var(--radius-md)',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                                    }}
                                >
                                    <LogOut size={14} /> Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link to="/admin-login" style={{ marginRight: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500, textDecoration: 'none' }}>
                                    Admin Portal
                                </Link>
                                <Link to="/login">
                                    <Button variant="ghost">Log In</Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary">Get Verified</Button>
                                </Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </motion.nav>
    );
};
