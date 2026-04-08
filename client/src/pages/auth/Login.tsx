import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { useAuth } from '../../context/AuthContext';
import { adminService } from '../../services/adminService';

type LoginRole = 'employee' | 'employer' | 'admin';

export const Login = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [role, setRole] = useState<LoginRole>('employee');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (role === 'admin') {
        await adminService.login(email.trim(), password);
        navigate('/admin');
        return;
      }

      const user = await auth.login(email.trim(), password, role);
      if (user.role === 'employee') {
        navigate('/dashboard/employee');
        return;
      }
      if (user.role === 'employer') {
        navigate('/employer/dashboard');
        return;
      }
      setError('Unable to detect account role. Please try again.');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <aside className="auth-brand">
          <div>
            <span className="auth-brand__badge">
              <ShieldCheck size={14} />
              NEVN AUTH
            </span>
            <h1 className="auth-brand__title">
              Secure Employment Verification Powered by Blockchain
            </h1>
            <p className="auth-brand__desc">
              Government-grade trust for employees, employers, and administrators with secure, auditable records.
            </p>
          </div>
          <div className="auth-brand__meta">
            <div className="auth-brand__meta-item">
              <LockKeyhole size={15} />
              Encrypted identity and document verification flow
            </div>
            <div className="auth-brand__meta-item">
              <Building2 size={15} />
              Unified access for employer and authority portals
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <h2 className="auth-title">Sign In</h2>
          <p className="auth-subtitle">Access your NEVN workspace.</p>

          <div className="role-selector" role="tablist" aria-label="Select login role">
            <button
              type="button"
              className={`role-chip ${role === 'employee' ? 'active' : ''}`}
              onClick={() => setRole('employee')}
            >
              <UserRound size={14} />
              Employee
            </button>
            <button
              type="button"
              className={`role-chip ${role === 'employer' ? 'active' : ''}`}
              onClick={() => setRole('employer')}
            >
              <Building2 size={14} />
              Employer
            </button>
            <button
              type="button"
              className={`role-chip ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              <ShieldCheck size={14} />
              Admin
            </button>
          </div>

          <form className="stack" style={{ gap: '0.9rem' }} onSubmit={handleLogin} autoComplete="off">
            <input type="text" name="fake_username" autoComplete="username" style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="new-password" style={{ display: 'none' }} />

            <Input
              label="Email Address"
              name="login_email"
              type="email"
              autoComplete="email"
              placeholder="you@domain.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <PasswordInput
              label="Password"
              name="login_password"
              autoComplete="new-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error ? <div className="ui-alert ui-alert--error">{error}</div> : null}

            <Button type="submit" size="lg" fullWidth isLoading={loading}>
              Continue
            </Button>
          </form>

          <p style={{ marginTop: '0.95rem', color: 'var(--color-text-soft)', fontSize: '0.88rem', textAlign: 'center' }}>
            Need an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
