import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';

export const RegistrationSuccess = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '500px', textAlign: 'center' }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <CheckCircle size={64} color="var(--color-success)" />
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>Registration Successful!</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>
                        Your account has been created successfully. You can now log in to access your dashboard.
                    </p>
                    <Link to="/login">
                        <Button variant="primary" style={{ width: '100%' }}>Go to Login</Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
};
