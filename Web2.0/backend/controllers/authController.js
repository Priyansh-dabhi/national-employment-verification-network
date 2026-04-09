import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
import {
    REFRESH_COOKIE_NAME,
    clearRefreshTokenCookie,
    getCookieValue,
    getRefreshExpiryDate,
    hashToken,
    setRefreshTokenCookie,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../utils/authTokens.js';

const getUserQueryByRole = (role) => {
    if (role === 'employee') {
        return {
            authQuery: 'SELECT * FROM employees WHERE email = $1',
            profileQuery: `SELECT id, email, full_name, mobile, date_of_birth, gender, employment_status, city, state, account_status 
                 FROM employees WHERE id = $1`,
        };
    }

    return {
        authQuery: 'SELECT * FROM employers WHERE email = $1',
        profileQuery: `SELECT id, email, organization_name, org_type, industry_sector, authorized_person_name, designation, mobile, city, state, account_status 
                 FROM employers WHERE id = $1`,
    };
};

const mapLoginUser = (user, role) => ({
    id: user.id,
    name: role === 'employee' ? user.full_name : user.organization_name,
    email: user.email,
});

const issueTokensForUser = async (res, user) => {
    const tokenPayload = {
        id: user.id,
        role: user.role,
        account_status: user.account_status,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });

    await pool.query(
        `INSERT INTO refresh_tokens (user_id, role, token_hash, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [user.id, user.role, hashToken(refreshToken), getRefreshExpiryDate()],
    );

    setRefreshTokenCookie(res, refreshToken);

    return accessToken;
};

const rotateRefreshToken = async (res, storedTokenId, user) => {
    const accessToken = signAccessToken({
        id: user.id,
        role: user.role,
        account_status: user.account_status,
    });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role });

    await pool.query(
        `UPDATE refresh_tokens
         SET token_hash = $1, expires_at = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [hashToken(refreshToken), getRefreshExpiryDate(), storedTokenId],
    );

    setRefreshTokenCookie(res, refreshToken);

    return accessToken;
};

const getUserById = async (id, role) => {
    const { profileQuery } = getUserQueryByRole(role);
    const result = await pool.query(profileQuery, [id]);
    return result.rows[0] || null;
};

const revokeRefreshToken = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hashToken(refreshToken)]);
};

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
            userResult = await pool.query(getUserQueryByRole('employee').authQuery, [email]);
            dbRole = 'employee';
        } else if (role.toLowerCase() === 'employer') {
            userResult = await pool.query(getUserQueryByRole('employer').authQuery, [email]);
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

        const token = await issueTokensForUser(res, {
            id: user.id,
            role: dbRole,
            account_status: user.account_status,
        });

        res.status(200).json({
            message: 'Login successful',
            token,
            role: dbRole,
            account_status: user.account_status,
            user: mapLoginUser(user, dbRole),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

export const refreshAccessToken = async (req, res) => {
    const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token missing' });
    }

    try {
        const decoded = verifyRefreshToken(refreshToken);
        const storedTokenResult = await pool.query(
            `SELECT id, expires_at
             FROM refresh_tokens
             WHERE token_hash = $1 AND user_id = $2 AND role = $3`,
            [hashToken(refreshToken), decoded.id, decoded.role],
        );

        if (storedTokenResult.rows.length === 0) {
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token not recognized' });
        }

        const storedToken = storedTokenResult.rows[0];
        if (new Date(storedToken.expires_at) <= new Date()) {
            await revokeRefreshToken(refreshToken);
            clearRefreshTokenCookie(res);
            return res.status(401).json({ message: 'Refresh token expired' });
        }

        const user = await getUserById(decoded.id, decoded.role);
        if (!user) {
            await revokeRefreshToken(refreshToken);
            clearRefreshTokenCookie(res);
            return res.status(404).json({ message: 'User not found' });
        }

        const accessToken = await rotateRefreshToken(res, storedToken.id, {
            id: user.id,
            role: decoded.role,
            account_status: user.account_status,
        });

        res.status(200).json({
            message: 'Token refreshed successfully',
            token: accessToken,
            role: decoded.role,
            account_status: user.account_status,
            user: mapLoginUser(user, decoded.role),
        });
    } catch (error) {
        await revokeRefreshToken(refreshToken);
        clearRefreshTokenCookie(res);
        res.status(401).json({ message: 'Invalid refresh token' });
    }
};

export const logout = async (req, res) => {
    const refreshToken = getCookieValue(req, REFRESH_COOKIE_NAME);

    try {
        await revokeRefreshToken(refreshToken);
    } catch (error) {
        console.error('Logout error:', error);
    }

    clearRefreshTokenCookie(res);
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    try {
        // req.user is populated by authMiddleware
        const { id, role } = req.user;

        const user = await getUserById(id, role);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({ user, role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error fetching user details' });
    }
};
