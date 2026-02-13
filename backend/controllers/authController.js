import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const registerEmployee = async (req, res) => {
    const { email, mobile, password, details } = req.body;
    // details contains: fullName, dob, gender, employmentStatus, city, state

    if (!email || !mobile || !password || !details.fullName) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM employees WHERE email = $1 OR mobile = $2', [email, mobile]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Email or Mobile already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO employees (email, mobile, password, full_name, date_of_birth, gender, employment_status, city, state) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, full_name, account_status`,
            [email, mobile, hashedPassword, details.fullName, details.dob, details.gender, details.employmentStatus, details.city, details.state]
        );

        res.status(201).json({ message: 'Employee registered successfully', user: newUser.rows[0], role: 'employee' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const registerEmployer = async (req, res) => {
    const { email, mobile, password, details } = req.body;
    // details contains: organizationName, organizationType, industrySector, authorizedPersonName, authorizedPersonDesignation, city, state

    if (!email || !mobile || !password || !details.organizationName) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const userCheck = await pool.query('SELECT * FROM employers WHERE email = $1 OR mobile = $2', [email, mobile]);
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Email or Mobile already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await pool.query(
            `INSERT INTO employers (email, mobile, password, organization_name, org_type, industry_sector, authorized_person_name, designation, city, state) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id, email, organization_name, account_status`,
            [email, mobile, hashedPassword, details.organizationName, details.organizationType, details.industrySector, details.authorizedPersonName, details.authorizedPersonDesignation, details.city, details.state]
        );

        res.status(201).json({ message: 'Employer registered successfully', user: newUser.rows[0], role: 'employer' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export const login = async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Email, password, and role are required' });
    }

    try {
        let userResult;
        let dbRole;

        if (role.toLowerCase() === 'employee') {
            userResult = await pool.query('SELECT * FROM employees WHERE email = $1', [email]);
            dbRole = 'employee';
        } else if (role.toLowerCase() === 'employer') {
            userResult = await pool.query('SELECT * FROM employers WHERE email = $1', [email]);
            dbRole = 'employer';
        } else {
            return res.status(400).json({ message: 'Invalid role selected' });
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: dbRole, account_status: user.account_status },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            role: dbRole,
            account_status: user.account_status,
            user: {
                id: user.id,
                name: dbRole === 'employee' ? user.full_name : user.organization_name,
                email: user.email
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const getMe = async (req, res) => {
    try {
        // req.user is populated by authMiddleware
        const { id, role } = req.user;

        let userResult;
        if (role === 'employee') {
            userResult = await pool.query(
                `SELECT id, email, full_name, mobile, date_of_birth, gender, employment_status, city, state, account_status 
                 FROM employees WHERE id = $1`,
                [id]
            );
        } else {
            userResult = await pool.query(
                `SELECT id, email, organization_name, org_type, industry_sector, authorized_person_name, designation, mobile, city, state, account_status 
                 FROM employers WHERE id = $1`,
                [id]
            );
        }

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user: userResult.rows[0], role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching user details' });
    }
};
