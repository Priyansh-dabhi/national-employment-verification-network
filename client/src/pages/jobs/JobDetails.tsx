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
    const [applyStatus, setApplyStatus] = useState<string>('idle');

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
                    const foundJob = jobs.find((j: Job) => j.id === parseInt(id));
                    if (foundJob) {
                        setJob(foundJob);
                    } else {
                        navigate('/jobs');
                    }
                }
            } catch (error) {
                console.error("Failed to fetch job", error);
                navigate('/jobs');
            } finally {
                setIsLoading(false);
            }
        };
        fetchJob();
    }, [id, navigate]);

    const handleApply = async () => {
        if (!job) return;
        setIsApplying(true);
        try {
            await jobService.applyForJob(job.id);
            setApplyStatus('success');
        } catch (error: any) {
            console.error("Apply failed", error);
            if (error.response?.status === 400) {
                 alert("You have already applied for this job.");
            } else {
                setApplyStatus('error');
                alert("Failed to apply for job. Please try again later.");
            }
        } finally {
            setIsApplying(false);
        }
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading job details...</div>;
    }

    if (!job) return null;

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-highlight)', marginBottom: '2rem', textDecoration: 'none', fontWeight: 500 }}>
                <ArrowLeft size={16} /> Back to Job Feed
            </Link>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div>
                    <Card style={{ padding: '2rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: 'var(--radius-md)', 
                                background: 'rgba(56, 189, 248, 0.1)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: 'var(--color-highlight)' 
                            }}>
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{job.title}</h1>
                                <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)' }}>{job.organization_name}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                <MapPin size={18} /> <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{job.location}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                <IndianRupee size={18} /> <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{job.salary_range}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
                                <Calendar size={18} /> <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div>
                            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '1rem' }}>Job Description</h3>
                            <div style={{ color: 'var(--color-text-muted)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                {job.description}
                            </div>
                        </div>
                    </Card>
                </div>

                <div>
                    <Card style={{ position: 'sticky', top: '120px', padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1rem' }}>Ready to Apply?</h3>
                        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Your verified profile details will be shared securely with this employer.
                        </p>
                        
                        {applyStatus === 'success' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)' }}>
                                <CheckCircle size={32} />
                                <span style={{ fontWeight: 600 }}>Successfully Applied</span>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleApply} 
                                disabled={isApplying || applyStatus === 'success'}
                                style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                            >
                                {isApplying ? 'Applying...' : <>Apply Now <Briefcase size={18} /></>}
                            </Button>
                        )}
                        
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={14} color="var(--color-success)" />
                            <span>This is a verified employer.</span>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
