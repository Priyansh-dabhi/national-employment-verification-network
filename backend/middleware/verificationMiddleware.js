import { pool } from '../config/db.js';

export const requireVerified = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(403).json({ error: 'Access denied. Not authenticated.' });
        }

        const { id, role } = req.user;
        const table = role === 'employee' ? 'employees' : 'employers';
        const result = await pool.query(`SELECT account_status FROM ${table} WHERE id = $1`, [id]);

        if (result.rows.length === 0 || result.rows[0].account_status !== 'VERIFIED') {
            return res.status(403).json({
                error: 'Access denied. Your account is not verified yet.',
                account_status: result.rows[0]?.account_status || 'UNVERIFIED'
            });
        }

        // Attach the fresh status to the request
        req.user.account_status = 'VERIFIED';
        next();
    } catch (err) {
        console.error('verificationMiddleware error:', err);
        res.status(500).json({ error: 'Server error during verification check.' });
    }
};
