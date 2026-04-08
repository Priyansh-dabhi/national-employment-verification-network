import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CheckCircle } from 'lucide-react';

export const RegistrationSuccess = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1.4rem' }}>
      <div style={{ width: 'min(100%, 520px)', textAlign: 'center' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
              }}
            >
              <CheckCircle size={38} color="var(--color-success)" />
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, marginBottom: '0.55rem' }}>Registration Successful</h2>
          <p className="muted" style={{ marginBottom: '1.5rem' }}>
            Your account was created successfully. You can now sign in and continue verification.
          </p>
          <Link to="/login">
            <Button size="lg" style={{ width: '100%' }}>
              Go to Login
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};