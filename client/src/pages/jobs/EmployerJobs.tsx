import { type FormEvent, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { employerService } from '../../services/employerService';
import { jobService } from '../../services/jobService';
import type { Job } from '../../services/jobService';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase, MapPin, IndianRupee, Users, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmployerLayout } from '../employer/EmployerLayout';

export const EmployerJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profile = await employerService.getProfile();
        const status = String(profile.profile?.account_status || 'UNVERIFIED');

        if (status === 'VERIFIED') {
          setIsVerified(true);
          const fetchedJobs = await jobService.getEmployerJobs();
          setJobs(fetchedJobs);
        } else {
          setIsVerified(false);
        }
      } catch (error) {
        console.error('Failed to fetch jobs or profile', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [navigate]);

  const handlePostJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const newJob = await jobService.createJob({
        title,
        description,
        location,
        salary_range: salaryRange,
      });

      setJobs((previousJobs) => [newJob, ...previousJobs]);
      setIsPostModalOpen(false);
      setTitle('');
      setDescription('');
      setLocation('');
      setSalaryRange('');
    } catch (error) {
      console.error('Failed to post job', error);
      setFormError(error instanceof Error ? error.message : 'Failed to post job. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <EmployerLayout>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem', color: 'var(--color-text-muted)' }}>Loading jobs...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '0.8rem', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: '1.7rem', fontWeight: 700, marginBottom: '0.25rem' }}>Job Postings</h1>
            <p className="muted">Manage job postings and track applicants.</p>
          </div>
          {isVerified ? <Button onClick={() => setIsPostModalOpen(true)}>Post New Job</Button> : null}
        </div>

        {!isVerified ? (
          <div
            style={{
              padding: '1rem 1.2rem',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: 'var(--color-warning)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={22} />
            <div>
              <p style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Verification Required</p>
              <p className="muted" style={{ fontSize: '0.86rem' }}>
                Your company must be verified before posting jobs and recruiting candidates.
              </p>
            </div>
          </div>
        ) : (
          <div className="stack" style={{ gap: '0.8rem' }}>
            {jobs.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                  <Briefcase size={42} style={{ margin: '0 auto 0.7rem', opacity: 0.45 }} />
                  <p style={{ fontSize: '1.02rem', marginBottom: '0.85rem' }}>You have not posted any jobs yet.</p>
                  <Button onClick={() => setIsPostModalOpen(true)}>Post Your First Job</Button>
                </div>
              </Card>
            ) : (
              jobs.map((job, index) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card style={{ padding: '1.15rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '240px', flex: 1 }}>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>{job.title}</h3>
                        <div style={{ display: 'flex', gap: '1rem', color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '0.7rem', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <MapPin size={13} /> {job.location}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                            <IndianRupee size={13} /> {job.salary_range}
                          </span>
                          {job.applications_count !== undefined ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--color-highlight)' }}>
                              <Users size={13} /> {job.applications_count} Applicants
                            </span>
                          ) : null}
                        </div>
                        <p className="muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.6rem' }}>
                        <span className="muted" style={{ fontSize: '0.78rem' }}>
                          Posted {new Date(job.created_at).toLocaleDateString()}
                        </span>
                        <Link to={`/employer/jobs/${job.id}/applicants`}>
                          <Button variant="outline" size="sm">
                            <Users size={14} /> View Applicants
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}

        <Modal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} title="Post a New Job">
          <form onSubmit={handlePostJob} className="stack" style={{ gap: '0.8rem' }}>
            <Input label="Job Title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Software Engineer" required />

            <div>
              <label className="field-label">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="field-control"
                style={{ minHeight: '120px', resize: 'vertical' }}
                placeholder="Detailed job description"
                required
              />
            </div>

            <div className="grid-2" style={{ gap: '0.8rem' }}>
              <Input label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Remote, Mumbai" required />
              <Input label="Salary Range" value={salaryRange} onChange={(event) => setSalaryRange(event.target.value)} placeholder="e.g. 5-10 LPA" required />
            </div>

            {formError ? <div className="ui-alert ui-alert--error">{formError}</div> : null}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.7rem' }}>
              <Button type="button" variant="outline" onClick={() => setIsPostModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Post Job
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </EmployerLayout>
  );
};
