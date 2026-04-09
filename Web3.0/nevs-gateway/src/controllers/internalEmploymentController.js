const fabricService = require('../services/fabricService');
const { randomUUID } = require('crypto');

exports.proposeEmployment = async (req, res) => {
    try {
        const { employeeID, companyID, position, salary, compensation } = req.body;

        if (!employeeID || !companyID || !position) {
            return res.status(400).json({ error: 'employeeID, companyID, length and position are required' });
        }

        const employmentID = randomUUID();
        const startDate = new Date().toISOString().split('T')[0]; // simple YYYY-MM-DD
        const createdAt = new Date().toISOString();

        // 1. Get the V2 chaincode contract using the Government God Gateway Context
        const contract = fabricService.getContractV2('EmploymentLifecycleContract');

        // 2. Prepare transaction
        const transaction = contract.createTransaction('ProposeEmployment');

        // 3. Set transient data (PDC)
        const privateData = {
            employmentId: employmentID,
            salary: salary ? salary.toString() : '0',
            compensation: compensation || 'None'
        };

        transaction.setTransient({
            employmentPrivateData: Buffer.from(JSON.stringify(privateData))
        });

        // 4. Submit transaction
        await transaction.submit(
            employmentID,
            employeeID,
            companyID,
            position,
            "General", // Department
            startDate,
            createdAt
        );

        // 5. Submit private data using the separate chaincode function
        // Note: SetPrivateEmploymentData takes transient map
        const privateTx = contract.createTransaction('SetPrivateEmploymentData');
        privateTx.setTransient({
            employmentPrivateData: Buffer.from(JSON.stringify(privateData))
        });
        await privateTx.submit();

        console.log(`Successfully proposed employment ${employmentID} on ledger`);
        return res.status(200).json({ status: 'success', employmentID });
    } catch (error) {
        console.error('Failed to propose employment:', error);
        return res.status(500).json({ error: 'Failed to propose employment on ledger', details: error.message });
    }
};

exports.consentEmployment = async (req, res) => {
    try {
        const { employeeID, companyID } = req.body;

        if (!employeeID || !companyID) {
            return res.status(400).json({ error: 'employeeID and companyID are required' });
        }

        const contract = fabricService.getContractV2('EmploymentLifecycleContract');

        // We need the employmentID. In Phase 4.3 chaincode, EmploymentExists takes employeeID, employmentID.
        // We can query GetEmploymentsByEmployee(employeeID) to find the PROPOSED record.
        const resultBytes = await contract.evaluateTransaction('GetEmploymentsByEmployee', employeeID);
        const resultString = resultBytes ? resultBytes.toString('utf8') : '';
        const employments = resultString ? JSON.parse(resultString) : [];

        const proposedRecord = employments.find(e => e.companyId === companyID && e.status === 'PROPOSED');
        if (!proposedRecord) {
             return res.status(404).json({ error: 'No PROPOSED employment found for this company and employee' });
        }

        const employmentID = proposedRecord.employmentId;
        const updatedAt = new Date().toISOString();

        // Authentic Employee Cryptographic Consent
        const employeeWalletLabel = `employee_${employeeID}`;
        const employeeContract = await fabricService.getEmployeeContractV2(employeeWalletLabel, 'EmploymentLifecycleContract');
        await employeeContract.submitTransaction('EmployeeConsent', employeeID, employmentID, updatedAt);

        // Auto-confirm for Final Submission via Government Authority
        await contract.submitTransaction('ConfirmEmployment', employeeID, employmentID, updatedAt);

        console.log(`Successfully consented and confirmed employment ${employmentID} on ledger`);
        return res.status(200).json({ status: 'success', employmentID });
    } catch (error) {
        console.error('Failed to consent employment:', error);
        return res.status(500).json({ error: 'Failed to consent employment on ledger', details: error.message });
    }
};
