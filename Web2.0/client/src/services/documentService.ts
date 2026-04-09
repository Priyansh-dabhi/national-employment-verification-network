import type { Document, VerificationStatus } from '../types';
import { apiClient } from './apiClient';

interface BackendDocument {
  id: number;
  document_type: string;
  uploaded_at: string;
  verification_status: string;
  employee_id?: number;
}

interface UploadMetadata {
  docType: string;
  docId?: string;
}

export const documentService = {
  getDocuments: async (userId: string): Promise<Document[]> => {
    const data = await apiClient.request<{ documents?: BackendDocument[] }>('/documents');

    return (data.documents || []).map((doc) => ({
      id: String(doc.id),
      name: doc.document_type,
      type: doc.document_type,
      date: doc.uploaded_at,
      status: doc.verification_status.toLowerCase() as VerificationStatus,
      user_id: String(doc.employee_id || userId),
    }));
  },

  uploadDocument: async (file: File, metadata: UploadMetadata): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', metadata.docType);

    if (metadata.docId) {
      formData.append('document_id', metadata.docId);
    }

    const data = await apiClient.request<{ documentId?: string | number; status?: string }>('/documents/upload', {
      method: 'POST',
      body: formData,
    });

    return {
      id: String(data.documentId),
      name: metadata.docType,
      type: metadata.docType,
      date: new Date().toISOString(),
      status: (data.status || 'PENDING').toLowerCase() as VerificationStatus,
      user_id: 'current',
    };
  },
};
