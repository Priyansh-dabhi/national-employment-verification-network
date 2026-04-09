import { pool } from '../config/db.js';
import Tesseract from 'tesseract.js';
import crypto from 'crypto';
import { mintEmployeeIdentity } from '../services/web3IdentityService.js';

export const uploadAndVerifyDocument = async (req, res) => {
    try {
        const userId = req.user.id;
        const { idType, idNumber } = req.body;
        const file = req.file;

        if (!idType || !idNumber || !file) {
            return res.status(400).json({ message: 'Missing required fields (idType, idNumber, file)' });
        }

        let score = 0;
        let details = {
            formatCheck: false,
            ocrMatch: false,
            databaseMatch: false,
            crossValidation: false,
            blockchainVerified: false
        };

        // --- Layer 1: Format Validation ---
        let formatValid = false;
        if (idType === 'PAN' && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(idNumber)) formatValid = true;
        if (idType === 'AADHAAR' && /^[0-9]{12}$/.test(idNumber)) formatValid = true;
        if (idType === 'DL' && /^[A-Z]{2}[0-9]{2}\s?[0-9]{4}[0-9]{7}$/.test(idNumber)) formatValid = true;

        if (formatValid) {
            score += 20;
            details.formatCheck = true;
        } else {
            return res.status(400).json({ status: 'REJECTED', score, message: 'Invalid ID Format' });
        }

        // --- Layer 2: OCR Extraction ---
        // Fetch user info to match name
        const userQuery = await pool.query('SELECT full_name, date_of_birth FROM employees WHERE id = $1', [userId]);
        const user = userQuery.rows[0];

        try {
            const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
            const extractedText = text.toUpperCase();
            const userNameNormalized = user.full_name.toUpperCase();

            // Check if name or ID number exists in extracted text
            if (extractedText.includes(userNameNormalized) || extractedText.includes(idNumber.toUpperCase())) {
                score += 20;
                details.ocrMatch = true;
            }
        } catch (ocrError) {
            console.error('OCR Extraction failed:', ocrError);
            // Non-fatal, OCR just contributes to the score
        }

        // --- Layer 3: Simulated Database Check ---
        const dbCheck = await pool.query('SELECT * FROM verified_ids WHERE id_type = $1 AND id_number = $2 AND full_name = $3', [idType, idNumber, user.full_name]);
        if (dbCheck.rows.length > 0) {
            score += 30;
            details.databaseMatch = true;
        }

        // --- Layer 4: Cross-Validation ---
        // Verify against previous documents from this user
        const previousDocs = await pool.query('SELECT * FROM verification_logs WHERE user_id = $1 AND status = $2', [userId, 'VERIFIED']);
        if (previousDocs.rows.length > 0) {
            // Found trusted history
            score += 20;
            details.crossValidation = true;
        } else if (details.ocrMatch && details.formatCheck) {
            // Seed trust for first time upload
            score += 20;
            details.crossValidation = true;
        }

        // --- Layer 5: Blockchain Integrity ---
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        try {
            await pool.query('INSERT INTO blockchain_records (document_hash, block_number) VALUES ($1, $2)', [hash, Math.floor(Math.random() * 1000000)]);
            score += 10;
            details.blockchainVerified = true;
        } catch (err) {
            // Might already exist due to UNIQUE contraint, or db err.
            if (err.code === '23505') { 
                // Hash already exists, still considered valid integrity check
                score += 10;
                details.blockchainVerified = true;
            }
        }

        // Determine Final Status
        let status = 'REJECTED';
        if (score >= 85) status = 'VERIFIED';
        else if (score >= 50) status = 'UNDER REVIEW';

        // Log Verification Attempt
        await pool.query('INSERT INTO verification_logs (user_id, document_type, score, status, details_json) VALUES ($1, $2, $3, $4, $5)', 
            [userId, idType, score, status, JSON.stringify(details)]);

        // Update Account Status
        if (status === 'VERIFIED') {
            try {
                // Phase 4: Trigger Web3 Identity Minting First
                await mintEmployeeIdentity(userId);

                // If minting succeeds, mark as VERIFIED
                await pool.query("UPDATE employees SET account_status = 'VERIFIED' WHERE id = $1", [userId]);
            } catch (err) {
                console.error("Web3 Minting Error:", err);
                
                // Revert status in logs DB since the minting failed
                await pool.query(
                    "UPDATE verification_logs SET status = 'UNDER REVIEW' WHERE user_id = $1 AND document_type = $2 AND status = 'VERIFIED' RETURNING id", 
                    [userId, idType]
                );
                await pool.query("UPDATE employees SET account_status = 'PENDING' WHERE id = $1", [userId]);
                
                status = 'UNDER REVIEW'; // Change returned status to reflect failure
            }
        } else if (status === 'UNDER REVIEW') {
            await pool.query("UPDATE employees SET account_status = 'PENDING' WHERE id = $1", [userId]);
        }

        return res.status(200).json({ status, score, details });

    } catch (error) {
        console.error('Automated Verification Error:', error);
        res.status(500).json({ message: 'Internal Server Error during verification' });
    }
};

export const applyForEmployeeVerification = async (req, res) => {
    try {
        const userId = req.user.id;

        const employeeResult = await pool.query(
            'SELECT id, account_status FROM employees WHERE id = $1',
            [userId]
        );

        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee account not found.' });
        }

        const employee = employeeResult.rows[0];

        if (employee.account_status === 'VERIFIED') {
            return res.status(400).json({ message: 'Your account is already verified.' });
        }

        const docsResult = await pool.query(
            'SELECT id FROM documents WHERE employee_id = $1 LIMIT 1',
            [userId]
        );

        if (docsResult.rows.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one document before applying.' });
        }

        const latestLogResult = await pool.query(
            `SELECT status
             FROM verification_logs
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT 1`,
            [userId]
        );

        if (latestLogResult.rows[0]?.status === 'UNDER REVIEW') {
            return res.status(400).json({ message: 'A verification request is already under review.' });
        }

        await pool.query(
            `INSERT INTO verification_logs (user_id, document_type, score, status, details_json)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                userId,
                'MANUAL_SUBMISSION',
                0,
                'UNDER REVIEW',
                JSON.stringify({ source: 'employee_apply', submitted_at: new Date().toISOString() }),
            ]
        );

        await pool.query(
            "UPDATE employees SET account_status = 'PENDING' WHERE id = $1",
            [userId]
        );

        return res.status(201).json({
            message: 'Verification request submitted successfully.',
            account_status: 'PENDING',
        });
    } catch (error) {
        console.error('applyForEmployeeVerification error:', error);
        return res.status(500).json({ message: 'Failed to submit verification request.' });
    }
};

export const getVerificationStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Ensure user is checking their own status or is an authorized admin
        if (req.user.role === 'employee' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        const result = await pool.query('SELECT * FROM verification_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'No verification records found.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching status:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
