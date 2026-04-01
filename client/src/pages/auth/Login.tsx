import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { User, Building } from 'lucide-react';

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'employee' | 'employer'>('employee');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { user } = await authService.login(email, password, role);
            // Redirect based on role from response (or selected role)
            if (user.role === 'employee') {
                navigate('/dashboard/employee');
            } else if (user.role === 'employer') {
                navigate('/employer/dashboard');
            }
        } catch (error) {
            console.error("Login failed", error);
            alert("Login failed. Please check your credentials and role.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '450px' }}>
                <Card>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', textAlign: 'center' }}>Welcome Back</h2>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div
                            onClick={() => setRole('employee')}
                            style={{
                                cursor: 'pointer',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: `2px solid ${role === 'employee' ? 'var(--color-highlight)' : 'var(--glass-border)'}`,
                                background: role === 'employee' ? 'rgba(56, 189, 248, 0.1)' : 'var(--glass-bg)',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <User size={24} color={role === 'employee' ? 'var(--color-highlight)' : 'var(--color-text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: role === 'employee' ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>Employee</span>
                        </div>
                        <div
                            onClick={() => setRole('employer')}
                            style={{
                                cursor: 'pointer',
                                padding: '1rem',
                                borderRadius: 'var(--radius-md)',
                                border: `2px solid ${role === 'employer' ? 'var(--color-highlight)' : 'var(--glass-border)'}`,
                                background: role === 'employer' ? 'rgba(56, 189, 248, 0.1)' : 'var(--glass-bg)',
                                textAlign: 'center',
                                transition: 'all 0.2s',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                            }}
                        >
                            <Building size={24} color={role === 'employer' ? 'var(--color-highlight)' : 'var(--color-text-muted)'} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 500, color: role === 'employer' ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>Employer</span>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <Input
                            label="Email Address"
                            placeholder="Enter Your Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <Input
                            label="Password"
                            placeholder="Enter Your Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <Button size="lg" style={{ padding: '0.5rem' }} disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </Button>

                        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            Don't have an account? <Link to="/register" style={{ color: 'var(--color-highlight)' }}>Register</Link>
                        </p>
                    </form>
                </Card>
            </div>
        </div>
    );
};
