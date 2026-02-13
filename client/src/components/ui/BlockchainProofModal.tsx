import React from 'react';
import { Modal } from './Modal';
import { CheckCircle, ExternalLink, Copy } from 'lucide-react';

interface BlockchainProof {
    txId: string;
    timestamp: string;
    blockNumber: number;
    hash: string;
    verifierId: string;
}

interface BlockchainProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    proof: BlockchainProof | null;
}

export const BlockchainProofModal: React.FC<BlockchainProofModalProps> = ({ isOpen, onClose, proof }) => {
    if (!proof) return null;

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Toast or notification could go here
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Blockchain Verification Record">
            <div style={{ padding: '1rem 0' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        display: 'inline-flex',
                        padding: '1rem',
                        borderRadius: '50%',
                        background: 'rgba(34, 197, 94, 0.1)',
                        marginBottom: '1rem',
                        border: '1px solid rgba(34, 197, 94, 0.2)'
                    }}>
                        <CheckCircle size={48} color="var(--color-success)" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Immutably Recorded</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                        This record is permanently stored on the verification blockchain.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <DetailRow label="Transaction ID" value={proof.txId} copyable />
                    <DetailRow label="Block Number" value={`#${proof.blockNumber}`} />
                    <DetailRow label="Timestamp" value={new Date(proof.timestamp).toLocaleString()} />
                    <DetailRow label="Record Hash" value={proof.hash} copyable />
                    <DetailRow label="Verifier Authority ID" value={proof.verifierId} />
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                    <a
                        href={`https://explorer.example.com/tx/${proof.txId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            color: 'var(--color-highlight)',
                            fontSize: '0.9rem',
                            textDecoration: 'none'
                        }}
                    >
                        View on Blockchain Explorer <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </Modal>
    );
};

const DetailRow = ({ label, value, copyable = false }: { label: string, value: string, copyable?: boolean }) => (
    <div style={{
        padding: '1rem',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--glass-border)'
    }}>
        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
            {label}
        </label>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                {value}
            </span>
            {copyable && (
                <button
                    onClick={() => navigator.clipboard.writeText(value)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
                    title="Copy"
                >
                    <Copy size={14} />
                </button>
            )}
        </div>
    </div>
);
