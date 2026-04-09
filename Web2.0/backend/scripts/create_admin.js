import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const seedAdmin = async () => {
    const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@nevn.com').trim().toLowerCase();
    const defaultPassword = process.env.ADMIN_PASSWORD || 'password123';
    const defaultFullName = process.env.ADMIN_FULL_NAME || 'System Admin';

    try {
        console.log(`Checking for admin account: ${defaultEmail}...`);
        const existingAdmin = await pool.query('SELECT * FROM admins WHERE LOWER(email) = $1', [defaultEmail]);

        if (existingAdmin.rows.length > 0) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            await pool.query(
                `UPDATE admins
                 SET password = $1, full_name = $2, role = $3
                 WHERE id = $4`,
                [hashedPassword, defaultFullName, 'admin', existingAdmin.rows[0].id]
            );
            console.log(`Admin account exists. Credentials refreshed for: ${defaultEmail}`);
        } else {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            await pool.query(
                `INSERT INTO admins (email, password, full_name, role) VALUES ($1, $2, $3, $4)`,
                [defaultEmail, hashedPassword, defaultFullName, 'admin']
            );
            console.log(`Successfully created Sysadmin user with email: ${defaultEmail}`);
        }
    } catch (err) {
        console.error('Error seeding admin user:', err);
    } finally {
        pool.end();
    }
};

seedAdmin();
