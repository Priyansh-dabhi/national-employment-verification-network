import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

const createTables = async () => {
    const createEmployeesTable = `
        CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            mobile VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            date_of_birth DATE,
            employment_status VARCHAR(50),
            gender VARCHAR(20),
            city VARCHAR(100),
            state VARCHAR(100),
            account_status VARCHAR(20) DEFAULT 'UNVERIFIED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createEmployersTable = `
        CREATE TABLE IF NOT EXISTS employers (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            mobile VARCHAR(20) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            organization_name VARCHAR(255) NOT NULL,
            org_type VARCHAR(50),
            industry_sector VARCHAR(100),
            authorized_person_name VARCHAR(255),
            designation VARCHAR(100),
            city VARCHAR(100),
            state VARCHAR(100),
            account_status VARCHAR(20) DEFAULT 'UNVERIFIED',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createDocumentsTable = `
        CREATE TABLE IF NOT EXISTS documents (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
            document_type VARCHAR(100) NOT NULL,
            public_id VARCHAR(255) NOT NULL,
            encrypted_key TEXT NOT NULL,
            file_size INTEGER,
            verification_status VARCHAR(20) DEFAULT 'PENDING',
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    try {
        const client = await pool.connect();
        await client.query(createEmployeesTable);
        await client.query(createEmployersTable);
        await client.query(createDocumentsTable);
        console.log('Tables created or already exist');
        client.release();
    } catch (err) {
        console.error('Error creating tables:', err);
    }
};

export { pool, createTables };
