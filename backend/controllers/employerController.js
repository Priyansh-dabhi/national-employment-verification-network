import { pool } from '../config/db.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

// ─── GET /api/employer/profile ───────────────────────────────────────
export const getProfile = async (req, res) => {
    try {
        const { id } = req.user;
        const result = await pool.query(
            `SELECT id, organization_name, email, org_type, industry_sector,
                    authorized_person_name, designation, city, state, account_status, created_at
             FROM employers WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employer not found' });
        }
        res.status(200).json({ profile: result.rows[0] });
    } catch (error) {
        console.error('getProfile error:', error);
        res.status(500).json({ message: 'Failed to fetch profile' });
    }
};

// ─── POST /api/employer/documents/upload ─────────────────────────────
export const uploadCompanyDocument = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const { document_type } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ message: 'No file uploaded' });
        if (!document_type) return res.status(400).json({ message: 'document_type is required' });

        const uploadResult = await uploadToCloudinary(file.buffer);
        const publicId = uploadResult.public_id;

        const dbResult = await pool.query(
            `INSERT INTO employer_documents (employer_id, document_type, public_id, verification_status)
             VALUES ($1, $2, $3, 'PENDING') RETURNING id, document_type, verification_status, uploaded_at`,
            [employerId, document_type, publicId]
        );

        res.status(201).json({ message: 'Document uploaded', document: dbResult.rows[0] });
    } catch (error) {
        console.error('uploadCompanyDocument error:', error);
        res.status(500).json({ message: 'Failed to upload document', error: error.message });
    }
};

// ─── GET /api/employer/documents ─────────────────────────────────────
export const getCompanyDocuments = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const result = await pool.query(
            `SELECT id, document_type, verification_status, uploaded_at
             FROM employer_documents WHERE employer_id = $1 ORDER BY uploaded_at DESC`,
            [employerId]
        );
        res.status(200).json({ documents: result.rows });
    } catch (error) {
        console.error('getCompanyDocuments error:', error);
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
};

// ─── POST /api/employer/verification/apply ───────────────────────────
export const applyForVerification = async (req, res) => {
    try {
        const { id: employerId } = req.user;

        // Check documents exist
        const docsResult = await pool.query(
            'SELECT id FROM employer_documents WHERE employer_id = $1 LIMIT 1',
            [employerId]
        );
        if (docsResult.rows.length === 0) {
            return res.status(400).json({ message: 'Please upload at least one company document before applying.' });
        }

        // Check no existing PENDING request
        const pendingResult = await pool.query(
            `SELECT id FROM employer_verification_requests WHERE employer_id = $1 AND status = 'PENDING'`,
            [employerId]
        );
        if (pendingResult.rows.length > 0) {
            return res.status(400).json({ message: 'A verification request is already pending.' });
        }

        // Create verification request
        const reqResult = await pool.query(
            `INSERT INTO employer_verification_requests (employer_id, status)
             VALUES ($1, 'PENDING') RETURNING id, status, submitted_at`,
            [employerId]
        );

        // Update employer status
        await pool.query(
            `UPDATE employers SET account_status = 'PENDING' WHERE id = $1`,
            [employerId]
        );

        res.status(201).json({
            message: 'Verification request submitted successfully.',
            request: reqResult.rows[0]
        });
    } catch (error) {
        console.error('applyForVerification error:', error);
        res.status(500).json({ message: 'Failed to apply for verification' });
    }
};

// ─── GET /api/employer/verification/status ───────────────────────────
export const getVerificationStatus = async (req, res) => {
    try {
        const { id: employerId } = req.user;

        const empResult = await pool.query(
            'SELECT account_status FROM employers WHERE id = $1',
            [employerId]
        );
        const latestReq = await pool.query(
            `SELECT status, submitted_at, reviewed_at, remarks
             FROM employer_verification_requests WHERE employer_id = $1
             ORDER BY submitted_at DESC LIMIT 1`,
            [employerId]
        );

        res.status(200).json({
            account_status: empResult.rows[0]?.account_status || 'UNVERIFIED',
            latest_request: latestReq.rows[0] || null
        });
    } catch (error) {
        console.error('getVerificationStatus error:', error);
        res.status(500).json({ message: 'Failed to fetch verification status' });
    }
};

// ─── POST /api/employer/request-verification ─────────────────────────
export const requestEmployeeVerification = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const { employee_email, position, reason } = req.body;

        if (!employee_email) return res.status(400).json({ message: 'employee_email is required' });

        // Lookup employee
        const empResult = await pool.query(
            'SELECT id, full_name, email, account_status FROM employees WHERE email = $1',
            [employee_email]
        );
        if (empResult.rows.length === 0) {
            return res.status(404).json({ message: 'No employee found with that email address.' });
        }
        const employee = empResult.rows[0];

        // Insert or update company_employees link
        await pool.query(
            `INSERT INTO company_employees (employer_id, employee_id, position, status, joined_at)
             VALUES ($1, $2, $3, 'ACTIVE', NOW())
             ON CONFLICT (employer_id, employee_id) DO UPDATE SET status = 'ACTIVE', position = EXCLUDED.position, left_at = NULL`,
            [employerId, employee.id, position || null]
        );

        res.status(200).json({
            message: `Verification request sent for ${employee.full_name}.`,
            employee: {
                id: employee.id,
                full_name: employee.full_name,
                email: employee.email,
                account_status: employee.account_status
            }
        });
    } catch (error) {
        console.error('requestEmployeeVerification error:', error);
        res.status(500).json({ message: 'Failed to request verification', error: error.message });
    }
};

// ─── GET /api/employer/verification-requests ─────────────────────────
export const getVerificationRequests = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const result = await pool.query(
            `SELECT ce.id, e.full_name, e.email, e.account_status as employee_status,
                    ce.position, ce.status as employment_status, ce.joined_at, ce.left_at
             FROM company_employees ce
             JOIN employees e ON ce.employee_id = e.id
             WHERE ce.employer_id = $1
             ORDER BY ce.joined_at DESC`,
            [employerId]
        );
        res.status(200).json({ requests: result.rows });
    } catch (error) {
        console.error('getVerificationRequests error:', error);
        res.status(500).json({ message: 'Failed to fetch verification requests' });
    }
};

// ─── GET /api/employer/verified-employees ────────────────────────────
export const getVerifiedEmployees = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const result = await pool.query(
            `SELECT e.id, e.full_name, e.email, e.city, e.state, ce.position, ce.joined_at
             FROM company_employees ce
             JOIN employees e ON ce.employee_id = e.id
             WHERE ce.employer_id = $1 AND e.account_status = 'VERIFIED'
             ORDER BY ce.joined_at DESC`,
            [employerId]
        );
        res.status(200).json({ employees: result.rows });
    } catch (error) {
        console.error('getVerifiedEmployees error:', error);
        res.status(500).json({ message: 'Failed to fetch verified employees' });
    }
};

// ─── GET /api/employer/employees ─────────────────────────────────────
export const getCompanyEmployees = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const result = await pool.query(
            `SELECT e.id, e.full_name, e.email, e.city, e.state, e.account_status,
                    ce.position, ce.status as employment_status, ce.joined_at, ce.left_at
             FROM company_employees ce
             JOIN employees e ON ce.employee_id = e.id
             WHERE ce.employer_id = $1
             ORDER BY ce.joined_at DESC`,
            [employerId]
        );
        res.status(200).json({ employees: result.rows });
    } catch (error) {
        console.error('getCompanyEmployees error:', error);
        res.status(500).json({ message: 'Failed to fetch company employees' });
    }
};

// ─── POST /api/employer/employees/:id/leave ──────────────────────────
export const markEmployeeLeft = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const { id: employeeId } = req.params;

        const result = await pool.query(
            `UPDATE company_employees SET status = 'LEFT', left_at = NOW()
             WHERE employer_id = $1 AND employee_id = $2
             RETURNING id, status, left_at`,
            [employerId, employeeId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Employee record not found for this employer.' });
        }
        res.status(200).json({ message: 'Employee marked as left.', record: result.rows[0] });
    } catch (error) {
        console.error('markEmployeeLeft error:', error);
        res.status(500).json({ message: 'Failed to update employee status' });
    }
};
