
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ShieldCheck, Database, Lock, ArrowRight, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div style={{ paddingTop: '80px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Hero Section */}
            <section style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem 0',
                textAlign: 'center'
            }}>
                <motion.div
                    className="container"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <span style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            color: 'var(--color-highlight)',
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            display: 'inline-block',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(56, 189, 248, 0.2)'
                        }}>
                            Powered by Blockchain Technology
                        </span>
                    </motion.div>

                    <motion.h1 variants={itemVariants} style={{
                        fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        marginBottom: '1.5rem',
                        background: 'linear-gradient(to right, #ffffff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Trusted Verification for the <br />
                        <span className="text-gradient">Modern Workforce</span>
                    </motion.h1>

                    <motion.p variants={itemVariants} style={{
                        fontSize: '1.25rem',
                        color: 'var(--color-text-muted)',
                        maxWidth: '600px',
                        margin: '0 auto 3rem'
                    }}>
                        Secure, immutable, and instant employment verification for government, employers, and employees.
                    </motion.p>

                    <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Link to="/register">
                            <Button size="lg" className="shadow-highlight">
                                Get Started <ArrowRight size={20} />
                            </Button>
                        </Link>
                        <Link to="/login">
                            <Button variant="outline" size="lg">
                                Employer Login
                            </Button>
                        </Link>
                        <Link to="/jobs">
                            <Button variant="outline" size="lg" style={{ borderColor: 'var(--color-highlight)', color: 'var(--color-highlight)' }}>
                                Explore Jobs
                            </Button>
                        </Link>
                    </motion.div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="container" style={{ paddingBottom: '6rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem'
                }}>
                    <Card hover>
                        <ShieldCheck size={40} color="var(--color-accent)" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Government Backed</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Official verification platform integrated with national employment databases for absolute authenticity.
                        </p>
                    </Card>

                    <Card hover>
                        <Lock size={40} color="var(--color-highlight)" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Immutable Records</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Every verification request and approval is recorded on the blockchain, preventing fraud and tampering.
                        </p>
                    </Card>

                    <Card hover>
                        <Database size={40} color="#22c55e" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Instant Access</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Securely share verified credentials with employers instantly, eliminating paperwork delays.
                        </p>
                    </Card>

                    <Card hover>
                        <Briefcase size={40} color="#a855f7" style={{ marginBottom: '1.5rem' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.75rem' }}>Trusted Job Portal</h3>
                        <p style={{ color: 'var(--color-text-muted)' }}>
                            Access an exclusive marketplace of jobs matched to your verified credentials, or recruit top talent with confidence.
                        </p>
                    </Card>
                </div>
            </section>
        </div>
    );
};
