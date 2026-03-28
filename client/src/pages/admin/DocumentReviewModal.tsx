import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { X, CheckCircle, XCircle, AlertTriangle, Loader2, FileText, ExternalLink } from 'lucide-react';
import './Admin.css';

interface DocumentReviewModalProps {
    documentId: string;
    onClose: () => void;
    onActionCompleted: () => void;
}

export const DocumentReviewModal = ({ documentId, onClose, onActionCompleted }: DocumentReviewModalProps) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Rejection Flow state
    const [actionState, setActionState] = useState<'IDLE' | 'CONFIRMING_REJECT' | 'CONFIRMING_REUPLOAD' | 'EXECUTING'>('IDLE');
    const [reason, setReason] = useState('');

    useEffect(() => {
        const fetchDoc = async () => {
            try {
                const result = await adminService.getDocumentById(documentId);
                setData(result);
            } catch (err: any) {
                setError(err.message || 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };
        fetchDoc();
    }, [documentId]);

    const executeAction = async (actionType: 'APPROVE' | 'REJECT' | 'REUPLOAD') => {
        if ((actionType === 'REJECT' || actionType === 'REUPLOAD') && actionState === 'IDLE') {
            setActionState(actionType === 'REJECT' ? 'CONFIRMING_REJECT' : 'CONFIRMING_REUPLOAD');
            return;
        }

        if ((actionType === 'REJECT' || actionType === 'REUPLOAD') && !reason.trim()) {
            setError('Please provide a reason for this decision.');
            return;
        }

        try {
            setActionState('EXECUTING');
            await adminService.adminAction(documentId, actionType, reason);
            onActionCompleted();
            onClose();
        } catch (err: any) {
            setError(err.message);
            setActionState('IDLE');
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className="admin-modal-container">
                
                {/* Header */}
                <div className="admin-modal-header">
                    <div>
                        <h2 className="admin-modal-title">Document Verification Review</h2>
                        <p className="admin-modal-subtitle">ID: {documentId}</p>
                    </div>
                    <button onClick={onClose} className="admin-modal-close">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="admin-modal-content">
                    {loading ? (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '5rem 0' }}>
                            <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                        </div>
                    ) : error && !data ? (
                        <div className="admin-error" style={{ margin: 'auto' }}>
                            {error}
                        </div>
                    ) : (data && (
                        <>
                            {/* Left Panel: File Preview */}
                            <div className="admin-modal-left">
                                {data.document.signedUrl && data.document.signedUrl.startsWith('data:application/pdf') ? (
                                    <object 
                                        data={data.document.signedUrl} 
                                        type="application/pdf"
                                        className="admin-modal-image"
                                        style={{ width: '100%', height: '500px' }}
                                    >
                                        <p>PDF Preview not available.</p>
                                    </object>
                                ) : (
                                    <img 
                                        src={data.document.signedUrl} 
                                        alt="Document Preview" 
                                        className="admin-modal-image"
                                    />
                                )}
                                <a 
                                    href={data.document.signedUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="admin-modal-link"
                                >
                                    Open Original File <ExternalLink size={16} />
                                </a>
                            </div>

                            {/* Right Panel: Data & Verification Context */}
                            <div className="admin-modal-right">
                                
                                <div>
                                    <h3 className="admin-modal-section-title">User Data (Submitted)</h3>
                                    <div className="admin-modal-data-grid">
                                        <div>
                                            <p className="admin-modal-data-label">Full Name</p>
                                            <p className="admin-modal-data-val">{data.document.full_name}</p>
                                        </div>
                                        <div>
                                            <p className="admin-modal-data-label">Document Type</p>
                                            <p className="admin-modal-data-val">{data.document.document_type}</p>
                                        </div>
                                        <div>
                                            <p className="admin-modal-data-label">DOB / Gender</p>
                                            <p className="admin-modal-data-val">{new Date(data.document.date_of_birth).toLocaleDateString()} / {data.document.gender}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="admin-modal-section-title">Automated Scoring</h3>
                                    {data.verificationLog ? (
                                        <div className="admin-modal-score-box">
                                            <div className="admin-modal-score-header">
                                                <span className="admin-modal-score-title">Total Confidence Score</span>
                                                <span className={`admin-modal-score-val ${data.verificationLog.score >= 85 ? 'good' : 'warn'}`}>
                                                    {data.verificationLog.score}/100
                                                </span>
                                            </div>
                                            <div className="admin-modal-flags">
                                                {Object.entries(JSON.parse(data.verificationLog.details_json)).map(([key, val]: any) => (
                                                    <div key={key} className="admin-modal-flag">
                                                        {val ? <CheckCircle size={14} color="#10b981" /> : <XCircle size={14} color="#f87171" />}
                                                        <span>{key.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', color: '#64748b', fontSize: '0.875rem' }}>
                                            No automated verification log present.
                                        </div>
                                    )}
                                </div>

                                {/* Rejection/Reupload Reason Input */}
                                {(actionState === 'CONFIRMING_REJECT' || actionState === 'CONFIRMING_REUPLOAD') && (
                                    <div className="admin-modal-feedback-box">
                                        <label className="admin-modal-feedback-label">
                                            <AlertTriangle size={16} />
                                            {actionState === 'CONFIRMING_REJECT' ? 'Reason for Rejection' : 'Reason for Re-Upload Request'}
                                        </label>
                                        {error && <p className="admin-modal-feedback-error">{error}</p>}
                                        <textarea 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            placeholder="Provide constructive feedback to the user on what went wrong..."
                                            className="admin-modal-textarea"
                                            rows={3}
                                            required
                                        ></textarea>
                                        <div className="admin-modal-feedback-actions">
                                            <button 
                                                onClick={() => setActionState('IDLE')}
                                                className="admin-modal-fb-btn admin-modal-fb-btn-cancel"
                                            >Cancel</button>
                                            <button 
                                                onClick={() => executeAction(actionState === 'CONFIRMING_REJECT' ? 'REJECT' : 'REUPLOAD')}
                                                className="admin-modal-fb-btn admin-modal-fb-btn-confirm"
                                            >
                                                Confirm {actionState === 'CONFIRMING_REJECT' ? 'Reject' : 'Re-Upload'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        </>
                    ))}
                </div>

                {/* Sticky Action Footer */}
                {actionState === 'IDLE' && data && !loading && (
                    <div className="admin-modal-footer">
                        <button 
                            onClick={() => executeAction('REUPLOAD')}
                            className="admin-modal-btn admin-modal-btn-outline"
                        >
                            <FileText size={16} /> Request Re-Upload
                        </button>
                        <button 
                            onClick={() => executeAction('REJECT')}
                            className="admin-modal-btn admin-modal-btn-danger"
                        >
                            <XCircle size={16} /> Reject Unconditionally
                        </button>
                        <button 
                            onClick={() => executeAction('APPROVE')}
                            className="admin-modal-btn admin-modal-btn-success"
                        >
                            <CheckCircle size={16} /> Approve as Verified
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
