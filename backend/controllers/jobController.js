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
