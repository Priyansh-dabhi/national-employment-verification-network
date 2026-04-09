import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Upload, FileText, ShieldCheck, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const DOC_TYPES = [
  'Business Registration Certificate',
  'GST Certificate',
  'PAN Card',
  'Incorporation Certificate',
  'Trade License',
  'Other',
] as const;

type Message = { text: string; type: 'success' | 'error' } | null;

interface CompanyDocument {
  id: number;
  document_type: string;
  verification_status: string;
  uploaded_at: string;
}

interface VerificationStatusResponse {
  account_status: string;
  latest_request: { remarks?: string } | null;
}

export const CompanyVerificationPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [docType, setDocType] = useState<(typeof DOC_TYPES)[number]>(DOC_TYPES[0]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState<Message>(null);

  useEffect(() => {
    void loadData();
  }, [navigate]);

  const loadData = async () => {
    try {
      const [docsData, statusData] = await Promise.all([employerService.getDocuments(), employerService.getVerificationStatus()]);
      setDocuments((docsData.documents || []) as unknown as CompanyDocument[]);
      setStatus(statusData as VerificationStatusResponse);
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setMessage(null);
    try {
      await employerService.uploadDocument(selectedFile, docType);
      setMessage({ text: 'Document uploaded successfully.', type: 'success' });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (uploadError) {
      setMessage({
        text: uploadError instanceof Error ? uploadError.message : 'Upload failed',
        type: 'error',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    setMessage(null);
    try {
      await employerService.applyForVerification();
      setMessage({ text: 'Verification request submitted. It is now under review.', type: 'success' });
      await loadData();
    } catch (applyError) {
      setMessage({ text: applyError instanceof Error ? applyError.message : 'Failed to apply', type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const statusInfo = {
    VERIFIED: {
      icon: CheckCircle,
      color: 'var(--color-success)',
      label: 'Verified',
      desc: 'Your company is verified by NEVN central authority.',
    },
    PENDING: {
      icon: Clock,
      color: 'var(--color-warning)',
      label: 'Under Review',
      desc: 'Your verification request is currently being reviewed.',
    },
    UNVERIFIED: {
      icon: AlertCircle,
      color: 'var(--color-text-muted)',
      label: 'Not Verified',
      desc: 'Upload required documents and apply for verification.',
    },
    REJECTED: {
      icon: XCircle,
      color: 'var(--color-error)',
      label: 'Rejected',
      desc: 'Your request was rejected. Update docs and apply again.',
    },
  } as const;

  const accountStatus = status?.account_status || 'UNVERIFIED';
  const info = statusInfo[(accountStatus as keyof typeof statusInfo)] || statusInfo.UNVERIFIED;
  const StatusIcon = info.icon;
  const canApply = accountStatus === 'UNVERIFIED' || accountStatus === 'REJECTED';
  const canManageDocuments = accountStatus === 'UNVERIFIED' || accountStatus === 'REJECTED';

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.2rem' }}>Company Verification</h1>
        <p className="muted" style={{ marginBottom: '1.6rem' }}>
          Upload your company documents and apply for NEVN verification.
        </p>

        <div
          style={{
            background: `${info.color}12`,
            border: `1px solid ${info.color}33`,
            borderRadius: 'var(--radius-lg)',
            padding: '1.1rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.95rem',
            marginBottom: '1.2rem',
            flexWrap: 'wrap',
          }}
        >
          <StatusIcon size={24} color={info.color} />
          <div style={{ flex: 1, minWidth: '220px' }}>
            <p style={{ fontWeight: 700, color: info.color }}>{info.label}</p>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              {info.desc}
            </p>
            {status?.latest_request?.remarks ? (
              <p style={{ marginTop: '0.35rem', fontSize: '0.82rem', color: '#fca5a5' }}>
                Remarks: {status.latest_request.remarks}
              </p>
            ) : null}
          </div>

          {canApply ? (
            <Button onClick={handleApply} disabled={documents.length === 0} isLoading={applying} size="sm">
              Apply for Verification
            </Button>
          ) : null}
        </div>

        {message ? (
          <div
            style={{
              padding: '0.8rem 1rem',
              borderRadius: 'var(--radius-md)',
              border:
                message.type === 'success'
                  ? '1px solid rgba(34,197,94,0.28)'
                  : '1px solid rgba(239,68,68,0.28)',
              background:
                message.type === 'success'
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(239,68,68,0.1)',
              color: message.type === 'success' ? 'var(--color-success)' : '#fecaca',
              marginBottom: '1.1rem',
              fontSize: '0.86rem',
            }}
          >
            {message.text}
          </div>
        ) : null}

        <div className="surface" style={{ padding: '1.2rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <Upload size={17} color="var(--color-accent)" />
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Upload Document</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem', marginBottom: '0.8rem' }}>
            <div>
              <label className="field-label">Document Type</label>
              <select
                value={docType}
                onChange={(event) => setDocType(event.target.value as (typeof DOC_TYPES)[number])}
                className="field-control"
                disabled={!canManageDocuments || uploading}
              >
                {DOC_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">File (PDF / JPG / PNG, max 5MB)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                className="field-control"
                disabled={!canManageDocuments || uploading}
              />
            </div>
          </div>

          {!canManageDocuments ? (
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Document changes are locked while your company verification is under review or already approved.
            </p>
          ) : null}

          <Button onClick={handleUpload} disabled={!selectedFile || !canManageDocuments} isLoading={uploading}>
            Upload Document
          </Button>
        </div>

        <div className="surface" style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.9rem' }}>
            <FileText size={17} color="var(--color-accent)" />
            <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Uploaded Documents ({documents.length})</h2>
          </div>

          {documents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              <ShieldCheck size={32} style={{ margin: '0 auto 0.7rem', opacity: 0.35 }} />
              <p>No documents uploaded yet.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {documents.map((document) => {
                const documentInfo = statusInfo[(document.verification_status as keyof typeof statusInfo)] || statusInfo.UNVERIFIED;
                const DocIcon = documentInfo.icon;
                return (
                  <div
                    key={document.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.8rem',
                      padding: '0.85rem',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255,255,255,0.02)',
                    }}
                  >
                    <FileText size={18} color="var(--color-accent)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 600 }}>{document.document_type}</p>
                      <p className="muted" style={{ fontSize: '0.8rem' }}>
                        Uploaded: {new Date(document.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="chip" style={{ background: `${documentInfo.color}1A`, color: documentInfo.color }}>
                      <DocIcon size={12} /> {document.verification_status}
                    </span>
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
