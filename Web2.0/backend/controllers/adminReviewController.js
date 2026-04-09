import { pool } from '../config/db.js';
import { generateSignedUrl } from '../utils/cloudinary.js';
import { decryptBuffer, decryptKeyWithMaster } from '../utils/encryption.js';
import { mintEmployeeIdentity, mintCompanyIdentity } from '../services/web3IdentityService.js';

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
            newDocStatus = 'VERIFIED'; // Default, will override for Employees below
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
            
            // Phase 4: Trigger Web3 Identity Minting for Company First
            if (action === 'APPROVE') {
                try {
                    await mintCompanyIdentity(employerId);
                } catch (err) {
                    console.error("Web3 Company Minting Error:", err);
                    return res.status(500).json({ message: 'Failed to mint company identity on ledger. Account remains unverified.' });
                }
            }

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

            // Phase 4: Trigger Web3 Identity Minting for Employee First
            if (action === 'APPROVE') {
                // For Employees, we set status to PROCESSING because web3 registration is asynchronous
                newDocStatus = 'PROCESSING';
                newAccStatus = 'PROCESSING';
                try {
                    await mintEmployeeIdentity(employeeId);
                } catch (err) {
                    console.error("Web3 Employee Minting Error:", err);
                    return res.status(500).json({ message: 'Failed to mint employee identity on ledger. Account remains unverified.' });
                }
            }

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

// ─── GET /api/admin/audit-timeline ───────────────────────────────────
export const getAuditTimeline = async (req, res) => {
    try {
        const { limit = 50, offset = 0, functionName } = req.query;
        
        let query = `
            SELECT 
                mlt.id, mlt.tx_id, mlt.block_number, mlt.channel_name, mlt.chaincode_name,
                mlt.function_name, mlt.args, mlt.caller_msp, mlt.caller_role, mlt.status, mlt.timestamp,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'peer_name', me.peer_name,
                            'msp_id', me.msp_id,
                            'signature_hash', me.signature_hash,
                            'endorsed_at', me.endorsed_at
                        )
                    ) FILTER (WHERE me.id IS NOT NULL), '[]'
                ) as endorsements
            FROM mock_ledger_transactions mlt
            LEFT JOIN mock_endorsements me ON mlt.tx_id = me.tx_id
        `;
        
        const params = [];
        if (functionName) {
            params.push(functionName);
            query += ` WHERE mlt.function_name = $${params.length}`;
        }
        
        query += ` GROUP BY mlt.id ORDER BY mlt.timestamp DESC`;
        params.push(parseInt(limit));
        query += ` LIMIT $${params.length}`;
        params.push(parseInt(offset));
        query += ` OFFSET $${params.length}`;

        const result = await pool.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) as total FROM mock_ledger_transactions';
        const countParams = [];
        if (functionName) {
            countParams.push(functionName);
            countQuery += ` WHERE function_name = $1`;
        }
        const countResult = await pool.query(countQuery, countParams);

        res.status(200).json({
            transactions: result.rows,
            total: parseInt(countResult.rows[0].total),
            limit: parseInt(limit),
            offset: parseInt(offset)
        });
    } catch (error) {
        console.error('getAuditTimeline error:', error);
        res.status(500).json({ message: 'Failed to fetch audit timeline' });
    }
};

// ─── GET /api/admin/employment-stats ─────────────────────────────────
export const getEmploymentStats = async (req, res) => {
    try {
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE status = 'PROPOSED') as proposed,
                COUNT(*) FILTER (WHERE status = 'CONSENTED') as consented,
                COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
                COUNT(*) FILTER (WHERE status = 'TERMINATED') as terminated,
                COUNT(*) as total
            FROM employment_records
        `);

        const ledgerStats = await pool.query(`
            SELECT COUNT(*) as total_blocks,
                   COUNT(DISTINCT tx_id) as total_transactions
            FROM mock_ledger_transactions
        `);

        const companyStats = await pool.query(`
            SELECT tier, COUNT(*) as count FROM employers WHERE account_status = 'VERIFIED' GROUP BY tier
        `);

        res.status(200).json({
            employment: statsResult.rows[0],
            ledger: ledgerStats.rows[0],
            companies: companyStats.rows
        });
    } catch (error) {
        console.error('getEmploymentStats error:', error);
        res.status(500).json({ message: 'Failed to fetch employment stats' });
    }
};

// ─── GET /api/admin/employment-records ───────────────────────────────
export const getAllEmploymentRecords = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT er.*, 
                   e.full_name as employee_name, e.email as employee_email,
                   emp.organization_name, emp.tier
            FROM employment_records er
            JOIN employees e ON er.employee_id = e.id
            JOIN employers emp ON er.employer_id = emp.id
            ORDER BY er.created_at DESC
        `);
        res.status(200).json({ records: result.rows });
    } catch (error) {
        console.error('getAllEmploymentRecords error:', error);
        res.status(500).json({ message: 'Failed to fetch employment records' });
    }
};
