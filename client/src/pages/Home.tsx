import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, Database, Lock, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { getAdminSession } from '../services/sessionService';

const featureCards = [
  {
    title: 'Government Backed',
    description:
      'Official verification workflows integrated with trusted employment records and review authorities.',
    icon: <ShieldCheck size={30} color="var(--color-primary)" />,
  },
  {
    title: 'Tamper-Resistant Records',
    description:
      'Verification decisions are anchored with integrity checks to prevent fraud and unauthorized edits.',
    icon: <Lock size={30} color="var(--color-accent)" />,
  },
  {
    title: 'Fast Verification Flow',
    description:
      'Employees and employers can complete secure submission and review without manual paperwork delays.',
    icon: <Database size={30} color="#0ea5e9" />,
  },
  {
    title: 'Trusted Hiring Network',
    description:
      'Verified candidates and verified employers connect through a reliable, transparent job ecosystem.',
    icon: <Briefcase size={30} color="#2563eb" />,
  },
];

export const Home = () => {
  const { dashboardPath, isAuthenticated, loading } = useAuth();
  const adminSession = getAdminSession();

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--color-text-muted)' }}>Restoring your session...</div>;
  }

  if (adminSession?.isAuthenticated && adminSession.dashboardPath) {
    return <Navigate to={adminSession.dashboardPath} replace />;
  }

  if (isAuthenticated && dashboardPath) {
    return <Navigate to={dashboardPath} replace />;
  }

  return (
    <div className="page-content" style={{ minHeight: '100vh' }}>
      <section className="container" style={{ paddingTop: '0.8rem', paddingBottom: '2.2rem' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div
            className="surface"
            style={{
              textAlign: 'center',
              padding: '3rem 1.2rem',
              borderRadius: 'var(--radius-xl)',
              background:
                'radial-gradient(circle at 12% 15%, rgba(37, 99, 235, 0.1), transparent 32%), radial-gradient(circle at 88% 18%, rgba(15, 118, 110, 0.1), transparent 34%), #ffffff',
            }}
          >
            <span
              className="ui-pill"
              style={{
                background: '#dbeafe',
                color: '#1e3a8a',
                marginBottom: '0.9rem',
              }}
            >
              National Employment Verification Network
            </span>

            <h1
              style={{
                fontSize: 'clamp(2rem, 1.5rem + 2.4vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.12,
                marginBottom: '0.7rem',
              }}
            >
              Trusted Employment Verification for the <span className="text-gradient">Modern Workforce</span>
            </h1>

            <p
              style={{
                maxWidth: '760px',
                margin: '0 auto 1.35rem',
                color: 'var(--color-text-muted)',
                fontSize: '1rem',
              }}
            >
              A secure and professional platform for employees, employers, and authorities to validate identity, employment, and trust at scale.
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
              <Link to="/register">
                <Button size="lg">
                  Get Started <ArrowRight size={18} />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container" style={{ paddingBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.9rem' }}>
          {featureCards.map((feature, index) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}>
              <Card hover>
                <div style={{ marginBottom: '0.75rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.06rem', fontWeight: 700, marginBottom: '0.28rem' }}>{feature.title}</h3>
                <p className="section-subtitle">{feature.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
