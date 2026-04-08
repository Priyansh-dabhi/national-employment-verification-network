import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileUpload } from '../../components/ui/FileUpload';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { DocumentSubmissionForm, type DocumentSubmissionData } from '../../components/forms/DocumentSubmissionForm';
import { VerificationStatusBanner } from '../../components/ui/VerificationStatusBanner';
import { BlockchainProofModal } from '../../components/ui/BlockchainProofModal';
import { documentService } from '../../services/documentService';
import { verificationService } from '../../services/verificationService';
import { authService } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import type { Document, VerificationStatus } from '../../types';
import { User, FileText, Shield, Calendar, MapPin, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmployeeProfile {
  id: number;
  full_name: string;
  email: string;
  mobile: string;
  date_of_birth: string;
  city: string;
  state: string;
  employment_status: string;
  account_status: string;
}

type DashboardTab = 'profile' | 'verification' | 'documents';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<EmployeeProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('documents');
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
  const [rejectionReason, setRejectionReason] = useState('');
  const [fileUploadResetKey, setFileUploadResetKey] = useState(0);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const fetchProfileAndDocs = async () => {
      try {
        const profile = await authService.getProfile();
        const profileUser = profile.user as unknown as EmployeeProfile;
        setUser(profileUser);

        const status = profileUser.account_status
          ? (profileUser.account_status.toLowerCase() as VerificationStatus)
          : 'unverified';
        setVerificationStatus(status);

        if (status === 'rejected') {
          try {
            const details = await verificationService.getVerificationStatus(String(profileUser.id));
            if (details?.details_json) {
              const parsed = JSON.parse(details.details_json) as { reason?: string };
              if (parsed.reason) setRejectionReason(parsed.reason);
            }
          } catch {
            // Non-blocking. Dashboard can still render without rejection details.
          }
        }

        const docs = await documentService.getDocuments(String(profileUser.id));
        setDocuments(docs);
      } catch (error) {
        console.error('Failed to fetch profile', error);
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndDocs();
  }, [navigate]);

  const handleSubmission = async (data: DocumentSubmissionData) => {
    const newDoc = await documentService.uploadDocument(data.file, data);
    setDocuments((previousDocs) => [newDoc, ...previousDocs]);
    setIsModalOpen(false);
    setSelectedFile(null);
    setActiveTab('documents');
    setErrorBanner(null);
    setFileUploadResetKey((current) => current + 1);
  };

  const handleApplyForVerification = async () => {
    try {
      setIsApplying(true);
      setErrorBanner(null);
      const result = await verificationService.applyForVerification();
      setVerificationStatus((result.account_status || 'PENDING').toLowerCase() as VerificationStatus);
      localStorage.setItem('nevn_account_status', result.account_status || 'PENDING');
    } catch (error) {
      setErrorBanner(error instanceof Error ? error.message : 'Failed to submit verification request.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading profile...</div>;
  }

  if (!user) return null;

  return (
    <div className="container page-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.9rem' }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: '0.3rem' }}>
            My Dashboard
          </h1>
          <p className="muted">Manage your profile, documents, and verification journey.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          {verificationStatus === 'verified' ? (
            <Link to="/jobs">
              <Button variant="outline">
                <Briefcase size={16} /> Find Jobs
              </Button>
            </Link>
          ) : null}
          <div
            className="surface"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.45rem 0.75rem',
              borderRadius: '999px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                background: 'var(--color-highlight)',
                display: 'grid',
                placeItems: 'center',
                color: '#021422',
              }}
            >
              <User size={16} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>{user.full_name}</p>
              <p className="muted" style={{ fontSize: '0.76rem' }}>
                {user.email}
              </p>
            </div>
          </div>
        </div>
      </div>

      {errorBanner ? <div className="ui-alert ui-alert--error" style={{ marginBottom: '1rem' }}>{errorBanner}</div> : null}

      <VerificationStatusBanner
        status={verificationStatus}
        userRole="employee"
        feedbackReason={rejectionReason}
        onApply={documents.length > 0 ? handleApplyForVerification : undefined}
        isApplying={isApplying}
      />

      <div className="tab-group" style={{ marginBottom: '1.2rem' }}>
        {(['profile', 'verification', 'documents'] as DashboardTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'profile' ? (
        <Card>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="var(--color-highlight)" /> Profile Information
          </h2>
          <div className="grid-2" style={{ gap: '1.2rem 1.4rem' }}>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Full Name
              </p>
              <p style={{ fontWeight: 600 }}>{user.full_name}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Email
              </p>
              <p style={{ fontWeight: 600 }}>{user.email}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Phone
              </p>
              <p style={{ fontWeight: 600 }}>{user.mobile}</p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Date of Birth
              </p>
              <p style={{ fontWeight: 600 }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '0.28rem' }} />
                {new Date(user.date_of_birth).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Location
              </p>
              <p style={{ fontWeight: 600 }}>
                <MapPin size={14} style={{ display: 'inline', marginRight: '0.28rem' }} />
                {user.city}, {user.state}
              </p>
            </div>
            <div>
              <p className="muted" style={{ fontSize: '0.8rem' }}>
                Employment Status
              </p>
              <p style={{ fontWeight: 600 }}>
                <Briefcase size={14} style={{ display: 'inline', marginRight: '0.28rem' }} />
                {user.employment_status}
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {activeTab === 'verification' ? (
        <Card>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Shield size={18} color="var(--color-highlight)" /> Verification Overview
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                background:
                  verificationStatus === 'verified' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                color: verificationStatus === 'verified' ? 'var(--color-success)' : 'var(--color-warning)',
              }}
            >
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>
                {verificationStatus === 'verified' ? 'Verified identity' : 'Awaiting verification'}
              </h3>
              <p className="muted" style={{ fontSize: '0.86rem' }}>
                {verificationStatus === 'verified'
                  ? 'Your identity has been verified and stored in the ledger.'
                  : 'Submit the required details and documents to proceed.'}
              </p>
            </div>
          </div>

          {verificationStatus === 'verified' ? (
            <Button variant="outline" onClick={() => setIsProofModalOpen(true)}>
              View blockchain proof
            </Button>
          ) : null}
        </Card>
      ) : null}

      {activeTab === 'documents' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
          <div className="stack" style={{ gap: '0.9rem' }}>
            {documents.length === 0 ? (
              <Card>
                <div style={{ textAlign: 'center', padding: '1.8rem', color: 'var(--color-text-muted)' }}>
                  <p>No documents uploaded yet.</p>
                </div>
              </Card>
            ) : (
              documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '10px',
                          background: 'rgba(56, 189, 248, 0.14)',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--color-highlight)',
                        }}
                      >
                        <FileText size={20} />
                      </span>
                      <div>
                        <p style={{ fontWeight: 700 }}>{doc.name}</p>
                        <p className="muted" style={{ fontSize: '0.8rem' }}>
                          {doc.type ? doc.type.toUpperCase() : 'DOC'} - {doc.date ? new Date(doc.date).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={doc.status} />
                  </Card>
                </motion.div>
              ))
            )}
          </div>

          <Card style={{ height: 'fit-content' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem' }}>Quick upload</h3>
            <FileUpload key={fileUploadResetKey} onFileSelect={(file) => {
              setSelectedFile(file);
              setIsModalOpen(true);
            }} />
            <div style={{ marginTop: '1.2rem' }}>
              <h4 className="muted" style={{ fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                Recent activity
              </h4>
              {documents.length > 0 ? (
                documents.slice(0, 3).map((doc) => (
                  <div key={doc.id} style={{ fontSize: '0.82rem', marginBottom: '0.35rem', display: 'flex', justifyContent: 'space-between', gap: '0.45rem' }}>
                    <span>Uploaded {doc.name}</span>
                    <span className="muted">Today</span>
                  </div>
                ))
              ) : (
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  No recent activity.
                </p>
              )}
            </div>
          </Card>
        </div>
      ) : null}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Submit document for verification">
        {selectedFile ? (
          <DocumentSubmissionForm
            file={selectedFile}
            onSubmit={handleSubmission}
            onCancel={() => setIsModalOpen(false)}
          />
        ) : null}
      </Modal>

      <BlockchainProofModal
        isOpen={isProofModalOpen}
        onClose={() => setIsProofModalOpen(false)}
        proof={{
          txId: '0x8f2d...3a1b',
          timestamp: new Date().toISOString(),
          blockNumber: 13456789,
          hash: '28f...a9c',
          verifierId: 'GOV-AUTH-001',
        }}
      />
    </div>
  );
};
