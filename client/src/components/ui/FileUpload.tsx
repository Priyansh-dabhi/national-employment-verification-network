import { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
    onFileSelect?: (file: File) => void;
    label?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, label = "Upload Document" }) => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        setSelectedFile(file);
        if (onFileSelect) onFileSelect(file);
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div style={{ width: '100%' }}>
            {label && <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{label}</label>}
            <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragOver ? 'var(--color-highlight)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragOver ? 'rgba(56, 189, 248, 0.05)' : 'transparent',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    minHeight: '160px'
                }}
            >
                <input
                    type="file"
                    ref={inputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />

                {selectedFile ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius-md)' }}>
                        <FileText color="var(--color-highlight)" />
                        <span style={{ fontWeight: 500 }}>{selectedFile.name}</span>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                        <button
                            onClick={removeFile}
                            style={{ background: 'none', border: 'none', color: 'var(--color-error)', marginLeft: '0.5rem', padding: '4px', display: 'flex' }}
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <>
                        <div style={{
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '1rem',
                            borderRadius: '50%',
                            color: 'var(--color-highlight)'
                        }}>
                            <UploadCloud size={32} />
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.25rem' }}>Click to upload or drag and drop</p>
                            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>PDF, JPG, or PNG (max 5MB)</p>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
};
