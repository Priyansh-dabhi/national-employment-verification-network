import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { ShieldAlert, KeyRound, Loader2, Eye, EyeOff } from 'lucide-react';
import './Admin.css';

export const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            await adminService.login(email, password);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-bg">
            <div className="admin-card">
                <div className="admin-icon-bg">
                    <ShieldAlert size={120} />
                </div>

                <div className="admin-form-container">
                    <div className="admin-icon-container">
                        <KeyRound className="admin-icon" />
                    </div>

                    <h2 className="admin-title">NEVN Admin</h2>
                    <p className="admin-subtitle">Secure system access for authorized personnel only.</p>

                    {error && (
                        <div className="admin-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="admin-form">
                        <div className="admin-input-group">
                            <label className="admin-label">SYSADMIN EMAIL</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input"
                                placeholder="admin@nevn.com"
                                required
                            />
                        </div>

                        <div className="admin-input-group">
                            <label className="admin-label">OATH KEY (PASSWORD)</label>
                            <div className="admin-password-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="admin-input"
                                    placeholder="************"
                                    required
                                />
                                <button
                                    type="button"
                                    className="admin-password-toggle"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="admin-button"
                        >
                            {isLoading ? <Loader2 className="admin-spinner" /> : 'Authenticate'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};
