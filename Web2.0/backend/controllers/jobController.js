

import { pool } from '../config/db.js';

// 1. Create Job (Employer Only)
export const createJob = async (req, res) => {
    try {
        const { title, description, location, salary_range } = req.body;
        const employer_id = req.user.id;

        const newJob = await pool.query(
            'INSERT INTO jobs (employer_id, title, description, location, salary_range) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [employer_id, title, description, location, salary_range]
        );

        res.status(201).json(newJob.rows[0]);
    } catch (error) {
        console.error('Error creating job:', error);
        res.status(500).json({ message: 'Server error creating job.' });
    }
};

// 2. Get All Jobs (Employee)
export const getAllJobs = async (req, res) => {
    try {
        const jobs = await pool.query(`
            SELECT j.*, e.organization_name 
            FROM jobs j
            JOIN employers e ON j.employer_id = e.id
            ORDER BY j.created_at DESC
        `);
        res.status(200).json(jobs.rows);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs.' });
    }
};

// 3. Apply for Job (Employee Only)
export const applyForJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const employee_id = req.user.id;

        // Check if job exists
        const jobExists = await pool.query('SELECT id FROM jobs WHERE id = $1', [jobId]);
        if (jobExists.rows.length === 0) {
            return res.status(404).json({ message: 'Job not found.' });
        }

        // Apply
        const newApplication = await pool.query(
            'INSERT INTO job_applications (job_id, employee_id, status) VALUES ($1, $2, $3) RETURNING *',
            [jobId, employee_id, 'APPLIED']
        );

        res.status(201).json(newApplication.rows[0]);
    } catch (error) {
        if (error.code === '23505') { // unique_violation
            return res.status(400).json({ message: 'You have already applied for this job.' });
        }
        console.error('Error applying for job:', error);
        res.status(500).json({ message: 'Server error applying for job.' });
    }
};

// 4. Get Employer Jobs
export const getEmployerJobs = async (req, res) => {
    try {
        const employer_id = req.user.id;
        const jobs = await pool.query(`
            SELECT j.*, COUNT(ja.id) as applications_count 
            FROM jobs j
            LEFT JOIN job_applications ja ON j.id = ja.job_id
            WHERE j.employer_id = $1 
            GROUP BY j.id
            ORDER BY j.created_at DESC
        `, [employer_id]);
        res.status(200).json(jobs.rows);
    } catch (error) {
        console.error('Error fetching employer jobs:', error);
        res.status(500).json({ message: 'Server error fetching jobs.' });
    }
};

// 5. Get Applicants for Job (Employer)
export const getJobApplicants = async (req, res) => {
    try {
        const { jobId } = req.params;
        const employer_id = req.user.id;

        // Verify the job belongs to this employer
        const jobCheck = await pool.query('SELECT id FROM jobs WHERE id = $1 AND employer_id = $2', [jobId, employer_id]);
        if (jobCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Forbidden or Job not found.' });
        }

        const applicants = await pool.query(`
            SELECT 
                ja.status as application_status, ja.applied_at, ja.id as application_id,
                e.id as employee_id, e.full_name as name, e.email, e.account_status as account_status
            FROM job_applications ja
            JOIN employees e ON ja.employee_id = e.id
            WHERE ja.job_id = $1
            ORDER BY ja.applied_at DESC
        `, [jobId]);

        res.status(200).json(applicants.rows);
    } catch (error) {
        console.error('Error fetching applicants:', error);
        res.status(500).json({ message: 'Server error fetching applicants.' });
    }
};

// 6. Get Employee Applications
export const getEmployeeApplications = async (req, res) => {
    try {
        const employee_id = req.user.id;

        const applications = await pool.query(`
            SELECT 
                ja.id as application_id, ja.status, ja.applied_at,
                j.title, j.location, j.salary_range,
                e.organization_name
            FROM job_applications ja
            JOIN jobs j ON ja.job_id = j.id
            JOIN employers e ON j.employer_id = e.id
            WHERE ja.employee_id = $1
            ORDER BY ja.applied_at DESC
        `, [employee_id]);

        res.status(200).json(applications.rows);
    } catch (error) {
        console.error('Error fetching applications:', error);
        res.status(500).json({ message: 'Server error fetching applications.' });
    }
};

// 7. Get Pending Job Offers (Employee)
export const getPendingOffers = async (req, res) => {
    try {
        const employeeId = req.user.id;
        
        const offers = await pool.query(`
            SELECT 
                ce.id as proposal_id, ce.position, ce.joined_at as proposed_at,
                e.organization_name, e.city, e.industry_sector, e.id as employer_id
            FROM company_employees ce
            JOIN employers e ON ce.employer_id = e.id
            WHERE ce.employee_id = $1 AND ce.status = 'PROPOSED'
            ORDER BY ce.joined_at DESC
        `, [employeeId]);

        res.status(200).json({ offers: offers.rows });
    } catch (error) {
        console.error('getPendingOffers error:', error);
        res.status(500).json({ message: 'Server error fetching pending offers.' });
    }
};

// 8. Consent to Hire (Employee)
export const consentHire = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const { employerId } = req.body;

        if (!employerId) {
            return res.status(400).json({ message: "employerId is required" });
        }

        // Validate the proposal exists
        const check = await pool.query(
            "SELECT id FROM company_employees WHERE employee_id = $1 AND employer_id = $2 AND status = 'PROPOSED'",
            [employeeId, employerId]
        );

        if (check.rows.length === 0) {
            return res.status(404).json({ message: "No pending offer found from this employer." });
        }

        // We do NOT update the DB to ACTIVE here. 
        // We let the Webhook (EmploymentConsented) update the DB!
        // For optimisitic UI, we can update it to 'CONSENTING'.
        await pool.query(
            "UPDATE company_employees SET status = 'CONSENTING' WHERE employee_id = $1 AND employer_id = $2",
            [employeeId, employerId]
        );

        // Fetch web3 IDs
        const empQuery = await pool.query('SELECT web3_employee_id FROM employees WHERE id = $1', [employeeId]);
        const compQuery = await pool.query('SELECT web3_company_id FROM employers WHERE id = $1', [employerId]);

        // Call Gateway
        const gatewayUrl = process.env.NEVS_GATEWAY_URL || 'http://localhost:3000';
        const internalApiKey = process.env.INTERNAL_API_KEY || 'nevs-internal-secret-key';
        
        try {
            const { default: axios } = await import('axios');
            await axios.post(
                `${gatewayUrl}/api/internal/consent-employment`,
                {
                    employeeID: empQuery.rows[0].web3_employee_id,
                    companyID: compQuery.rows[0].web3_company_id
                },
                {
                    headers: { 'x-api-key': internalApiKey }
                }
            );
        } catch (gateErr) {
            console.error("Gateway call failed for consent-hire:", gateErr.response ? gateErr.response.data : gateErr.message);
        }

        res.status(200).json({ message: "Consent submitted to blockchain." });
    } catch (error) {
        console.error('consentHire error:', error);
        res.status(500).json({ message: 'Server error submitting consent.' });
    }
};
