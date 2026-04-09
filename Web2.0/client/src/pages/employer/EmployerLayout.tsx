import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, ShieldCheck, Users, ClipboardList, BadgeCheck, LogOut, Briefcase, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const auth = useAuth();

  const closeSidebar = () => setSidebarOpen(false);

  const handleLogout = async () => {
    await auth.logout();
    closeSidebar();
    navigate('/login');
  };

  return (
    <div className="employer-layout" style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <header className="employer-mobile-bar">
        <button
          type="button"
          aria-label="Toggle sidebar"
          onClick={() => setSidebarOpen((open) => !open)}
          className="employer-mobile-btn"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'var(--color-accent)',
              color: '#02111d',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
            }}
          >
            E
          </span>
          <span style={{ fontWeight: 700 }}>Employer Portal</span>
        </div>
      </header>

      {sidebarOpen ? <button type="button" className="employer-backdrop" onClick={closeSidebar} aria-label="Close sidebar" /> : null}

      <aside className={`employer-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ marginBottom: '1.5rem', padding: '0 0.45rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.72rem' }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'var(--color-accent)',
                color: '#02111d',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
              }}
            >
              E
            </span>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.92rem', lineHeight: 1.2 }}>NEVN</p>
              <p className="muted" style={{ fontSize: '0.72rem' }}>
                Employer Portal
              </p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={closeSidebar}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.7rem',
                padding: '0.62rem 0.72rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.88rem',
                color: isActive ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.32)' : '1px solid transparent',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.2s ease',
              })}
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => void handleLogout()}
          className="employer-logout-btn"
        >
          <LogOut size={17} />
          Sign Out
        </button>
      </aside>

      <main className="employer-main">{children}</main>
    </div>
  );
};
