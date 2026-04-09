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
import { jobService } from '../../services/jobService';
import { verificationService } from '../../services/verificationService';
import { authService } from '../../services/authService';
import { hiringService, type EmploymentRecord } from '../../services/hiringService';
import { useNavigate, Link } from 'react-router-dom';
import type { Document, VerificationStatus } from '../../types';
import { User, FileText, Shield, Calendar, MapPin, Briefcase, CheckCircle2, Clock, Lock, Building2, CheckCircle, XCircle, ShieldCheck, AlertTriangle } from 'lucide-react';
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

type DashboardTab = 'profile' | 'verification' | 'documents' | 'offers' | 'employment';

export const EmployeeDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState<EmployeeProfile | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [employmentRecords, setEmploymentRecords] = useState<EmploymentRecord[]>([]);
  const [isConsenting, setIsConsenting] = useState<number | null>(null);
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
        try {
          const pending = await jobService.getPendingOffers();
          setOffers(pending.offers);
        } catch(e) { console.error('Failed fetching offers', e); }
        try {
          const empRecords = await hiringService.getMyEmploymentRecords();
          setEmploymentRecords(empRecords.records || []);
        } catch(e) { console.error('Failed fetching employment records', e); }
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

  const handleConsent = async (recordIdOrEmployerId: number | string) => {
    try {
      setIsConsenting(recordIdOrEmployerId as any);
      // If it looks like a UUID (string), use recordId. Otherwise use employerId.
      if (typeof recordIdOrEmployerId === 'string' && recordIdOrEmployerId.includes('-')) {
        await jobService.consentHire(0, recordIdOrEmployerId);
      } else {
        await jobService.consentHire(recordIdOrEmployerId as number);
      }
      const pending = await jobService.getPendingOffers();
      setOffers(pending.offers);
    } catch(e) {
      console.error(e);
    } finally {
      setIsConsenting(null);
    }
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
        {(['profile', 'verification', 'documents', 'offers', 'employment'] as DashboardTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
            style={{ textTransform: 'capitalize' }}
          >
            {tab === 'employment' ? `Employment (${employmentRecords.length})` : tab}
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
              <p style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Briefcase size={14} />
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.82rem',
                  background: user.employment_status === 'EMPLOYED' ? 'rgba(34,197,94,0.12)' :
                             user.employment_status === 'PROPOSED' ? 'rgba(245,158,11,0.12)' :
                             'rgba(148,163,184,0.12)',
                  color: user.employment_status === 'EMPLOYED' ? '#22c55e' :
                         user.employment_status === 'PROPOSED' ? '#f59e0b' :
                         '#94a3b8'
                }}>
                  {user.employment_status || 'AVAILABLE'}
                </span>
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


      {activeTab === 'offers' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Briefcase size={18} color="var(--color-highlight)" /> Pending Employment Offers
          </h2>
          {offers.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '1.8rem', color: 'var(--color-text-muted)' }}>
                <p>No pending offers available.</p>
              </div>
            </Card>
          ) : (
            offers.map((offer) => (
              <Card key={offer.proposal_id} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.8rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)' }}>
                      <Briefcase size={20} color="var(--color-highlight)" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{offer.position}</h3>
                      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        {offer.organization_name} — {offer.city}
                        {offer.tier && (
                          <span style={{
                            marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                            fontSize: '0.68rem', fontWeight: 700,
                            background: offer.tier === 'TIER_3' ? 'rgba(167,139,250,0.15)' : offer.tier === 'TIER_2' ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.15)',
                            color: offer.tier === 'TIER_3' ? '#a78bfa' : offer.tier === 'TIER_2' ? '#38bdf8' : '#94a3b8'
                          }}>
                            {offer.tier?.replace('_', ' ')}
                          </span>
                        )}
                      </p>
                      <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.2rem' }}>
                        Proposed: {new Date(offer.proposed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                    <span className="ui-pill" style={{ background: 'rgba(234, 179, 8, 0.15)', color: 'var(--color-warning)' }}>
                      <Clock size={12}/> Pending Consent
                    </span>
                    <Button 
                      variant="primary" 
                      onClick={() => handleConsent(offer.record_id || offer.employer_id)} 
                      isLoading={isConsenting === (offer.record_id || offer.employer_id)}
                    >
                      <CheckCircle2 size={16} /> Accept & Consent
                    </Button>
                  </div>
                </div>
                {/* Verification hash */}
                {offer.verification_hash && (
                  <div style={{
                    marginTop: '0.8rem', padding: '0.4rem 0.7rem', borderRadius: '6px',
                    background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)',
                    fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-text-muted)'
                  }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>Verification Hash:</span> {offer.verification_hash.slice(0, 20)}...
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      ) : null}

      {activeTab === 'employment' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={18} color="var(--color-highlight)" /> My Employment Records
            </h2>
            <p className="muted" style={{ fontSize: '0.82rem' }}>
              Fields marked with <Lock size={11} style={{ display: 'inline', verticalAlign: 'middle', color: '#a78bfa' }} /> are stored in the Private Data Collection (PDC)
            </p>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0.7rem 1rem',
            borderRadius: '10px', background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.15)'
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Data Visibility Key:</span>
            <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} />
              <span style={{ color: '#94a3b8' }}>Public (visible to all orgs)</span>
            </span>
            <span style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Lock size={11} color="#a78bfa" />
              <span style={{ color: '#a78bfa' }}>Private (PDC — only your employer & govt)</span>
            </span>
          </div>

          {employmentRecords.length === 0 ? (
            <Card>
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>
                <Briefcase size={36} style={{ margin: '0 auto 0.6rem', opacity: 0.3 }} />
                <p>No employment records yet.</p>
                <p style={{ fontSize: '0.82rem', marginTop: '0.3rem' }}>When an employer hires you, your records will appear here.</p>
              </div>
            </Card>
          ) : (
            employmentRecords.map((record) => {
              const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
                PROPOSED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: Clock, label: 'Proposed' },
                CONSENTED: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', icon: ShieldCheck, label: 'Consented' },
                CONFIRMED: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: CheckCircle, label: 'Active' },
                TERMINATED: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: XCircle, label: 'Terminated' },
              };
              const sc = statusConfig[record.status] || statusConfig.PROPOSED;
              const StatusIcon = sc.icon;

              return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div style={{
                    borderRadius: '14px', overflow: 'hidden',
                    background: record.status === 'TERMINATED' ? 'var(--color-surface)' : 'var(--color-surface)',
                    border: `1px solid ${record.status === 'TERMINATED' ? 'rgba(239,68,68,0.2)' : sc.color + '30'}`,
                  }}>
                    {/* Header */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '10px',
                          background: sc.bg, display: 'grid', placeItems: 'center', color: sc.color,
                        }}>
                          <Building2 size={18} />
                        </div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>{record.organization_name}</p>
                          <p className="muted" style={{ fontSize: '0.78rem' }}>
                            {record.industry_sector}
                            {record.tier && (
                              <span style={{
                                marginLeft: '0.5rem', padding: '0.1rem 0.4rem', borderRadius: '4px',
                                fontSize: '0.65rem', fontWeight: 700,
                                background: record.tier === 'TIER_3' ? 'rgba(167,139,250,0.15)' : record.tier === 'TIER_2' ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.15)',
                                color: record.tier === 'TIER_3' ? '#a78bfa' : record.tier === 'TIER_2' ? '#38bdf8' : '#94a3b8',
                              }}>{record.tier?.replace('_', ' ')}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        padding: '0.3rem 0.7rem', borderRadius: '8px',
                        background: sc.bg, color: sc.color,
                        fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        <StatusIcon size={13} /> {sc.label}
                      </span>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '1rem 1.25rem' }}>
                      {/* Public Data Section */}
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.06em', color: '#22c55e', marginBottom: '0.5rem',
                          display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e', display: 'inline-block' }} />
                          Public Data — Visible to All Organizations
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                          <div>
                            <p className="muted" style={{ fontSize: '0.7rem' }}>Position</p>
                            <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{record.position}</p>
                          </div>
                          <div>
                            <p className="muted" style={{ fontSize: '0.7rem' }}>Department</p>
                            <p style={{ fontWeight: 600, fontSize: '0.92rem' }}>{record.department || 'General'}</p>
                          </div>
                          <div>
                            <p className="muted" style={{ fontSize: '0.7rem' }}>Proposed By</p>
                            <p style={{ fontSize: '0.88rem' }}>{record.proposed_by || record.organization_name}</p>
                          </div>
                          <div>
                            <p className="muted" style={{ fontSize: '0.7rem' }}>Proposed Date</p>
                            <p style={{ fontSize: '0.88rem' }}>{new Date(record.proposed_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* PDC Section — Private Data */}
                      <div style={{
                        borderRadius: '10px', padding: '0.9rem',
                        background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(56,189,248,0.06) 100%)',
                        border: '1px dashed rgba(167,139,250,0.3)',
                        marginBottom: '1rem'
                      }}>
                        <p style={{
                          fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
                          letterSpacing: '0.06em', color: '#a78bfa', marginBottom: '0.6rem',
                          display: 'flex', alignItems: 'center', gap: '0.3rem'
                        }}>
                          <Lock size={12} />
                          Private Data Collection (PDC) — Only Employer & Government
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          <div>
                            <p style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Lock size={9} color="#a78bfa" /> Salary
                            </p>
                            <p style={{
                              fontWeight: 700, fontSize: '1rem', color: '#a78bfa',
                              fontFamily: 'monospace'
                            }}>
                              {record.salary || '—'}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                              <Lock size={9} color="#a78bfa" /> Compensation Package
                            </p>
                            <p style={{
                              fontSize: '0.88rem', color: '#a78bfa',
                              fontFamily: 'monospace'
                            }}>
                              {record.compensation || '—'}
                            </p>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.63rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                          🔒 This data is stored in Hyperledger Fabric Private Data Collections. Only authorized MSPs
                          (CentralGovtMSP, CompanyOrgMSP) can read this data. Other organizations see only the hash.
                        </p>
                      </div>

                      {/* Timeline */}
                      <div style={{
                        display: 'flex', gap: '0', marginBottom: '0.85rem',
                        borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)'
                      }}>
                        {[
                          { label: 'Proposed', date: record.proposed_at, done: true },
                          { label: 'Consented', date: record.consented_at, done: !!record.consented_at },
                          { label: 'Confirmed', date: record.confirmed_at, done: !!record.confirmed_at },
                          { label: 'Terminated', date: record.terminated_at, done: !!record.terminated_at },
                        ].map((step, i) => (
                          <div key={step.label} style={{
                            flex: 1, padding: '0.5rem 0.6rem', textAlign: 'center',
                            background: step.done
                              ? (step.label === 'Terminated' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.06)')
                              : 'transparent',
                            borderRight: i < 3 ? '1px solid var(--color-border)' : 'none'
                          }}>
                            <p style={{
                              fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
                              color: step.done ? (step.label === 'Terminated' ? '#ef4444' : '#22c55e') : '#64748b',
                              marginBottom: '0.15rem'
                            }}>
                              {step.done ? '✓ ' : ''}{step.label}
                            </p>
                            <p style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                              {step.date ? new Date(step.date).toLocaleDateString() : '—'}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Verification Hash */}
                      <div style={{
                        padding: '0.45rem 0.7rem', borderRadius: '8px',
                        background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)',
                        fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--color-text-muted)',
                        overflowX: 'auto', whiteSpace: 'nowrap'
                      }}>
                        <span style={{ color: '#22c55e', fontWeight: 600 }}>SHA256:</span>{' '}
                        {record.verification_hash
                          ? record.verification_hash.slice(0, 16) + '...' + record.verification_hash.slice(-8)
                          : '—'}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : null}

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
