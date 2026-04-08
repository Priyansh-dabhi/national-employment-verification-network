import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { jobService } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, IndianRupee, Building2, Calendar, CheckCircle } from 'lucide-react';

export const JobDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [applyStatus, setApplyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const profile = await authService.getProfile();

        if (profile.user.account_status !== 'VERIFIED') {
          navigate('/dashboard/employee');
          return;
        }

        if (id) {
          const jobs = await jobService.getAllJobs();
          const foundJob = jobs.find((currentJob) => currentJob.id === Number(id));
          if (foundJob) {
            setJob(foundJob);
          } else {
            navigate('/jobs');
          }
        }
      } catch (error) {
        console.error('Failed to fetch job', error);
        navigate('/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJob();
  }, [id, navigate]);

  const handleApply = async () => {
    if (!job) return;
    setIsApplying(true);
    setApplyError(null);

    try {
      await jobService.applyForJob(job.id);
      setApplyStatus('success');
    } catch (error) {
      console.error('Apply failed', error);
      setApplyStatus('error');
      setApplyError(error instanceof Error ? error.message : 'Failed to apply for the job.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading job details...</div>;
  }

  if (!job) return null;

  return (
    <div className="container page-content">
      <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-highlight)', marginBottom: '1.3rem', fontWeight: 700 }}>
        <ArrowLeft size={15} /> Back to Job Feed
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
        <Card style={{ padding: '1.4rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1.1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '12px',
                background: 'rgba(56, 189, 248, 0.12)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--color-highlight)',
              }}
            >
              <Building2 size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.15rem' }}>{job.title}</h1>
              <p className="muted">{job.organization_name}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
            <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <MapPin size={14} /> {job.location}
            </p>
            <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <IndianRupee size={14} /> {job.salary_range}
            </p>
            <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} /> Posted {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>

          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.65rem' }}>Job Description</h3>
          <p className="muted" style={{ whiteSpace: 'pre-line' }}>
            {job.description}
          </p>
        </Card>

        <Card style={{ padding: '1.2rem', height: 'fit-content' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.55rem' }}>Ready to Apply?</h3>
          <p className="muted" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
            Your verified profile details are securely shared with this employer.
          </p>

          {applyStatus === 'success' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem', padding: '0.9rem', background: 'rgba(34, 197, 94, 0.11)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
              <CheckCircle size={28} />
              <span style={{ fontWeight: 700 }}>Successfully Applied</span>
            </div>
          ) : (
            <>
              <Button onClick={handleApply} disabled={isApplying} style={{ width: '100%' }}>
                {isApplying ? 'Applying...' : <>Apply Now <Briefcase size={16} /></>}
              </Button>
              {applyError ? <p style={{ marginTop: '0.6rem', color: '#fecaca', fontSize: '0.82rem' }}>{applyError}</p> : null}
            </>
          )}

          <div style={{ marginTop: '1.1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--glass-border)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <CheckCircle size={13} color="var(--color-success)" /> Verified employer
          </div>
        </Card>
      </div>
    </div>
  );
};