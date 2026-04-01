import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Upload, FileText, ShieldCheck, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const DOC_TYPES = ['Business Registration Certificate', 'GST Certificate', 'PAN Card', 'Incorporation Certificate', 'Trade License', 'Other'];

export const CompanyVerificationPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [applying, setApplying] = useState(false);
    const [docType, setDocType] = useState(DOC_TYPES[0]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        const role = localStorage.getItem('nevn_role');
        if (!role || role.toUpperCase() !== 'EMPLOYER') { navigate('/'); return; }
        loadData();
    }, [navigate]);

    const loadData = async () => {
        try {
            const [docsData, statusData] = await Promise.all([
                employerService.getDocuments(),
                employerService.getVerificationStatus(),
            ]);
            setDocuments(docsData.documents || []);
            setStatus(statusData);
        } catch { navigate('/login'); }
        finally { setLoading(false); }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        setMessage(null);
        try {
            await employerService.uploadDocument(selectedFile, docType);
            setMessage({ text: 'Document uploaded successfully!', type: 'success' });
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await loadData();
        } catch (e: any) {
            setMessage({ text: e.message || 'Upload failed', type: 'error' });
        } finally { setUploading(false); }
    };

    const handleApply = async () => {
        setApplying(true);
        setMessage(null);
        try {
            await employerService.applyForVerification();
            setMessage({ text: 'Verification request submitted! Under review.', type: 'success' });
            await loadData();
        } catch (e: any) {
            setMessage({ text: e.message || 'Failed to apply', type: 'error' });
        } finally { setApplying(false); }
    };

    const statusInfo: Record<string, { icon: any; color: string; label: string; desc: string }> = {
        VERIFIED: { icon: CheckCircle, color: 'var(--color-success)', label: 'Verified', desc: 'Your company has been verified by NEVN Central Authority.' },
        PENDING: { icon: Clock, color: 'var(--color-warning)', label: 'Under Review', desc: 'Your verification request is being reviewed.' },
        UNVERIFIED: { icon: AlertCircle, color: 'var(--color-text-muted)', label: 'Not Verified', desc: 'Upload documents and apply for verification.' },
        REJECTED: { icon: XCircle, color: 'var(--color-error)', label: 'Rejected', desc: 'Your verification was rejected. Check remarks and reapply.' },
    };

    const accountStatus = status?.account_status || 'UNVERIFIED';
    const si = statusInfo[accountStatus] || statusInfo.UNVERIFIED;
    const StatusIcon = si.icon;
    const canApply = accountStatus === 'UNVERIFIED' || accountStatus === 'REJECTED';

    if (loading) return <EmployerLayout><div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div></EmployerLayout>;

    return (
        <EmployerLayout>
            <div style={{ maxWidth: '860px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Company Verification</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Upload your company documents and apply for NEVN verification.</p>

                {/* Status Card */}
                <div style={{
                    background: `${si.color}10`, border: `1px solid ${si.color}30`,
                    borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem',
                    display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem',
                }}>
                    <StatusIcon size={28} color={si.color} />
                    <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, color: si.color, fontSize: '1rem' }}>{si.label}</p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{si.desc}</p>
                        {status?.latest_request?.remarks && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-error)' }}>
                                Remarks: {status.latest_request.remarks}
                            </p>
                        )}
                    </div>
                    {canApply && (
                        <button
                            onClick={handleApply}
                            disabled={applying || documents.length === 0}
                            style={{
                                padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)',
                                background: documents.length === 0 ? 'rgba(255,255,255,0.05)' : 'var(--color-accent)',
                                color: documents.length === 0 ? 'var(--color-text-muted)' : '#000',
                                border: 'none', cursor: documents.length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                            }}
                        >
                            {applying ? 'Submitting…' : 'Apply for Verification'}
                        </button>
                    )}
                </div>

                {/* Alert message */}
                {message && (
                    <div style={{
                        padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)',
                        background: message.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        border: `1px solid ${message.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        color: message.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
                        marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500,
                    }}>
                        {message.text}
                    </div>
                )}

                {/* Upload Card */}
                <div style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '1.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <Upload size={18} color="var(--color-accent)" />
                        <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Upload Document</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>Document Type</label>
                            <select
                                value={docType}
                                onChange={e => setDocType(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.65rem 1rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem',
                                }}
                            >
                                {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.4rem' }}>File (PDF / JPG / PNG, max 5 MB)</label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                                style={{
                                    width: '100%', padding: '0.55rem 0.75rem',
                                    background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)',
                                    borderRadius: 'var(--radius-md)', color: 'var(--color-text)', fontSize: '0.9rem',
                                }}
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                        style={{
                            padding: '0.65rem 1.5rem', borderRadius: 'var(--radius-md)',
                            background: !selectedFile ? 'rgba(255,255,255,0.05)' : 'var(--color-accent)',
                            color: !selectedFile ? 'var(--color-text-muted)' : '#000',
                            border: 'none', cursor: !selectedFile ? 'not-allowed' : 'pointer',
                            fontWeight: 600, transition: 'all 0.2s',
                        }}
                    >
                        {uploading ? 'Uploading…' : 'Upload Document'}
                    </button>
                </div>

                {/* Documents List */}
                <div style={{
                    background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-lg)', padding: '1.5rem',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                        <FileText size={18} color="var(--color-accent)" />
                        <h2 style={{ fontWeight: 600, fontSize: '1rem' }}>Uploaded Documents ({documents.length})</h2>
                    </div>
                    {documents.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                            <ShieldCheck size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
                            <p>No documents uploaded yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {documents.map((doc: any) => {
                                const docSc = statusInfo[doc.verification_status] || statusInfo.UNVERIFIED;
                                const DocIcon = docSc.icon;
                                return (
                                    <div key={doc.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        padding: '1rem', background: 'rgba(255,255,255,0.02)',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--glass-border)',
                                    }}>
                                        <FileText size={20} color="var(--color-accent)" />
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: 500 }}>{doc.document_type}</p>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.3rem 0.8rem', borderRadius: '999px',
                                            background: `${docSc.color}15`, color: docSc.color,
                                            fontSize: '0.8rem', fontWeight: 600,
                                        }}>
                                            <DocIcon size={13} />
                                            {doc.verification_status}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </EmployerLayout>
    );
};
