import { pool } from '../config/db.js';
import crypto from 'crypto';

// ─── Mock Blockchain Helpers ─────────────────────────────────────────

let _blockCounter = null;

async function getNextBlockNumber() {
    if (_blockCounter === null) {
        const res = await pool.query('SELECT COALESCE(MAX(block_number), 0) as max_block FROM mock_ledger_transactions');
        _blockCounter = res.rows[0].max_block;
    }
    _blockCounter += 1;
    return _blockCounter;
}

function generateTxId(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data) + Date.now() + Math.random()).digest('hex');
}

function generateSignatureHash(peerName, txId) {
    return crypto.createHash('sha256').update(`${peerName}:${txId}:${Date.now()}`).digest('hex').slice(0, 64);
}

function generateVerificationHash(employeeId, employerId, startDate) {
    return crypto.createHash('sha256').update(`${employeeId}${employerId}${startDate}`).digest('hex');
}

/**
 * Records a mock blockchain transaction and its multi-org endorsements.
 * Simulates: Fabric SDK → Endorsers → Orderer → Block Commit
 */
async function recordMockLedgerTx(functionName, args, callerMsp, callerRole, companyTier) {
    const txId = generateTxId({ functionName, args, callerMsp });
    const blockNumber = await getNextBlockNumber();

    await pool.query(
        `INSERT INTO mock_ledger_transactions (tx_id, block_number, function_name, args, caller_msp, caller_role)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [txId, blockNumber, functionName, JSON.stringify(args), callerMsp, callerRole]
    );

    // Simulate dual-org endorsement: CentralGovtMSP + CompanyOrgMSP
    const endorsers = [
        { peer: 'peer0.central.govt', msp: 'CentralGovtMSP' },
        { peer: 'peer1.central.govt', msp: 'CentralGovtMSP' },
    ];

    // Tier 3 companies run their own peer for endorsement
    if (companyTier === 'TIER_3') {
        endorsers.push({ peer: 'peer0.company.org', msp: 'CompanyOrgMSP' });
    } else if (companyTier === 'TIER_2') {
        // Tier 2: read-only peer, still endorses through govt gateway
        endorsers.push({ peer: 'peer0.company.org (read-only)', msp: 'CompanyOrgMSP' });
    }
    // Tier 1: No company peer, govt endorses on behalf

    for (const e of endorsers) {
        await pool.query(
            `INSERT INTO mock_endorsements (tx_id, peer_name, msp_id, signature_hash)
             VALUES ($1, $2, $3, $4)`,
            [txId, e.peer, e.msp, generateSignatureHash(e.peer, txId)]
        );
    }

    return { txId, blockNumber };
}

// ─── POST /api/hiring/propose ────────────────────────────────────────

export const proposeHire = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const { employeeId, position, salary, compensation } = req.body;

        if (!employeeId || !position || !salary) {
            return res.status(400).json({ message: 'employeeId, position, and salary are required' });
        }

        // 1. Verify employee exists and is verified
        const empResult = await pool.query(
            'SELECT id, full_name, account_status, employment_status FROM employees WHERE id = $1',
            [employeeId]
        );
        if (empResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        const employee = empResult.rows[0];
        if (employee.account_status !== 'VERIFIED') {
            return res.status(400).json({ message: 'Employee is not verified on the NEVN platform' });
        }

        // 2. Check for duplicate active employment at the same company
        const duplicateCheck = await pool.query(
            `SELECT id, status FROM employment_records 
             WHERE employee_id = $1 AND employer_id = $2 AND status IN ('PROPOSED', 'CONSENTED', 'CONFIRMED')`,
            [employeeId, employerId]
        );
        if (duplicateCheck.rows.length > 0) {
            const existing = duplicateCheck.rows[0];
            return res.status(409).json({ 
                message: `This employee already has an active employment record at your company (Status: ${existing.status}).`,
                flag: 'DUPLICATE_HIRE',
                existingRecordId: existing.id
            });
        }

        // 3. Check if employee is already CONFIRMED at another company
        const activeElsewhere = await pool.query(
            `SELECT er.id, emp.organization_name FROM employment_records er
             JOIN employers emp ON er.employer_id = emp.id
             WHERE er.employee_id = $1 AND er.status = 'CONFIRMED' AND er.employer_id != $2`,
            [employeeId, employerId]
        );

        let alreadyEmployedWarning = null;
        if (activeElsewhere.rows.length > 0) {
            alreadyEmployedWarning = `Warning: This employee is currently employed at ${activeElsewhere.rows[0].organization_name}. Proceeding with a parallel proposal.`;
        }

        // 4. Fetch employer details for mock ledger
        const compQuery = await pool.query(
            'SELECT organization_name, tier FROM employers WHERE id = $1',
            [employerId]
        );
        const employer = compQuery.rows[0];

        // 5. Create employment record
        const startDate = new Date().toISOString().split('T')[0];
        const vHash = generateVerificationHash(employeeId, employerId, startDate);

        const insertResult = await pool.query(
            `INSERT INTO employment_records (employee_id, employer_id, position, salary, compensation, status, verification_hash, proposed_by)
             VALUES ($1, $2, $3, $4, $5, 'PROPOSED', $6, $7)
             RETURNING id, status, proposed_at`,
            [employeeId, employerId, position, salary, compensation || '', vHash, employer.organization_name]
        );
        const record = insertResult.rows[0];

        // 6. Update employee status
        await pool.query(
            "UPDATE employees SET employment_status = 'PROPOSED' WHERE id = $1 AND (employment_status IS NULL OR employment_status = 'AVAILABLE')",
            [employeeId]
        );

        // 7. Record mock blockchain transaction
        const { txId, blockNumber } = await recordMockLedgerTx(
            'ProposeEmployment',
            { employmentId: record.id, employeeId, companyId: employerId, position, department: 'General', startDate },
            employer.tier === 'TIER_3' ? 'CompanyOrgMSP' : 'CentralGovtMSP',
            employer.tier === 'TIER_3' ? 'company' : 'govt',
            employer.tier
        );

        res.status(201).json({
            message: 'Employment proposed successfully',
            record,
            mockLedger: { txId, blockNumber },
            warning: alreadyEmployedWarning
        });
    } catch (error) {
        console.error('proposeHire error:', error);
        res.status(500).json({ message: 'Failed to propose hire', error: error.message });
    }
};

// ─── POST /api/hiring/consent ────────────────────────────────────────

export const consentEmployment = async (req, res) => {
    try {
        const { id: employeeId } = req.user;
        const { recordId } = req.body;

        if (!recordId) {
            return res.status(400).json({ message: 'recordId is required' });
        }

        // Verify the record belongs to this employee
        const recResult = await pool.query(
            `SELECT er.*, emp.organization_name, emp.tier FROM employment_records er
             JOIN employers emp ON er.employer_id = emp.id
             WHERE er.id = $1 AND er.employee_id = $2`,
            [recordId, employeeId]
        );
        if (recResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employment record not found' });
        }
        const record = recResult.rows[0];
        if (record.status !== 'PROPOSED') {
            return res.status(400).json({ message: `Cannot consent: record is currently ${record.status}` });
        }

        // Transition PROPOSED → CONSENTED
        await pool.query(
            "UPDATE employment_records SET status = 'CONSENTED', consented_at = NOW(), updated_at = NOW() WHERE id = $1",
            [recordId]
        );

        // Mock ledger tx
        const { txId, blockNumber } = await recordMockLedgerTx(
            'EmployeeConsent',
            { employmentId: recordId, employeeId, updatedAt: new Date().toISOString() },
            'CentralGovtMSP',
            'employee',
            record.tier
        );

        res.status(200).json({
            message: 'Employment consent recorded',
            mockLedger: { txId, blockNumber }
        });
    } catch (error) {
        console.error('consentEmployment error:', error);
        res.status(500).json({ message: 'Failed to consent', error: error.message });
    }
};

// ─── POST /api/hiring/confirm/:id ────────────────────────────────────

export const confirmEmployment = async (req, res) => {
    try {
        const { id: recordId } = req.params;

        const recResult = await pool.query(
            `SELECT er.*, emp.organization_name, emp.tier FROM employment_records er
             JOIN employers emp ON er.employer_id = emp.id
             WHERE er.id = $1`,
            [recordId]
        );
        if (recResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employment record not found' });
        }
        const record = recResult.rows[0];
        if (record.status !== 'CONSENTED') {
            return res.status(400).json({ message: `Cannot confirm: record must be CONSENTED (current: ${record.status})` });
        }

        // Transition CONSENTED → CONFIRMED
        await pool.query(
            "UPDATE employment_records SET status = 'CONFIRMED', confirmed_at = NOW(), updated_at = NOW() WHERE id = $1",
            [recordId]
        );

        // Update employee status to EMPLOYED
        await pool.query(
            "UPDATE employees SET employment_status = 'EMPLOYED' WHERE id = $1",
            [record.employee_id]
        );

        // Mock ledger tx (Govt confirms)
        const { txId, blockNumber } = await recordMockLedgerTx(
            'ConfirmEmployment',
            { employmentId: recordId, employeeId: record.employee_id, updatedAt: new Date().toISOString() },
            'CentralGovtMSP',
            'govt',
            record.tier
        );

        res.status(200).json({
            message: 'Employment confirmed by government authority',
            mockLedger: { txId, blockNumber }
        });
    } catch (error) {
        console.error('confirmEmployment error:', error);
        res.status(500).json({ message: 'Failed to confirm', error: error.message });
    }
};

// ─── POST /api/hiring/terminate/:id ──────────────────────────────────

export const terminateEmployment = async (req, res) => {
    try {
        const { id: recordId } = req.params;
        const callerRole = req.user.role;
        const callerId = req.user.id;

        const recResult = await pool.query(
            `SELECT er.*, emp.organization_name, emp.tier FROM employment_records er
             JOIN employers emp ON er.employer_id = emp.id
             WHERE er.id = $1`,
            [recordId]
        );
        if (recResult.rows.length === 0) {
            return res.status(404).json({ message: 'Employment record not found' });
        }
        const record = recResult.rows[0];

        // Employer can only terminate their own records
        if (callerRole === 'EMPLOYER' && record.employer_id !== callerId) {
            return res.status(403).json({ message: 'You can only terminate your own company records' });
        }

        if (record.status !== 'CONFIRMED') {
            return res.status(400).json({ message: `Cannot terminate: record must be CONFIRMED (current: ${record.status})` });
        }

        const endDate = new Date().toISOString().split('T')[0];

        await pool.query(
            "UPDATE employment_records SET status = 'TERMINATED', terminated_at = NOW(), end_date = $2, updated_at = NOW() WHERE id = $1",
            [recordId, endDate]
        );

        // Check if employee has any other CONFIRMED records
        const otherActive = await pool.query(
            "SELECT id FROM employment_records WHERE employee_id = $1 AND status = 'CONFIRMED' AND id != $2",
            [record.employee_id, recordId]
        );
        if (otherActive.rows.length === 0) {
            await pool.query(
                "UPDATE employees SET employment_status = 'AVAILABLE' WHERE id = $1",
                [record.employee_id]
            );
        }

        const { txId, blockNumber } = await recordMockLedgerTx(
            'TerminateEmployment',
            { employmentId: recordId, employeeId: record.employee_id, endDate, updatedAt: new Date().toISOString() },
            callerRole === 'admin' ? 'CentralGovtMSP' : (record.tier === 'TIER_3' ? 'CompanyOrgMSP' : 'CentralGovtMSP'),
            callerRole === 'admin' ? 'govt' : 'company',
            record.tier
        );

        res.status(200).json({
            message: 'Employment terminated',
            mockLedger: { txId, blockNumber }
        });
    } catch (error) {
        console.error('terminateEmployment error:', error);
        res.status(500).json({ message: 'Failed to terminate', error: error.message });
    }
};

// ─── GET /api/hiring/my-records ──────────────────────────────────────

export const getMyEmploymentRecords = async (req, res) => {
    try {
        const { id: employeeId } = req.user;
        const result = await pool.query(
            `SELECT er.*, emp.organization_name, emp.tier, emp.industry_sector
             FROM employment_records er
             JOIN employers emp ON er.employer_id = emp.id
             WHERE er.employee_id = $1
             ORDER BY er.created_at DESC`,
            [employeeId]
        );
        res.status(200).json({ records: result.rows });
    } catch (error) {
        console.error('getMyEmploymentRecords error:', error);
        res.status(500).json({ message: 'Failed to fetch records' });
    }
};

// ─── GET /api/hiring/company-records ─────────────────────────────────

export const getCompanyHires = async (req, res) => {
    try {
        const { id: employerId } = req.user;
        const result = await pool.query(
            `SELECT er.*, e.full_name, e.email, e.city, e.state, e.account_status as employee_account_status
             FROM employment_records er
             JOIN employees e ON er.employee_id = e.id
             WHERE er.employer_id = $1
             ORDER BY er.created_at DESC`,
            [employerId]
        );
        res.status(200).json({ records: result.rows });
    } catch (error) {
        console.error('getCompanyHires error:', error);
        res.status(500).json({ message: 'Failed to fetch company records' });
    }
};
