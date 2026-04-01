import { pool } from '../config/db.js';
import { generateSignedUrl } from '../utils/cloudinary.js';
import { decryptBuffer, decryptKeyWithMaster } from '../utils/encryption.js';

// GET /api/admin/review-documents
export const getReviewDocuments = async (req, res) => {
    try {
        const employeeQuery = `
            SELECT 
                d.id as "documentId",
                d.employee_id as "userId",
                d.document_type as "documentType",
                d.verification_status as "status",
                d.uploaded_at as "uploadedAt",
                e.full_name as "userName",
                'EMPLOYEE' as "userRole",
                (SELECT score FROM verification_logs vl WHERE vl.user_id = d.employee_id AND vl.document_type = d.document_type ORDER BY vl.created_at DESC LIMIT 1) as "score"
            FROM documents d
            JOIN employees e ON d.employee_id = e.id
            ORDER BY d.uploaded_at DESC;
        `;
        const employeeResult = await pool.query(employeeQuery);

        const employerQuery = `
            SELECT 
                ed.id as "documentId",
                ed.employer_id as "userId",
                ed.document_type as "documentType",
                ed.verification_status as "status",
                ed.uploaded_at as "uploadedAt",
                em.organization_name as "userName",
                'EMPLOYER' as "userRole",
                NULL as "score"
            FROM employer_documents ed
            JOIN employers em ON ed.employer_id = em.id
            ORDER BY ed.uploaded_at DESC;
        `;
        const employerResult = await pool.query(employerQuery);

        const employeeDocuments = employeeResult.rows;
        const employerDocuments = employerResult.rows;
        const allDocs = [...employeeDocuments, ...employerDocuments];
        
        const summary = {
            total: allDocs.length,
            verified: allDocs.filter(d => d.status === 'VERIFIED').length,
            underReview: allDocs.filter(d => d.status === 'UNDER_REVIEW' || d.status === 'PENDING').length,
            rejected: allDocs.filter(d => d.status === 'REJECTED' || d.status === 'REUPLOAD_REQUIRED').length
        };

        res.status(200).json({ summary, employeeDocuments, employerDocuments });
    } catch (error) {
        console.error('Error fetching review documents:', error);
        res.status(500).json({ message: 'Failed to fetch review documents' });
    }
};

// GET /api/admin/document/:id
export const getDocumentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.query; // 'EMPLOYEE' or 'EMPLOYER'

        let docQuery;
        if (role === 'EMPLOYER') {
            docQuery = await pool.query(`
                SELECT ed.*, em.organization_name as full_name, em.org_type, em.industry_sector
                FROM employer_documents ed
                JOIN employers em ON ed.employer_id = em.id
                WHERE ed.id = $1
            `, [id]);
        } else {
            docQuery = await pool.query(`
                SELECT d.*, e.full_name, e.date_of_birth, e.gender
                FROM documents d
                JOIN employees e ON d.employee_id = e.id
                WHERE d.id = $1
            `, [id]);
        }

        if (docQuery.rows.length === 0) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const document = docQuery.rows[0];

        let verificationLog = null;
        if (role !== 'EMPLOYER') {
            // Fetch latest verification log for this document type + user
            const logQuery = await pool.query(`
                SELECT score, details_json, created_at 
                FROM verification_logs 
                WHERE user_id = $1 AND document_type = $2
                ORDER BY created_at DESC LIMIT 1
            `, [document.employee_id, document.document_type]);

            verificationLog = logQuery.rows[0] || null;
        }

        // Download and Decrypt the document so it can be previewed in the browser
        const signedUrl = generateSignedUrl(document.public_id);
        let previewDataUrl = signedUrl; // Fallback

        try {
            const fileResponse = await fetch(signedUrl);
            if (fileResponse.ok) {
                const arrayBuffer = await fileResponse.arrayBuffer();
                const encryptedBuffer = Buffer.from(arrayBuffer);

                if (document.encrypted_key && document.encrypted_key.includes('|')) {
                    const [ivHex, encryptedKeyData] = document.encrypted_key.split('|');
                    const fileIv = Buffer.from(ivHex, 'hex');
                    const fileKey = decryptKeyWithMaster(encryptedKeyData);

                    const decryptedBuffer = decryptBuffer(encryptedBuffer, fileKey, fileIv);

                    let mimeType = 'application/octet-stream';
                    const hex = decryptedBuffer.toString('hex', 0, 4);
                    if (hex.startsWith('89504e47')) mimeType = 'image/png';
                    else if (hex.startsWith('ffd8ff')) mimeType = 'image/jpeg';
                    else if (hex.startsWith('25504446')) mimeType = 'application/pdf';

                    const base64Data = decryptedBuffer.toString('base64');
                    previewDataUrl = `data:${mimeType};base64,${base64Data}`;
                }
            }
        } catch (downloadErr) {
            console.error('Failed to download/decrypt file for preview:', downloadErr);
        }

        res.status(200).json({
            document: {
                ...document,
                signedUrl: previewDataUrl
            },
            verificationLog
        });
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ message: 'Failed to fetch document' });
    }
};

// POST /api/admin/action
export const adminAction = async (req, res) => {
    try {
        const { documentId, action, reason, role } = req.body;
        const adminId = req.user.id; // from JWT payload

        if (!['APPROVE', 'REJECT', 'REUPLOAD'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        let newDocStatus = '';
        let newAccStatus = '';

        if (action === 'APPROVE') {
            newDocStatus = 'VERIFIED';
            newAccStatus = 'VERIFIED';
        } else if (action === 'REJECT') {
            newDocStatus = 'REJECTED';
            newAccStatus = 'REJECTED'; 
        } else if (action === 'REUPLOAD') {
            newDocStatus = 'REUPLOAD_REQUIRED';
            newAccStatus = 'REJECTED'; // Lock further actions until re-uploaded and cleared
        }

        if (role === 'EMPLOYER') {
            const docQuery = await pool.query('SELECT employer_id, document_type FROM employer_documents WHERE id = $1', [documentId]);
            if (docQuery.rows.length === 0) return res.status(404).json({ message: 'Document not found' });
            
            const employerId = docQuery.rows[0].employer_id;
            
            await pool.query('UPDATE employer_documents SET verification_status = $1 WHERE id = $2', [newDocStatus, documentId]);
            await pool.query('UPDATE employers SET account_status = $1 WHERE id = $2', [newAccStatus, employerId]);
            
            // Also update the employer verification tracking request if it is PENDING
            await pool.query(
                `UPDATE employer_verification_requests 
                 SET status = $1, reviewed_at = NOW(), remarks = $2
                 WHERE employer_id = $3 AND status = 'PENDING'`,
                 [newDocStatus, reason, employerId]
            );
        } else {
            const docQuery = await pool.query('SELECT employee_id, document_type FROM documents WHERE id = $1', [documentId]);
            if (docQuery.rows.length === 0) return res.status(404).json({ message: 'Document not found' });
            
            const employeeId = docQuery.rows[0].employee_id;
            const docType = docQuery.rows[0].document_type;

            await pool.query('UPDATE documents SET verification_status = $1 WHERE id = $2', [newDocStatus, documentId]);
            await pool.query('UPDATE employees SET account_status = $1 WHERE id = $2', [newAccStatus, employeeId]);

            const details = JSON.stringify({ reason, adminId, action });
            await pool.query(`
                INSERT INTO verification_logs (user_id, document_type, score, status, details_json)
                VALUES ($1, $2, $3, $4, $5)
            `, [employeeId, docType, 100, action, details]);
        }

        // Add Mock Blockchain Ledger logic
        const mockHash = `ADMIN_ACTION_${role}_${documentId}_${Date.now()}`;
        await pool.query('INSERT INTO blockchain_records (document_hash, block_number) VALUES ($1, $2)', 
            [mockHash, Math.floor(Math.random() * 1000000)]);

        res.status(200).json({ message: `Document successfully ${action}D` });
    } catch (error) {
        console.error('Error executing admin action:', error);
        res.status(500).json({ message: 'Failed to execute admin action' });
    }
};
