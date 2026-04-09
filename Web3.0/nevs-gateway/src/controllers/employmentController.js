const fabricService = require('../services/fabricService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { logTransaction } = require('../utils/logger');

/**
 * Helper: returns the name of the first connected peer for response metadata.
 */
const getActivePeer = () => {
    const peers = fabricService.getConnectedPeers();
    const alive = peers.find(p => p.connected);
    return alive ? alive.name : (peers.length > 0 ? peers[0].name : 'unknown');
};

exports.getAllEmploymentRecords = async (req, res) => {
    try {
        const contract = fabricService.getContract();

        console.log(`Evaluating Transaction: GetAllEmploymentRecords`);
        const resultBytes = await contract.evaluateTransaction('GetAllEmploymentRecords');

        let records = [];
        if (resultBytes && resultBytes.length > 0) {
            records = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetAllEmploymentRecords', `/api/employment`, null, 'SUCCESS', { recordsFetched: records.length });

        return successResponse(res, records, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetAllEmploymentRecords', `/api/employment`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch all employment records', error.message);
    }
};

exports.createEmployment = async (req, res) => {
    try {
        const { recordID, employeeID, employerID, position, startDate, status } = req.body;

        if (!recordID || !employeeID || !employerID || !position || !startDate || !status) {
            return errorResponse(res, 400, 'Missing required fields in request body');
        }

        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        const contract = fabricService.getContract();

        console.log(`Submitting Transaction: CreateEmploymentRecord [${recordID}]`);
        const transaction = contract.createTransaction('CreateEmploymentRecord');

        const { salary, compensation } = req.body;
        if (salary || compensation) {
            const privateData = {
                recordId: recordID,
                salary: salary || 'N/A',
                compensation: compensation || 'N/A'
            };
            transaction.setTransient({
                employmentPrivateData: Buffer.from(JSON.stringify(privateData))
            });
        }

        const resultBytes = await transaction.submit(
            recordID,
            employeeID,
            employerID,
            position,
            startDate,
            status,
            createdAt,
            updatedAt
        );

        // It also needs to call SetPrivateEmploymentData if private data exists, wait, the chaincode needs to be called to set private data?
        // Wait, the plan says: `Add two new functions to smartcontract.go: SetPrivateEmploymentData, GetPrivateEmploymentData`.
        // And "The private data is passed via the transient field of the transaction proposal, not as regular arguments."
        // Wait! In step 30: "Update the controller's createRecord handler to: 1. Accept optional salary/compensation. 2. Pass them via contract.createTransaction('CreateEmploymentRecord').setTransient(...) instead of regular arguments."
        // Wait! The plan DOES NOT say to call SetPrivateEmploymentData explicitly in createRecord. It says pass them to CreateEmploymentRecord.
        // Wait, but I added SetPrivateEmploymentData as a SEPARATE function. Is CreateEmploymentRecord handling it?
        // Let's check smartcontract.go. I did not add it to CreateEmploymentRecord!
        // I should stick to adding it to createEmployment route OR create another route.
        // I will add a call to `SetPrivateEmploymentData` in `createEmployment` if salary is present!
        
        const txId = resultBytes ? resultBytes.toString('utf8') : null;

        if (salary || compensation) {
             const privateTx = contract.createTransaction('SetPrivateEmploymentData');
             privateTx.setTransient({
                 employmentPrivateData: Buffer.from(JSON.stringify({
                     recordId: recordID,
                     salary: salary || 'N/A',
                     compensation: compensation || 'N/A'
                 }))
             });
             await privateTx.submit();
        }

        logTransaction('submitTransaction: CreateEmploymentRecord', '/api/employment', txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Employment record ${recordID} created successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        }, 201);
    } catch (error) {
        logTransaction('submitTransaction: CreateEmploymentRecord', '/api/employment', null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to create employment record', error.message);
    }
};

exports.getEmploymentHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const contract = fabricService.getContract();

        console.log(`Evaluating Transaction: GetEmploymentHistory [${employeeId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmploymentHistory', employeeId);

        let records = [];
        if (resultBytes && resultBytes.length > 0) {
            records = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetEmploymentHistory', `/api/employment/employee/${employeeId}`, null, 'SUCCESS', { recordsFetched: records.length });

        return successResponse(res, records, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmploymentHistory', `/api/employment/employee/${req.params.employeeId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch employment history', error.message);
    }
};

exports.getEmploymentRecord = async (req, res) => {
    try {
        const { employeeId, recordId } = req.params;
        const contract = fabricService.getContract();

        console.log(`Evaluating Transaction: GetEmploymentRecord [${employeeId}, ${recordId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmploymentRecord', employeeId, recordId);

        const record = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetEmploymentRecord', `/api/employment/record/${employeeId}/${recordId}`, null, 'SUCCESS', record);

        return successResponse(res, record, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmploymentRecord', `/api/employment/record/${req.params.employeeId}/${req.params.recordId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 404, 'Failed to fetch employment record', error.message);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { employeeId, recordId } = req.params;
        const { newStatus, endDate } = req.body;

        if (!newStatus) {
            return errorResponse(res, 400, 'newStatus is required in request body');
        }

        const updatedAt = new Date().toISOString();
        const effectiveEndDate = endDate || '';

        const contract = fabricService.getContract();

        console.log(`Submitting Transaction: UpdateEmploymentStatus [${employeeId}, ${recordId}]`);
        const result = await contract.submitTransaction(
            'UpdateEmploymentStatus',
            employeeId,
            recordId,
            newStatus,
            effectiveEndDate,
            updatedAt
        );

        const txId = result ? result.toString('utf8') : null;

        logTransaction('submitTransaction: UpdateEmploymentStatus', `/api/employment/${employeeId}/${recordId}/status`, txId, 'SUCCESS', { newStatus, effectiveEndDate });

        return successResponse(res, { message: `Employment record ${recordId} status updated to ${newStatus}` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: UpdateEmploymentStatus', `/api/employment/${req.params.employeeId}/${req.params.recordId}/status`, null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to update employment status', error.message);
    }
};

exports.getPrivateEmploymentData = async (req, res) => {
    try {
        const { recordId } = req.params;
        const contract = fabricService.getContract();

        console.log(`Evaluating Transaction: GetPrivateEmploymentData [${recordId}]`);
        const resultBytes = await contract.evaluateTransaction('GetPrivateEmploymentData', recordId);

        const record = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetPrivateEmploymentData', `/api/employment/private/${recordId}`, null, 'SUCCESS', record);

        return successResponse(res, record, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetPrivateEmploymentData', `/api/employment/private/${req.params.recordId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 403, 'Failed to fetch employment private data or unauthorized', error.message);
    }
};
