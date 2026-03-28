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
        const fetchProfileAndJobs = async () => {
            try {
                const profile = await authService.getProfile();
                
                if (profile.user.account_status !== 'VERIFIED') {
                    navigate('/dashboard/employee');
                    return;
                }

                const fetchedJobs = await jobService.getAllJobs();
                setJobs(fetchedJobs);
            } catch (error) {
                console.error("Failed to fetch jobs or profile", error);
                navigate('/dashboard/employee');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileAndJobs();
    }, [navigate]);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading job feed...</div>;
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Feed</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Discover positions from verified employers.</p>
                </div>
                <Link to="/my-applications">
                    <Button variant="outline">My Applications</Button>
                </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {jobs.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No jobs available right now.</p>
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
                            <Card style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', width: '100%' }}>
                                    <div style={{ 
                                        width: '60px', 
                                        height: '60px', 
                                        borderRadius: 'var(--radius-md)', 
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: 'var(--color-highlight)',
                                        flexShrink: 0
                                    }}>
                                        <Briefcase size={28} />
                                    </div>
                                    <div style={{ flexGrow: 1 }}>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.25rem' }}>{job.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                                            <Building2 size={16} /> 
                                            <span style={{ fontWeight: 500 }}>{job.organization_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={16} /> {job.location}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IndianRupee size={16} /> {job.salary_range}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', height: '100%' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                                            {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                        <Link to={`/jobs/${job.id}`}>
                                            <Button>View Details</Button>
                                        </Link>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
