import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { DocumentReviewModal } from './DocumentReviewModal';
import { ShieldAlert, LogOut, CheckCircle, AlertCircle, XCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export const AdminDashboard = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await adminService.getReviewDocuments();
            setSummary(data.summary);
            setDocuments(data.documents);
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

    const handleLogout = () => {
        adminService.logout();
        navigate('/admin-login');
    };

    const getStatusChip = (status: string) => {
        switch(status) {
            case 'VERIFIED':
                return <span className="admin-chip admin-chip-verified"><CheckCircle size={14}/> Verified</span>;
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
            {/* Header */}
            <header className="admin-header">
                <div className="admin-header-container">
                    <div className="admin-header-logo">
                        <div className="admin-header-icon">
                            <ShieldAlert size={20} />
                        </div>
                        <h1 className="admin-header-title">NEVN Central Authority</h1>
                    </div>
                    <button onClick={handleLogout} className="admin-logout-btn">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            <main className="admin-main">
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

                {/* Table */}
                <div className="admin-table-container">
                    <div className="admin-table-header">
                        <h2 className="admin-table-title">Review Queue</h2>
                        <div className="admin-table-subtitle">Sorted by Oldest First</div>
                    </div>
                    
                    <div className="admin-table-wrapper">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Document ID</th>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>Submission Date</th>
                                    <th>Status</th>
                                    <th>Auto Score</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                                            <Loader2 size={24} style={{ margin: '0 auto 0.5rem auto', animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                                            Loading Queue...
                                        </td>
                                    </tr>
                                ) : documents.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b', background: 'rgba(248, 250, 252, 0.5)' }}>
                                            No documents require manual review at this time.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc: any, idx: number) => (
                                        <tr key={idx}>
                                            <td>#{doc.documentId}</td>
                                            <td>
                                                <span className="admin-table-cell-name">{doc.userName}</span> 
                                                <span className="admin-table-cell-role">({doc.userRole})</span>
                                            </td>
                                            <td className="admin-table-cell-type">{doc.documentType}</td>
                                            <td className="admin-table-cell-date">{new Date(doc.uploadedAt).toLocaleString()}</td>
                                            <td>{getStatusChip(doc.status)}</td>
                                            <td className="admin-table-cell-score">{doc.score || '-'}</td>
                                            <td>
                                                <button 
                                                    onClick={() => setSelectedDocId(doc.documentId)}
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

            {selectedDocId && (
                <DocumentReviewModal 
                    documentId={selectedDocId} 
                    onClose={() => setSelectedDocId(null)} 
                    onActionCompleted={fetchData} 
                />
            )}
        </div>
    );
};
