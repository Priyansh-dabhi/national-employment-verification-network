import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, MapPin, Phone, User } from 'lucide-react';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Card } from '../../components/ui/Card';

type EmployerProfile = {
  organization_name?: string;
  org_type?: string;
  industry_sector?: string;
  authorized_person_name?: string;
  designation?: string;
  email?: string;
  city?: string;
  state?: string;
  account_status?: string;
  created_at?: string;
};

export const EmployerProfilePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await employerService.getProfile();
        setProfile(data.profile);
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading profile...</div>
      </EmployerLayout>
    );
  }

  const statusStyles: Record<string, { bg: string; text: string; border: string }> = {
    VERIFIED: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    PENDING: { bg: 'rgba(234,179,8,0.1)', text: '#eab308', border: 'rgba(234,179,8,0.2)' },
    UNVERIFIED: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8', border: 'rgba(148,163,184,0.2)' },
    REJECTED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', border: 'rgba(239,68,68,0.2)' },
  };
  const status = statusStyles[profile?.account_status || 'UNVERIFIED'] || statusStyles.UNVERIFIED;

  const fields = [
    { icon: Building2, label: 'Organization Name', value: profile?.organization_name },
    { icon: Building2, label: 'Organization Type', value: profile?.org_type },
    { icon: Building2, label: 'Industry Sector', value: profile?.industry_sector },
    { icon: User, label: 'Authorized Person', value: profile?.authorized_person_name },
    { icon: User, label: 'Designation', value: profile?.designation },
    { icon: Mail, label: 'Email', value: profile?.email },
    { icon: Phone, label: 'Mobile', value: 'Stored securely' },
    { icon: MapPin, label: 'City', value: profile?.city },
    { icon: MapPin, label: 'State', value: profile?.state },
  ];

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: '0.35rem' }}>
          Company Profile
        </h1>
        <p className="section-subtitle" style={{ marginBottom: '1.2rem' }}>
          Registered organization details used for verification and recruitment.
        </p>

        <div
          className="ui-pill"
          style={{
            background: status.bg,
            color: status.text,
            border: `1px solid ${status.border}`,
            marginBottom: '1rem',
          }}
        >
          <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: status.text }} />
          Account Status: {profile?.account_status || 'UNVERIFIED'}
        </div>

        <Card style={{ overflow: 'hidden', padding: 0 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(244, 194, 75, 0.16))',
              padding: '1.5rem',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'var(--color-accent)',
                color: '#000',
                fontSize: '1.6rem',
                fontWeight: 700,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {(profile?.organization_name || 'E').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{profile?.organization_name || 'Organization'}</h2>
              <p className="section-subtitle">
                {profile?.industry_sector || 'Industry'} - {profile?.org_type || 'Type'}
              </p>
              <p className="section-subtitle">
                Member since {profile?.created_at ? new Date(profile.created_at).getFullYear() : '-'}
              </p>
            </div>
          </div>

          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.8rem' }}>
              {fields.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  style={{
                    padding: '0.9rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
                    <Icon size={14} color="var(--color-text-muted)" />
                    <p style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</p>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.94rem' }}>{value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </EmployerLayout>
  );
};
