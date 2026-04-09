import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { DocumentReviewModal } from './DocumentReviewModal';
import { ShieldAlert, CheckCircle, AlertCircle, XCircle, Loader2, Blocks } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import './Admin.css';

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
    const [employerDocs, setEmployerDocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoc, setSelectedDoc] = useState<{ id: string; role: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'EMPLOYEE' | 'EMPLOYER'>('EMPLOYEE');

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await adminService.getReviewDocuments();
            setSummary(data.summary);
            setEmployeeDocs(data.employeeDocuments || []);
            setEmployerDocs(data.employerDocuments || []);
        } catch (err: any) {
            console.error(err);
            if (err.message.includes('No token') || err.message.includes('Forbidden')) {
                adminService.logout();
                navigate('/admin-login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getStatusChip = (status: string) => {
        switch(status) {
            case 'VERIFIED':
                return <span className="admin-chip admin-chip-verified"><CheckCircle size={14}/> Verified</span>;
            case 'PROCESSING':
                return <span className="admin-chip admin-chip-info" style={{background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8'}}><Loader2 size={14} className="admin-spin" /> Processing</span>;
            case 'UNDER_REVIEW':
            case 'PENDING':
                return <span className="admin-chip admin-chip-review admin-pulse"><AlertCircle size={14} /> Review</span>;
            case 'REJECTED':
            case 'REUPLOAD_REQUIRED':
                return <span className="admin-chip admin-chip-rejected"><XCircle size={14}/> Rejected</span>;
            default:
                return <span className="admin-chip admin-chip-default">{status}</span>;
        }
    };

    return (
        <div className="admin-dash-bg">
            <main className="admin-main">
                <section className="admin-hero" style={{ justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div className="admin-hero__icon">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h1 className="admin-hero__title">NEVN Central Authority</h1>
                            <p className="admin-hero__subtitle">Review employee and employer verification queues from the central admin portal.</p>
                        </div>
                    </div>
                    <Link to="/admin/audit-timeline" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0.55rem 1.1rem', borderRadius: '0.6rem',
                        background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
                        color: '#4338ca', fontWeight: 600, fontSize: '0.85rem',
                        border: '1px solid #c7d2fe', textDecoration: 'none',
                        boxShadow: '0 1px 3px rgba(67,56,202,0.1)', transition: 'all 0.2s'
                    }}>
                        <Blocks size={16} /> Mock Blockchain Ledger
                    </Link>
                </section>

                {/* Metrics */}
                <div className="admin-metrics-grid">
                    <div className="admin-metric-card">
                        <p className="admin-metric-label">Total Docs</p>
                        <p className="admin-metric-value">{summary?.total || 0}</p>
                    </div>
                    <div className="admin-metric-card verified">
                        <p className="admin-metric-label">Verified</p>
                        <p className="admin-metric-value">{summary?.verified || 0}</p>
                    </div>
                    <div className="admin-metric-card review">
                        <div className="admin-metric-glow"></div>
                        <p className="admin-metric-label">Under Review</p>
                        <p className="admin-metric-value admin-animate-bounce">{summary?.underReview || 0}</p>
                    </div>
                    <div className="admin-metric-card rejected">
                        <p className="admin-metric-label">Rejected</p>
                        <p className="admin-metric-value">{summary?.rejected || 0}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0 1rem' }}>
                    <button 
                        onClick={() => setActiveTab('EMPLOYEE')}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                            background: activeTab === 'EMPLOYEE' ? '#38bdf8' : '#1e293b',
                            color: activeTab === 'EMPLOYEE' ? '#0f172a' : '#cbd5e1',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        Employee Reviews ({employeeDocs.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('EMPLOYER')}
                        style={{
                            padding: '0.75rem 1.5rem', borderRadius: '8px', fontWeight: 600,
                            background: activeTab === 'EMPLOYER' ? '#38bdf8' : '#1e293b',
                            color: activeTab === 'EMPLOYER' ? '#0f172a' : '#cbd5e1',
                            border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                        }}
                    >
                        Employer Reviews ({employerDocs.length})
                    </button>
                </div>

                {/* Table */}
                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <h2 className="admin-table-title">{activeTab === 'EMPLOYEE' ? 'Employee Queue' : 'Employer Queue'}</h2>
                        <div className="admin-table-subtitle">Sorted by Oldest First</div>
                    </div>
                    
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Document ID</th>
                                    <th>{activeTab === 'EMPLOYEE' ? 'Applicant Name' : 'Organization Name'}</th>
                                    <th>Type</th>
                                    <th>Submission Date</th>
                                    <th>Status</th>
                                    {activeTab === 'EMPLOYEE' && <th>Auto Score</th>}
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={activeTab === 'EMPLOYEE' ? 7 : 6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            <Loader2 size={24} style={{ margin: '0 auto 0.5rem auto', animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                                            Loading Queue...
                                        </td>
                                    </tr>
                                ) : (activeTab === 'EMPLOYEE' ? employeeDocs : employerDocs).length === 0 ? (
                                    <tr>
                                        <td colSpan={activeTab === 'EMPLOYEE' ? 7 : 6} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', background: 'rgba(248, 250, 252, 0.5)' }}>
                                            No {activeTab.toLowerCase()} documents require manual review at this time.
                                        </td>
                                    </tr>
                                ) : (
                                    (activeTab === 'EMPLOYEE' ? employeeDocs : employerDocs).map((doc: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>#{doc.documentId}</td>
                                            <td>
                                                <span className="admin-table-cell-name">{doc.userName}</span> 
                                            </td>
                                            <td className="admin-table-cell-type">{doc.documentType}</td>
                                            <td className="admin-table-cell-date">{new Date(doc.uploadedAt).toLocaleString()}</td>
                                            <td>{getStatusChip(doc.status)}</td>
                                            {activeTab === 'EMPLOYEE' && <td className="admin-table-cell-score">{doc.score || '-'}</td>}
                                            <td>
                                                <button 
                                                    onClick={() => setSelectedDoc({ id: doc.documentId, role: doc.userRole })}
                                                    className="admin-action-btn"
                                                >
                                                    {doc.status === 'UNDER_REVIEW' || doc.status === 'PENDING' ? 'Review Now' : 'View File'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {selectedDoc && (
                <DocumentReviewModal 
                    documentId={selectedDoc.id} 
                    userRole={selectedDoc.role}
                    onClose={() => setSelectedDoc(null)} 
                    onActionCompleted={fetchData} 
                />
            )}
        </div>
    );
};
