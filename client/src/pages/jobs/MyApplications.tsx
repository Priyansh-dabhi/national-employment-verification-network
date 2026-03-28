import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { jobService } from '../../services/jobService';
import type { JobApplication } from '../../services/jobService';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, MapPin, IndianRupee, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

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
            } catch (error) {
                console.error("Failed to fetch applications", error);
                navigate('/dashboard/employee');
            } finally {
                setIsLoading(false);
            }
        };
        fetchApplications();
    }, [navigate]);

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading applications...</div>;
    }

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link to="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-highlight)', marginBottom: '1rem', textDecoration: 'none', fontWeight: 500 }}>
                    <ArrowLeft size={16} /> Back to Job Feed
                </Link>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Applications</h1>
                <p style={{ color: 'var(--color-text-muted)' }}>Track the status of jobs you've applied for.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {applications.length === 0 ? (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                            <Briefcase size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>You haven't applied to any jobs yet.</p>
                            <Link to="/jobs">
                                <Button>Browse Job Feed</Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    applications.map((app, index) => (
                        <motion.div
                            key={app.application_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem' }}>
                                    <div style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        borderRadius: 'var(--radius-md)', 
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center', 
                                        color: 'var(--color-highlight)',
                                        flexShrink: 0
                                    }}>
                                        <Briefcase size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.25rem' }}>{app.title}</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
                                            <Building2 size={16} /> 
                                            <span style={{ fontWeight: 500 }}>{app.organization_name}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <MapPin size={14} /> {app.location}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IndianRupee size={14} /> {app.salary_range}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                    <span style={{ 
                                        padding: '0.35rem 1rem', 
                                        borderRadius: '2rem', 
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        color: 'var(--color-highlight)', 
                                        fontSize: '0.85rem', 
                                        fontWeight: 600,
                                        display: 'inline-block'
                                    }}>
                                        {app.status}
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        Applied {new Date(app.applied_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </Card>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};
