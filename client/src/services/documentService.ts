import type { Document, VerificationStatus } from '../types';

const MOCK_DOCS: Document[] = [
    { id: '1', name: 'National ID Card', type: 'Identity', date: '2023-05-12', status: 'verified', user_id: 'user_123' },
    { id: '2', name: 'University Degree', type: 'Education', date: '2023-06-20', status: 'verified', user_id: 'user_123' },
    { id: '3', name: 'Employment Contract', type: 'Work', date: '2024-01-15', status: 'pending', user_id: 'user_123' },
];

export const documentService = {
    getDocuments: async (userId: string): Promise<Document[]> => {
        return new Promise((resolve) => {
            // Mock filtering by userId
            const userDocs = MOCK_DOCS.filter(d => d.user_id !== userId + '_invalid');
            setTimeout(() => resolve(userDocs), 800);
        });
    },

    uploadDocument: async (_file: File, metadata: any): Promise<Document> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const newDoc: Document = {
                    id: Date.now().toString(),
                    name: metadata.docType, // Using type as name for simplicity in mock
                    type: metadata.docType,
                    date: new Date().toISOString().split('T')[0],
                    status: 'pending' as VerificationStatus,
                    user_id: 'user_123'
                };
                MOCK_DOCS.unshift(newDoc); // Add to local mock state
                resolve(newDoc);
            }, 1500);
        });
    }
};
