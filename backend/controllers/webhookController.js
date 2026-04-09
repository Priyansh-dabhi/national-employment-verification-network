import { pool } from '../config/db.js';

export const handleEmployeeRegistered = async (req, res) => {
    const { txId, blockNumber, payload } = req.body;
    const { employeeID, status } = payload; 

    try {
        await pool.query('BEGIN');

        // Idempotency check
        const eventCheck = await pool.query('SELECT id FROM web3_event_log WHERE tx_id = $1', [txId]);
        if (eventCheck.rows.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(200).json({ message: 'Event already processed' });
        }

        // Update employee state
        await pool.query(
            `UPDATE employees SET 
                web3_status = $1, 
                web3_confirmed_at = CURRENT_TIMESTAMP 
             WHERE web3_employee_id = $2`,
            [status, employeeID]
        );

        // Record the event
        await pool.query(
            `INSERT INTO web3_event_log (event_name, tx_id, block_number, payload, status) 
             VALUES ($1, $2, $3, $4, 'PROCESSED')`,
            ['EmployeeRegistered', txId, blockNumber, JSON.stringify(payload)]
        );

        await pool.query('COMMIT');
        console.log(`Successfully processed Webhook: EmployeeRegistered [Tx: ${txId}]`);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Webhook error (EmployeeRegistered):', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const handleEmploymentProposed = async (req, res) => {
    const { txId, blockNumber, payload } = req.body;

    try {
        await pool.query('BEGIN');
        const eventCheck = await pool.query('SELECT id FROM web3_event_log WHERE tx_id = $1', [txId]);
        if (eventCheck.rows.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(200).json({ message: 'Event already processed' });
        }

        await pool.query(
            `INSERT INTO web3_event_log (event_name, tx_id, block_number, payload, status) 
             VALUES ($1, $2, $3, $4, 'PROCESSED')`,
            ['EmploymentProposed', txId, blockNumber, JSON.stringify(payload)]
        );

        await pool.query('COMMIT');
        console.log(`Successfully processed Webhook: EmploymentProposed [Tx: ${txId}]`);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Webhook error (EmploymentProposed):', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const handleEmploymentConsented = async (req, res) => {
    const { txId, blockNumber, payload } = req.body;
    const { employeeId, companyId, status } = payload; 

    try {
        await pool.query('BEGIN');
        const eventCheck = await pool.query('SELECT id FROM web3_event_log WHERE tx_id = $1', [txId]);
        if (eventCheck.rows.length > 0) {
            await pool.query('ROLLBACK');
            return res.status(200).json({ message: 'Event already processed' });
        }

        // Update company_employees status
        // Since we don't have the internal company_employees ID easily, we match on web3 IDs.
        // Let's resolve web3 IDs to local IDs
        const empQuery = await pool.query('SELECT id FROM employees WHERE web3_employee_id = $1', [employeeId]);
        const compQuery = await pool.query('SELECT id FROM employers WHERE web3_company_id = $1', [companyId]);

        if (empQuery.rows.length > 0 && compQuery.rows.length > 0) {
            await pool.query(
                `UPDATE company_employees SET status = $1 
                 WHERE employee_id = $2 AND employer_id = $3 AND status IN ('PROPOSED', 'CONSENTING')`,
                ['ACTIVE', empQuery.rows[0].id, compQuery.rows[0].id]
            );
        }

        await pool.query(
            `INSERT INTO web3_event_log (event_name, tx_id, block_number, payload, status) 
             VALUES ($1, $2, $3, $4, 'PROCESSED')`,
            ['EmploymentConsented', txId, blockNumber, JSON.stringify(payload)]
        );

        await pool.query('COMMIT');
        console.log(`Successfully processed Webhook: EmploymentConsented [Tx: ${txId}]`);
        res.status(200).json({ status: 'success' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Webhook error (EmploymentConsented):', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
