import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, IndianRupee, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { jobService, type JobApplication } from '../../services/jobService';

export const MyApplications = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const profile = await authService.getProfile();
        if (profile.user.account_status !== 'VERIFIED') {
          navigate('/dashboard/employee');
          return;
        }
        const data = await jobService.getEmployeeApplications();
        setApplications(data);
      } catch {
        navigate('/dashboard/employee');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchApplications();
  }, [navigate]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading applications...</div>;
  }

  return (
    <div className="container page-content">
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-highlight)', marginBottom: '0.7rem' }}>
          <ArrowLeft size={16} /> Back to jobs
        </Link>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
          My Applications
        </h1>
        <p className="section-subtitle">Track your application progress for jobs you applied to.</p>
      </div>

      {applications.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
            <Briefcase size={40} style={{ margin: '0 auto 0.65rem', opacity: 0.35 }} />
            <p style={{ marginBottom: '0.75rem' }}>You have not applied for any jobs yet.</p>
            <Link to="/jobs">
              <Button>Browse Jobs</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="stack">
          {applications.map((application, index) => (
            <motion.div key={application.application_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.8rem', minWidth: '220px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: 'var(--color-highlight)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.2rem' }}>{application.title}</h3>
                      <p className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.28rem', marginBottom: '0.35rem' }}>
                        <Building2 size={13} /> {application.organization_name}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span className="ui-pill" style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--color-text-main)' }}>
                          <MapPin size={12} /> {application.location}
                        </span>
                        <span className="ui-pill" style={{ background: 'rgba(148,163,184,0.1)', color: 'var(--color-text-main)' }}>
                          <IndianRupee size={12} /> {application.salary_range}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem' }}>
                    <span
                      className="ui-pill"
                      style={{
                        background: 'rgba(56, 189, 248, 0.12)',
                        color: 'var(--color-highlight)',
                      }}
                    >
                      {application.status}
                    </span>
                    <span className="section-subtitle" style={{ fontSize: '0.82rem' }}>
                      Applied {new Date(application.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
