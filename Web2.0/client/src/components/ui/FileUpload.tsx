import { type DragEvent, type MouseEvent, useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  label?: string;
  accept?: string;
  maxSizeMb?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  label = 'Upload Document',
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSizeMb = 5,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const maxBytes = maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File size must be ${maxSizeMb} MB or less.`);
      return;
    }

    setError(null);
    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setSelectedFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={{ width: '100%' }}>
      {label && <label className="field-label">{label}</label>}

      <motion.div
        whileHover={{ y: -1 }}
        className={['ui-file-upload', isDragOver ? 'is-drag-over' : '', error ? 'is-error' : ''].filter(Boolean).join(' ')}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {selectedFile ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <FileText color="var(--color-highlight)" size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedFile.name}</span>
            <span className="muted" style={{ fontSize: '0.78rem' }}>
              ({(selectedFile.size / 1024).toFixed(0)} KB)
            </span>
            <button
              type="button"
              onClick={clearFile}
              aria-label="Remove selected file"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '999px',
                padding: '0.22rem',
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '999px',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(56, 189, 248, 0.14)',
                color: 'var(--color-highlight)',
              }}
            >
              <UploadCloud size={24} />
            </div>
            <div>
              <p style={{ fontWeight: 700, marginBottom: '0.2rem' }}>Drop file or click to browse</p>
              <p className="muted" style={{ fontSize: '0.82rem' }}>
                Supported: {accept} up to {maxSizeMb} MB
              </p>
            </div>
          </>
        )}
      </motion.div>

      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
};
