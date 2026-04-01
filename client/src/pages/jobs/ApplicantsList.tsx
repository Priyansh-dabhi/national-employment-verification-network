import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { employerService } from '../../services/employerService';
import { jobService } from '../../services/jobService';
import type { JobApplicant } from '../../services/jobService';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Mail, Calendar, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { EmployerLayout } from '../employer/EmployerLayout';

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

                if (id) {
                    const data = await jobService.getJobApplicants(parseInt(id));
                    setApplicants(data);
                }
            } catch (error) {
                console.error("Failed to fetch applicants", error);
                navigate('/employer/jobs');
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplicants();
    }, [id, navigate]);

    if (isLoading) {
        return (
            <EmployerLayout>
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '5rem', color: 'var(--color-text-muted)' }}>Loading applicants...</div>
            </EmployerLayout>
        );
    }

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <Link to="/employer/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-highlight)', marginBottom: '1rem', textDecoration: 'none', fontWeight: 500 }}>
                        <ArrowLeft size={16} /> Back to Job Postings
                    </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Applicants</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Review verified candidates who applied for this position.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applicants.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <User size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '1.2rem' }}>No pending applications yet.</p>
                            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>When verified employees apply, they will appear here.</p>
                        </div>
                    </Card>
                ) : (
                    applicants.map((applicant, index) => (
                        <motion.div
                            key={applicant.application_id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        borderRadius: '50%', 
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: 'var(--color-highlight)' 
                                    }}>
                                        <User size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {applicant.name}
                                            {applicant.account_status === 'VERIFIED' && (
                                                <CheckCircle size={16} color="var(--color-success)" />
                                            )}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Mail size={14} /> {applicant.email}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} /> Applied on {new Date(applicant.applied_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {applicant.application_status}
                                    </span>
                                    <Button variant="outline" size="sm">View Profile</Button>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
            </div>
        </EmployerLayout>
    );
};
