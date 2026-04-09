import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { jobService } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, Building2, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export const JobFeed = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const profile = await authService.getProfile();

        if (profile.user.account_status !== 'VERIFIED') {
          navigate('/dashboard/employee');
          return;
        }

        const fetchedJobs = await jobService.getAllJobs();
        setJobs(fetchedJobs);
      } catch (error) {
        console.error('Failed to fetch jobs', error);
        navigate('/dashboard/employee');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchJobs();
  }, [navigate]);

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading job feed...</div>;
  }

  return (
    <div className="container page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.4rem', gap: '0.8rem', flexWrap: 'wrap' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>Job Feed</h1>
          <p className="muted">Discover opportunities from verified employers.</p>
        </div>
        <Link to="/my-applications">
          <Button variant="outline">My Applications</Button>
        </Link>
      </div>

      <div className="stack" style={{ gap: '0.8rem' }}>
        {jobs.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '2.4rem', color: 'var(--color-text-muted)' }}>
              <Search size={42} style={{ margin: '0 auto 0.8rem', opacity: 0.45 }} />
              <p style={{ fontSize: '1.05rem' }}>No jobs available right now.</p>
            </div>
          </Card>
        ) : (
          jobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card style={{ padding: '1.2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.85rem', flex: 1, minWidth: '240px' }}>
                  <span
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'rgba(56, 189, 248, 0.12)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-highlight)',
                      flexShrink: 0,
                    }}
                  >
                    <Briefcase size={22} />
                  </span>

                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.16rem', fontWeight: 700, marginBottom: '0.2rem' }}>{job.title}</h3>
                    <p className="muted" style={{ marginBottom: '0.55rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Building2 size={14} /> {job.organization_name}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.86rem', flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <MapPin size={14} /> {job.location}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <IndianRupee size={14} /> {job.salary_range}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>{new Date(job.created_at).toLocaleDateString()}</span>
                  <Link to={`/jobs/${job.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};