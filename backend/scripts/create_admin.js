import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

const seedAdmin = async () => {
    const defaultEmail = 'admin@nevn.com';
    const defaultPassword = 'password123';
    const defaultFullName = 'System Admin';

    try {
        console.log(`Checking for admin account: ${defaultEmail}...`);
        const existingAdmin = await pool.query('SELECT * FROM admins WHERE email = $1', [defaultEmail]);

        if (existingAdmin.rows.length > 0) {
            console.log('Admin account already exists.');
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
