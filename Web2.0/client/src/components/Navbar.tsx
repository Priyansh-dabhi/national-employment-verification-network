import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2,
  Briefcase,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import { getAdminSession, sessionService } from '../services/sessionService';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useAuth();

  const adminSession = getAdminSession();
  const isAdminLoggedIn = Boolean(adminSession?.isAuthenticated);
  const isLoggedIn = isAdminLoggedIn || auth.isAuthenticated;
  const sessionRole = isAdminLoggedIn ? adminSession?.role : auth.role;
  const dashboardPath = isAdminLoggedIn ? adminSession?.dashboardPath || '/' : auth.dashboardPath || '/';
  const isVerified = auth.accountStatus === 'VERIFIED';

  const navItems = useMemo<NavItem[]>(() => {
    if (!isLoggedIn) return [];

    const items: NavItem[] = [
      {
        to: dashboardPath,
        label: 'Dashboard',
        icon: <LayoutDashboard size={16} />,
      },
    ];

    if (isVerified && sessionRole === 'employee') {
      items.push(
        { to: '/jobs', label: 'Browse Jobs', icon: <Briefcase size={16} /> },
        { to: '/my-applications', label: 'My Applications', icon: <ListChecks size={16} /> },
      );
    }

    if (isVerified && sessionRole === 'employer') {
      items.push({ to: '/employer/jobs', label: 'My Jobs', icon: <Briefcase size={16} /> });
    }

    if (sessionRole === 'employee') {
      items[0].icon = <UserRound size={16} />;
    }

    if (sessionRole === 'employer') {
      items[0].icon = <Building2 size={16} />;
    }

    if (sessionRole === 'admin') {
      items[0].icon = <ShieldCheck size={16} />;
    }

    return items;
  }, [dashboardPath, isLoggedIn, isVerified, sessionRole]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isAdminLoggedIn) {
      sessionService.clearAdminSession();
      navigate('/');
      return;
    }

    await auth.logout();
    navigate('/');
  };

  return (
    <motion.nav initial={{ y: -80 }} animate={{ y: 0 }} className="topnav">
      <div className="container topnav__inner">
        <Link to="/" className="topnav__brand" aria-label="NEVN Home">
          <span className="topnav__logo">
            <ShieldCheck size={20} />
          </span>
          <span className="text-gradient">NEVN</span>
        </Link>

        <button
          type="button"
          className="topnav__menu-btn"
          onClick={() => setMenuOpen((current) => !current)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className={['topnav__links', menuOpen ? 'is-open' : ''].filter(Boolean).join(' ')}>
          {isLoggedIn ? (
            <>
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={[
                    'topnav__link',
                    location.pathname.startsWith(item.to) ? 'is-active' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <Button variant="danger" size="sm" onClick={() => void handleLogout()}>
                <LogOut size={14} /> Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link to="/" className={['topnav__link', location.pathname === '/' ? 'is-active' : ''].filter(Boolean).join(' ')}>
                <ShieldCheck size={16} />
                <span>Home</span>
              </Link>
              <Link to="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Verified</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};
