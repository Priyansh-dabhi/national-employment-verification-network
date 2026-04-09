import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  ClipboardList,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

type EmployerProfile = {
  organization_name?: string;
  industry_sector?: string;
  org_type?: string;
  authorized_person_name?: string;
  designation?: string;
  city?: string;
  state?: string;
  account_status?: string;
};

export const EmployerDashboardPage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<EmployerProfile | null>(null);
  const [stats, setStats] = useState({ employees: 0, verified: 0, requests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const profileData = await employerService.getProfile();
        setProfile(profileData.profile);

        const [empData, verifiedData, reqData] = await Promise.allSettled([
          employerService.getCompanyEmployees(),
          employerService.getVerifiedEmployees(),
          employerService.getVerificationRequests(),
        ]);

        setStats({
          employees: empData.status === 'fulfilled' ? empData.value.employees?.length || 0 : 0,
          verified: verifiedData.status === 'fulfilled' ? verifiedData.value.employees?.length || 0 : 0,
          requests: reqData.status === 'fulfilled' ? reqData.value.requests?.length || 0 : 0,
        });
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
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem', color: 'var(--color-text-muted)' }}>
          Loading dashboard...
        </div>
      </EmployerLayout>
    );
  }

  const statusMeta: Record<string, { bg: string; border: string; color: string; message: string }> = {
    VERIFIED: {
      bg: 'rgba(34, 197, 94, 0.12)',
      border: 'rgba(34, 197, 94, 0.35)',
      color: 'var(--color-success)',
      message: 'Your company is verified. You can manage employees and post jobs.',
    },
    PENDING: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      color: 'var(--color-warning)',
      message: 'Your verification request is under review by the NEVN authority team.',
    },
    REJECTED: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      color: 'var(--color-error)',
      message: 'Verification was rejected. Upload revised documents and apply again.',
    },
    UNVERIFIED: {
      bg: 'rgba(148, 163, 184, 0.12)',
      border: 'rgba(148, 163, 184, 0.35)',
      color: 'var(--color-text-muted)',
      message: 'Complete company verification to unlock all employer features.',
    },
  };

  const currentStatus = profile?.account_status || 'UNVERIFIED';
  const status = statusMeta[currentStatus] || statusMeta.UNVERIFIED;

  const statCards = [
    { label: 'Total Employees', value: stats.employees, icon: Users, color: '#6366f1' },
    { label: 'Verified Employees', value: stats.verified, icon: BadgeCheck, color: 'var(--color-success)' },
    { label: 'Verification Requests', value: stats.requests, icon: ClipboardList, color: 'var(--color-warning)' },
  ];

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.3rem' }}>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
            Welcome back, {profile?.authorized_person_name || 'Employer'}
          </h1>
          <p className="section-subtitle">Track verification, employees, and recruitment from one dashboard.</p>
        </div>

        <Card
          style={{
            marginBottom: '1.2rem',
            background: status.bg,
            border: `1px solid ${status.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={20} color={status.color} />
            <div>
              <p style={{ fontWeight: 700, color: status.color, marginBottom: '0.2rem' }}>Company Status: {currentStatus}</p>
              <p className="section-subtitle">{status.message}</p>
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: `${color}22`,
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <Icon size={20} color={color} />
                </div>
                <div>
                  <p style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{value}</p>
                  <p className="section-subtitle">{label}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem' }}>
            <Building2 size={20} color="var(--color-accent)" />
            <h2 style={{ fontWeight: 700 }}>Company Overview</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem' }}>
            {[
              { label: 'Organization', value: profile?.organization_name },
              { label: 'Industry', value: profile?.industry_sector },
              { label: 'Type', value: profile?.org_type },
              { label: 'Authorized Person', value: profile?.authorized_person_name },
              { label: 'Designation', value: profile?.designation },
              { label: 'Location', value: profile ? `${profile.city || '-'}, ${profile.state || '-'}` : '-' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  padding: '0.8rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>{label}</p>
                <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{value || '-'}</p>
              </div>
            ))}
          </div>
        </Card>

        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <TrendingUp size={16} color="var(--color-text-muted)" />
          <span className="section-subtitle">Quick actions</span>
          <Button variant="outline" size="sm" onClick={() => navigate('/employer/company-verification')}>
            Company Verification
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/employer/employees')}>
            Manage Employees
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/employer/verification-requests')}>
            View Requests
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/employer/jobs')}>
            Job Postings
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/employer/candidates')}>
            Discover Candidates
          </Button>
        </div>
      </div>
    </EmployerLayout>
  );
};
