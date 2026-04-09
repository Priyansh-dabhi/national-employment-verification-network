import { pool } from './config/db.js';
import bcrypt from 'bcrypt';
import { createTables } from './config/db.js';

import { v4 as uuidv4 } from 'uuid';

async function seedCompany() {
    try {
        await createTables();
        const email = 'admin@company.org';
        const passwordHash = await bcrypt.hash('adminpw', 10);
        const companyUUID = uuidv4();

        // Check if company exists
        const res = await pool.query("SELECT id FROM employers WHERE email = 'admin@company.org'");
        
        let employerId;
        if (res.rows.length === 0) {
            // Insert
            const insertQuery = `
                INSERT INTO employers (
                    email, mobile, password, organization_name, org_type, industry_sector,
                    authorized_person_name, designation, city, state, account_status,
                    web3_company_id, web3_status, web3_enrollment_id
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
                ) RETURNING id
            `;
            const result = await pool.query(insertQuery, [
                email, '0000000000', passwordHash, 'TechCorp (CompanyOrg Admin)', 'Private', 'IT',
                'Admin User', 'CEO', 'Metropolis', 'State', 'VERIFIED',
                companyUUID, 'ACTIVE', 'Admin@company.org'
            ]);
            employerId = result.rows[0].id;
            console.log("Successfully seeded TechCorp with ID:", employerId);
        } else {
            // Update
            employerId = res.rows[0].id;
            const updateQuery = `
                UPDATE employers 
                SET web3_company_id = $2, web3_status = 'ACTIVE', web3_enrollment_id = 'Admin@company.org', account_status = 'VERIFIED'
                WHERE id = $1
            `;
            await pool.query(updateQuery, [employerId, companyUUID]);
            console.log("Successfully updated TechCorp with ID:", employerId);
        }

        process.exit(0);
    } catch (err) {
        console.error("DB Error:", err);
        process.exit(1);
    }
}

seedCompany();
