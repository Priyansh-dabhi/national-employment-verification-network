import { pool } from '../config/db.js';
import { uploadToCloudinary, generateSignedUrl } from '../utils/cloudinary.js';
import {
    encryptBuffer,
    encryptKeyWithMaster,
    generateFileKey,
    generateIV
} from '../utils/encryption.js';

export const uploadDocument = async (req, res) => {
    try {
        const { id: employeeId } = req.user;
        const { document_type } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        if (!document_type) {
            return res.status(400).json({ message: 'Document type is required' });
        }

        // 1. Generate Encryption Elements
        const fileKey = generateFileKey();
        const iv = generateIV();

        // 2. Encrypt the file buffer
        const encryptedFileBuffer = encryptBuffer(file.buffer, fileKey, iv);

        // 3. Upload encrypted buffer to Cloudinary using private store
        const uploadResult = await uploadToCloudinary(encryptedFileBuffer);
        const publicId = uploadResult.public_id;

        // 4. Encrypt the file key with the MASTER KEY, format output for storage
        const encryptedKeyData = encryptKeyWithMaster(fileKey);
        // We also need to store the IV used to encrypt the *file* itself.
        // We can prepend it: `${fileIvHex}|${encryptedKeyData}`
        const finalKeyString = `${iv.toString('hex')}|${encryptedKeyData}`;

        // 5. Store Metadata in Database
        const dbResult = await pool.query(
            `INSERT INTO documents 
            (employee_id, document_type, public_id, encrypted_key, file_size, verification_status) 
            VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, verification_status`,
            [employeeId, document_type, publicId, finalKeyString, file.size, 'PENDING']
        );

        const newDoc = dbResult.rows[0];

        res.status(201).json({
            message: 'Document uploaded securely',
            documentId: newDoc.id,
            status: newDoc.verification_status
        });
    } catch (error) {
        console.error('Error in uploadDocument:', error);
        res.status(500).json({ message: 'Failed to upload document securely', error: error.message });
    }
};

export const viewDocument = async (req, res) => {
    try {
        const { id: documentId } = req.params;
        const { id: userId, role } = req.user;

        // 1. Fetch document metadata
        const dbResult = await pool.query('SELECT * FROM documents WHERE id = $1', [documentId]);

        if (dbResult.rows.length === 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const document = dbResult.rows[0];

        // 2. Enforce Role-Based Access Control
        if (role === 'employee' && document.employee_id !== userId) {
            return res.status(403).json({ message: 'Forbidden: You can only view your own documents' });
        }

        if (role === 'employer') {
            return res.status(403).json({ message: 'Forbidden: Employers cannot view raw documents directly' });
        }

        // If admin -> allow (assuming admin role might be added later)

        // 3. Generate Signed URL
        const signedUrl = generateSignedUrl(document.public_id);

        res.status(200).json({ signedUrl });

    } catch (error) {
        console.error('Error in viewDocument:', error);
        res.status(500).json({ message: 'Failed to generate signed URL' });
    }
};

export const getMyDocuments = async (req, res) => {
    try {
        const { id: userId, role } = req.user;

        if (role !== 'employee') {
            return res.status(403).json({ message: 'Forbidden. Only employees can list their documents here.' });
        }

        const dbResult = await pool.query(
            'SELECT id, document_type, file_size, verification_status, uploaded_at FROM documents WHERE employee_id = $1 ORDER BY uploaded_at DESC',
            [userId]
        );

        res.status(200).json({ documents: dbResult.rows });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
};
