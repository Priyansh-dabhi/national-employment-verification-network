import type { Document, VerificationStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const documentService = {
    getDocuments: async (userId: string): Promise<Document[]> => {
        const token = localStorage.getItem('nevn_token');
        const response = await fetch(`${API_URL}/documents`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch documents');
        }

        const data = await response.json();
        // Map backend format to frontend Document type
        return data.documents.map((doc: any): Document => ({
            id: doc.id.toString(),
            name: doc.document_type,
            type: doc.document_type,
            date: doc.uploaded_at,
            status: doc.verification_status.toLowerCase() as VerificationStatus,
            user_id: doc.employee_id?.toString() || userId
        }));
    },

    uploadDocument: async (file: File, metadata: any): Promise<Document> => {
        const token = localStorage.getItem('nevn_token');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', metadata.docType);

        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload document');
        }

        const data = await response.json();

        return {
            id: data.documentId.toString(),
            name: metadata.docType,
            type: metadata.docType,
            date: new Date().toISOString(), // Fallback or could fetch exact from backend later
            status: data.status.toLowerCase() as VerificationStatus,
            user_id: 'current' // Backend inherently assigns it to the current user
        };
    }
};
