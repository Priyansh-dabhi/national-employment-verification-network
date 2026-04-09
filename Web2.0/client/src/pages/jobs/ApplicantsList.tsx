import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle, Mail, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmployerLayout } from '../employer/EmployerLayout';
import { Card } from '../../components/ui/Card';
import { employerService } from '../../services/employerService';
import { jobService, type JobApplicant } from '../../services/jobService';

export const ApplicantsList = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const data = await employerService.getProfile();
        if (data.profile?.account_status !== 'VERIFIED') {
          navigate('/employer/jobs');
          return;
        }

        if (!id) {
          navigate('/employer/jobs');
          return;
        }

        const records = await jobService.getJobApplicants(Number(id));
        setApplicants(records);
      } catch {
        navigate('/employer/jobs');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchApplicants();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <EmployerLayout>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '3rem', color: 'var(--color-text-muted)' }}>Loading applicants...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <Link to="/employer/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-highlight)', marginBottom: '0.8rem' }}>
          <ArrowLeft size={16} /> Back to job postings
        </Link>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
          Applicants
        </h1>
        <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
          Review candidates who applied for this position.
        </p>

        {applicants.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
              <User size={38} style={{ margin: '0 auto 0.6rem', opacity: 0.35 }} />
              <p>No applications yet.</p>
            </div>
          </Card>
        ) : (
          <div className="stack">
            {applicants.map((applicant, index) => (
              <motion.div key={applicant.application_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                <Card>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '220px' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '999px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: 'var(--color-highlight)',
                          display: 'grid',
                          placeItems: 'center',
                          fontWeight: 700,
                        }}
                      >
                        {applicant.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                          {applicant.name}
                          {applicant.account_status === 'VERIFIED' ? <CheckCircle size={14} color="var(--color-success)" /> : null}
                        </p>
                        <p className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={13} /> {applicant.email}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                      <span className="ui-pill" style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--color-success)' }}>
                        {applicant.application_status}
                      </span>
                      <span className="section-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} />
                        {new Date(applicant.applied_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};
