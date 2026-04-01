import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button'; // Assuming Button is available
import { FileUpload } from '../../components/ui/FileUpload';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { DocumentSubmissionForm } from '../../components/forms/DocumentSubmissionForm';
import { VerificationStatusBanner } from '../../components/ui/VerificationStatusBanner';
import { BlockchainProofModal } from '../../components/ui/BlockchainProofModal';
import { documentService } from '../../services/documentService';
import { authService } from '../../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import type { Document, VerificationStatus } from '../../types';
import { User, FileText, Shield, Calendar, MapPin, Briefcase } from 'lucide-react'; // Added icons
import { motion } from 'framer-motion';

export const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'profile' | 'verification' | 'documents'>('documents');
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [fileUploadResetKey, setFileUploadResetKey] = useState(0);

    useEffect(() => {
        const fetchProfileAndDocs = async () => {
            try {
                const profile = await authService.getProfile();
                setUser(profile.user);

                // Set verification status based on backend account_status
                const status = profile.user.account_status ? profile.user.account_status.toLowerCase() as VerificationStatus : 'unverified';
                setVerificationStatus(status);

                if (status === 'rejected') {
                    // Fetch real feedback
                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                    const token = localStorage.getItem('nevn_token');
                    fetch(`${API_URL}/verification/status/${profile.user.id}`, { headers: { 'Authorization': `Bearer ${token}` } })
                        .then(res => res.json())
                        .then(data => {
                            if (data && data.details_json) {
                                try {
                                    const details = JSON.parse(data.details_json);
                                    if (details.reason) setRejectionReason(details.reason);
                                } catch (e) {
                                  // ignore parse error if manual message was sent
                                }
                            }
                        })
                        .catch(err => console.error(err));
                }

                const docs = await documentService.getDocuments(profile.user.id);
                setDocuments(docs);
            } catch (error) {
                console.error("Failed to fetch profile", error);
                navigate('/login');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfileAndDocs();
    }, [navigate]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setIsModalOpen(true);
    };

    const handleSubmission = async (data: any) => {
        console.log("Submitting:", data);
        try {
            const newDoc = await documentService.uploadDocument(data.file, data);
            setDocuments([newDoc, ...documents]);
            setIsModalOpen(false);
            setSelectedFile(null);
            setActiveTab('documents');
            // Increment key to trigger reset of the FileUpload widget
            setFileUploadResetKey(k => k + 1);
        } catch (error) {
            console.error("Upload failed", error);
        }
    };

    const handleApplyForVerification = () => {
        setTimeout(() => {
            setVerificationStatus('pending');
        }, 1000);
    };

    if (isLoading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading profile...</div>;
    }

    if (!user) return null;

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>My Dashboard</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage your verified documents and requests.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {verificationStatus === 'verified' && (
                        <Link to="/jobs">
                            <Button variant="outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--glass-bg)' }}>
                                <Briefcase size={18} /> Find Jobs
                            </Button>
                        </Link>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-highlight)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                            <User size={20} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, lineHeight: 1.2 }}>{user.full_name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.email}</p>
                        </div>
                    </div>
                </div>
            </div>

            <VerificationStatusBanner
                status={verificationStatus}
                userRole="employee"
                feedbackReason={rejectionReason}
                onApply={documents.length > 0 ? handleApplyForVerification : undefined}
            />

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)' }}>
                {['profile', 'verification', 'documents'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            padding: '1rem 1.5rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid var(--color-highlight)' : '2px solid transparent',
                            color: activeTab === tab ? 'var(--color-highlight)' : 'var(--color-text-muted)',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'profile' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <Card>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={24} color="var(--color-highlight)" /> Personal Information
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Full Name</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.full_name}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Email Address</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.email}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Phone Number</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>{user.mobile}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Date of Birth</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}><Calendar size={16} style={{ display: 'inline', marginRight: '5px' }} /> {new Date(user.date_of_birth).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Location</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}><MapPin size={16} style={{ display: 'inline', marginRight: '5px' }} /> {user.city}, {user.state}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>Employment Status</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}><Briefcase size={16} style={{ display: 'inline', marginRight: '5px' }} /> {user.employment_status}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'verification' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <Card>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Shield size={24} color="var(--color-highlight)" /> Verification Status
                        </h2>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '50%',
                                    background: verificationStatus === 'verified' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: verificationStatus === 'verified' ? 'var(--color-success)' : 'var(--color-warning)'
                                }}>
                                    <Shield size={32} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                                        {verificationStatus === 'verified' ? 'Identity Verified' : 'Verification Required'}
                                    </h3>
                                    <p style={{ color: 'var(--color-text-muted)' }}>
                                        {verificationStatus === 'verified'
                                            ? 'Your identity has been confirmed on the blockchain.'
                                            : 'Complete the process to get verified.'}
                                    </p>
                                </div>
                            </div>

                            {verificationStatus === 'verified' && (
                                <Button variant="outline" onClick={() => setIsProofModalOpen(true)}>
                                    View Blockchain Proof
                                </Button>
                            )}
                        </div>
                    </Card>
                </div>
            )}

            {activeTab === 'documents' && (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Documents</h2>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>Loading documents...</div>
                                ) : (
                                    <>
                                        {documents.length === 0 ? (
                                            <Card>
                                                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                                                    <p>No documents uploaded yet.</p>
                                                </div>
                                            </Card>
                                        ) : (
                                            documents.map((doc, index) => (
                                                <motion.div
                                                    key={doc.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                >
                                                    <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                            <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--color-highlight)' }}>
                                                                <FileText size={24} />
                                                            </div>
                                                            <div>
                                                                <h3 style={{ fontWeight: 600 }}>{doc.name}</h3>
                                                                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                                    <span>{doc.type ? doc.type.toUpperCase() : 'DOC'}</span>
                                                                    <span>•</span>
                                                                    <span>
                                                                        {doc.date ? new Date(doc.date).toLocaleDateString() : 'Unknown Date'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <StatusBadge status={doc.status} />
                                                    </Card>
                                                </motion.div>
                                            ))
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div>
                            <Card style={{ position: 'sticky', top: '120px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h3>
                                <FileUpload onFileSelect={handleFileSelect} resetKey={fileUploadResetKey} />
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Recent Activity</h4>
                                    {documents.length > 0 ? (
                                        documents.slice(0, 3).map(doc => (
                                            <div key={doc.id} style={{ fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Uploaded {doc.name}</span>
                                                <span style={{ color: 'var(--color-text-muted)' }}>Today</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>No recent activity.</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Submit Document for Verification"
            >
                {selectedFile && (
                    <DocumentSubmissionForm
                        file={selectedFile}
                        onSubmit={handleSubmission}
                        onCancel={() => setIsModalOpen(false)}
                    />
                )}
            </Modal>

            <BlockchainProofModal
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
                proof={{
                    txId: "0x8f2d...3a1b",
                    timestamp: new Date().toISOString(),
                    blockNumber: 13456789,
                    hash: "28f...a9c",
                    verifierId: "GOV-AUTH-001"
                }}
            />
        </div >
    );
}
