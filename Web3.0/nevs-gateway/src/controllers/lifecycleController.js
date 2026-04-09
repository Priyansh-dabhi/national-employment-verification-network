const fabricService = require('../services/fabricService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { logTransaction } = require('../utils/logger');

const getActivePeer = () => {
    const peers = fabricService.getConnectedPeers();
    const alive = peers.find(p => p.connected);
    return alive ? alive.name : (peers.length > 0 ? peers[0].name : 'unknown');
};

const CONTRACT_NAME = 'EmploymentLifecycleContract';

exports.proposeEmployment = async (req, res) => {
    try {
        const { employmentId, employeeId, companyId, position, department, startDate } = req.body;

        if (!employmentId || !employeeId || !companyId || !position || !startDate) {
            return errorResponse(res, 400, 'Missing required fields in request body');
        }

        const createdAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: ProposeEmployment [${employmentId}]`);
        const result = await contract.submitTransaction(
            'ProposeEmployment',
            employmentId,
            employeeId,
            companyId,
            position,
            department || '',
            startDate,
            createdAt
        );

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: ProposeEmployment', '/api/v2/company/employment/propose', txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Employment proposal ${employmentId} created successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        }, 201);
    } catch (error) {
        logTransaction('submitTransaction: ProposeEmployment', '/api/v2/company/employment/propose', null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to propose employment', error.message);
    }
};

exports.employeeConsent = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: EmployeeConsent [${id}]`);
        const result = await contract.submitTransaction('EmployeeConsent', id, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: EmployeeConsent', `/api/v2/employee/employment/${id}/consent`, txId, 'SUCCESS', null);

        return successResponse(res, { message: `Consent given for employment ${id}` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: EmployeeConsent', `/api/v2/employee/employment/${req.params.id}/consent`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to give employment consent', error.message);
    }
};

exports.confirmEmployment = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: ConfirmEmployment [${id}]`);
        const result = await contract.submitTransaction('ConfirmEmployment', id, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: ConfirmEmployment', `/api/v2/govt/employment/${id}/confirm`, txId, 'SUCCESS', null);

        return successResponse(res, { message: `Employment ${id} confirmed successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: ConfirmEmployment', `/api/v2/govt/employment/${req.params.id}/confirm`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to confirm employment', error.message);
    }
};

exports.terminateEmployment = async (req, res) => {
    try {
        const { id } = req.params;
        const { endDate } = req.body;
        
        if (!endDate) {
            return errorResponse(res, 400, 'endDate is required in request body');
        }

        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: TerminateEmployment [${id}]`);
        const result = await contract.submitTransaction('TerminateEmployment', id, endDate, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: TerminateEmployment', `/api/v2/company/employment/${id}/terminate`, txId, 'SUCCESS', { endDate });

        return successResponse(res, { message: `Employment ${id} terminated successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: TerminateEmployment', `/api/v2/company/employment/${req.params.id}/terminate`, null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to terminate employment', error.message);
    }
};

exports.getEmployment = async (req, res) => {
    try {
        const { employeeId, employmentId } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetEmployment [${employeeId}, ${employmentId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmployment', employeeId, employmentId);
        const employment = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetEmployment', `/api/v2/employment/${employeeId}/${employmentId}`, null, 'SUCCESS', employment);

        return successResponse(res, employment, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmployment', `/api/v2/employment/${req.params.employeeId}/${req.params.employmentId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 404, 'Failed to fetch employment record', error.message);
    }
};

exports.getEmploymentsByEmployee = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetEmploymentsByEmployee [${employeeId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmploymentsByEmployee', employeeId);
        
        let records = [];
        if (resultBytes && resultBytes.length > 0) {
            records = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetEmploymentsByEmployee', `/api/v2/employee/employment/${employeeId}`, null, 'SUCCESS', { recordsFetched: records.length });

        return successResponse(res, records, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmploymentsByEmployee', `/api/v2/employee/employment/${req.params.employeeId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch employee history', error.message);
    }
};

exports.getEmploymentsByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetEmploymentsByCompany [${companyId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmploymentsByCompany', companyId);
        
        let records = [];
        if (resultBytes && resultBytes.length > 0) {
            records = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetEmploymentsByCompany', `/api/v2/company/employment/${companyId}`, null, 'SUCCESS', { recordsFetched: records.length });

        return successResponse(res, records, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmploymentsByCompany', `/api/v2/company/employment/${req.params.companyId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch company employments', error.message);
    }
};
