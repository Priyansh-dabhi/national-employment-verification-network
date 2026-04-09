/**
 * Seed script to register 4 additional companies with tier classification.
 * Run: node seedCompanies.js
 */
import pg from 'pg';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const { Pool } = pg;
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

const companies = [
    {
        email: 'admin@greenleafpharma.in',
        mobile: '9876543210',
        password: 'Company@123',
        organization_name: 'GreenLeaf Pharmaceuticals',
        org_type: 'Private Limited',
        industry_sector: 'Pharmaceutical',
        authorized_person_name: 'Dr. Meera Patel',
        designation: 'Managing Director',
        city: 'Ahmedabad',
        state: 'Gujarat',
        account_status: 'VERIFIED',
        tier: 'TIER_2'
    },
    {
        email: 'admin@buildright.co.in',
        mobile: '9876543211',
        password: 'Company@123',
        organization_name: 'BuildRight Constructions',
        org_type: 'Partnership',
        industry_sector: 'Construction & Infrastructure',
        authorized_person_name: 'Rajesh Sharma',
        designation: 'Chief Executive Officer',
        city: 'Surat',
        state: 'Gujarat',
        account_status: 'VERIFIED',
        tier: 'TIER_1'
    },
    {
        email: 'admin@datavault.io',
        mobile: '9876543212',
        password: 'Company@123',
        organization_name: 'DataVault Analytics',
        org_type: 'Private Limited',
        industry_sector: 'Data Science & AI',
        authorized_person_name: 'Priya Sundaram',
        designation: 'Chief Technology Officer',
        city: 'Bangalore',
        state: 'Karnataka',
        account_status: 'VERIFIED',
        tier: 'TIER_3'
    },
    {
        email: 'admin@swiftlogistics.in',
        mobile: '9876543213',
        password: 'Company@123',
        organization_name: 'SwiftLogistics India',
        org_type: 'LLP',
        industry_sector: 'Logistics & Supply Chain',
        authorized_person_name: 'Arjun Singh',
        designation: 'Operations Head',
        city: 'Mumbai',
        state: 'Maharashtra',
        account_status: 'VERIFIED',
        tier: 'TIER_1'
    },
];

async function seed() {
    const client = await pool.connect();

    try {
        // Ensure tier column exists
        await client.query("ALTER TABLE employers ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'TIER_1'");

        // Also update existing TechCorp to TIER_3
        await client.query(
            "UPDATE employers SET tier = 'TIER_3' WHERE organization_name ILIKE '%TechCorp%' OR organization_name ILIKE '%techcorp%'"
        );

        for (const company of companies) {
            const hashedPassword = await bcrypt.hash(company.password, 10);

            const exists = await client.query('SELECT id FROM employers WHERE email = $1', [company.email]);
            if (exists.rows.length > 0) {
                console.log(`⚠️  ${company.organization_name} already exists — skipping.`);
                // Still update the tier in case it changed
                await client.query('UPDATE employers SET tier = $1 WHERE email = $2', [company.tier, company.email]);
                continue;
            }

            await client.query(
                `INSERT INTO employers (email, mobile, password, organization_name, org_type, industry_sector, 
                    authorized_person_name, designation, city, state, account_status, tier)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    company.email, company.mobile, hashedPassword, company.organization_name,
                    company.org_type, company.industry_sector, company.authorized_person_name,
                    company.designation, company.city, company.state, company.account_status, company.tier
                ]
            );
            console.log(`✅ Seeded: ${company.organization_name} (${company.tier})`);
        }

        console.log('\n📊 Company Tier Summary:');
        const summary = await client.query(
            "SELECT organization_name, tier, account_status FROM employers ORDER BY tier, organization_name"
        );
        summary.rows.forEach(r => {
            const tierLabel = { TIER_1: '🏪 Tier 1 (Small)', TIER_2: '🏢 Tier 2 (Medium)', TIER_3: '🏗️ Tier 3 (Enterprise)' };
            console.log(`  ${tierLabel[r.tier] || r.tier}  →  ${r.organization_name} [${r.account_status}]`);
        });
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
