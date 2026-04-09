import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function resetDatabase() {
    const client = await pool.connect();
    try {
        console.log('Connecting to database to clear tables...');
        
        // TRUNCATE with CASCADE deletes all data inside tables and resets identity (auto-increment counters)
        await client.query(`
            TRUNCATE TABLE 
                employees,
                admins,
                employers,
                documents,
                jobs,
                job_applications,
                verified_ids,
                verification_logs,
                blockchain_records,
                employer_documents,
                employer_verification_requests,
                company_employees,
                refresh_tokens,
                web3_event_log
            RESTART IDENTITY CASCADE;
        `);
        
        console.log('Successfully wiped all data from all tables!');
    } catch (err) {
        console.error('Error resetting database:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

resetDatabase();
