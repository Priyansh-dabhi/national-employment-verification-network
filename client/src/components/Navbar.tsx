import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar = () => {
    const location = useLocation();
    const isAuthPage = location.pathname.includes('/login') || location.pathname.includes('/register');

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
                background: 'rgba(15, 23, 42, 0.8)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid var(--glass-border)'
            }}
        >
            <div className="container" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, var(--color-highlight), var(--color-accent))',
                        padding: '0.5rem',
                        borderRadius: '0.5rem'
                    }}>
                        <ShieldCheck size={28} color="#0f172a" strokeWidth={2.5} />
                    </div>
                    <span className="text-gradient" style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em' }}>NEVN</span>
                </Link>

                {!isAuthPage && (
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Link to="/login">
                            <Button variant="ghost">Log In</Button>
                        </Link>
                        <Link to="/register">
                            <Button variant="primary">Get Verified</Button>
                        </Link>
                    </div>
                )}
            </div>
        </motion.nav>
    );
};
