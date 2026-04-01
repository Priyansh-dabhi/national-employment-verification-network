import { useState, useEffect } from 'react';
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
    
    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [salaryRange, setSalaryRange] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        const fetchProfileAndJobs = async () => {
            try {
                const data = await employerService.getProfile();
                const status = data.profile?.account_status;
                
                if (status === 'VERIFIED') {
                    setIsVerified(true);
                    const fetchedJobs = await jobService.getEmployerJobs();
                    setJobs(fetchedJobs);
                } else {
                    setIsVerified(false);
                }
            } catch (error) {
                console.error("Failed to fetch jobs or profile", error);
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileAndJobs();
    }, [navigate]);

    const handlePostJob = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const newJob = await jobService.createJob({
                title, description, location, salary_range: salaryRange
            });
            setJobs([newJob, ...jobs]);
            setIsPostModalOpen(false);
            setTitle('');
            setDescription('');
            setLocation('');
            setSalaryRange('');
        } catch (error) {
            console.error("Failed to post job", error);
            alert("Failed to post job. Please try again.");
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.25rem' }}>Job Postings</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Manage jobs and view applicants.</p>
                    </div>
                    {isVerified && <Button onClick={() => setIsPostModalOpen(true)}>Post New Job</Button>}
                </div>

                {!isVerified ? (
                    <div style={{
                        padding: '1.5rem', borderRadius: 'var(--radius-lg)', background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.2)', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '1rem',
                    }}>
                        <AlertTriangle size={24} />
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.25rem' }}>Verification Required</p>
                            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Your company must be VERIFIED to post jobs and recruit candidates. Please complete Company Verification first.</p>
                        </div>
                    </div>
                ) : (
                    <>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>You haven't posted any jobs yet.</p>
                            <Button onClick={() => setIsPostModalOpen(true)}>Post Your First Job</Button>
                        </div>
                    </Card>
                ) : (
                    jobs.map((job, index) => (
                        <motion.div
                            key={job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.5rem' }}>{job.title}</h3>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={16} /> {job.location}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IndianRupee size={16} /> {job.salary_range}
                                            </span>
                                            {job.applications_count !== undefined && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-highlight)' }}>
                                                    <Users size={16} /> {job.applications_count} Applicants
                                                </span>
                                            )}
                                        </div>
                                        <p style={{ color: 'var(--color-text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {job.description}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                        <Link to={`/employer/jobs/${job.id}/applicants`}>
                                            <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <Users size={16} /> View Applicants
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>

            <Modal
                isOpen={isPostModalOpen}
                onClose={() => setIsPostModalOpen(false)}
                title="Post a New Job"
            >
                <form onSubmit={handlePostJob} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Input 
                        label="Job Title" 
                        value={title} 
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
                        placeholder="e.g. Software Engineer" 
                        required 
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 500 }}>Description</label>
                        <textarea 
                            value={description}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                            style={{ 
                                padding: '0.75rem', 
                                borderRadius: 'var(--radius-md)', 
                                border: '1px solid var(--glass-border)', 
                                background: 'rgba(255, 255, 255, 0.05)', 
                                color: 'inherit',
                                minHeight: '120px',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Detailed job description..."
                            required
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <Input 
                            label="Location" 
                            value={location} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)} 
                            placeholder="e.g. Remote, Mumbai" 
                            required 
                        />
                        <Input 
                            label="Salary Range" 
                            value={salaryRange} 
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalaryRange(e.target.value)} 
                            placeholder="e.g. 5-10 LPA" 
                            required 
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => setIsPostModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Posting...' : 'Post Job'}
                        </Button>
                    </div>
                </form>
            </Modal>
            </>
            )}
            </div>
        </EmployerLayout>
    );
};
