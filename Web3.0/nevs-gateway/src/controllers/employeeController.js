const fabricService = require('../services/fabricService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { logTransaction } = require('../utils/logger');

const getActivePeer = () => {
    const peers = fabricService.getConnectedPeers();
    const alive = peers.find(p => p.connected);
    return alive ? alive.name : (peers.length > 0 ? peers[0].name : 'unknown');
};

const CONTRACT_NAME = 'EmployeeRegistryContract';

exports.registerEmployee = async (req, res) => {
    try {
        const { employeeId, fullName, dateOfBirth, idHash } = req.body;

        if (!employeeId || !fullName || !dateOfBirth || !idHash) {
            return errorResponse(res, 400, 'Missing required fields in request body');
        }

        const createdAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: RegisterEmployee [${employeeId}]`);
        const result = await contract.submitTransaction(
            'RegisterEmployee',
            employeeId,
            fullName,
            dateOfBirth,
            idHash,
            createdAt
        );

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: RegisterEmployee', '/api/v2/company/employees', txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Employee ${employeeId} registered successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        }, 201);
    } catch (error) {
        logTransaction('submitTransaction: RegisterEmployee', '/api/v2/company/employees', null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to register employee', error.message);
    }
};

exports.getEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetEmployee [${id}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmployee', id);
        const employee = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetEmployee', `/api/v2/company/employees/${id}`, null, 'SUCCESS', employee);

        return successResponse(res, employee, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmployee', `/api/v2/company/employees/${req.params.id}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 404, 'Failed to fetch employee', error.message);
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, status } = req.body;

        if (!fullName || !status) {
            return errorResponse(res, 400, 'fullName and status are required');
        }

        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: UpdateEmployee [${id}]`);
        const result = await contract.submitTransaction('UpdateEmployee', id, fullName, status, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: UpdateEmployee', `/api/v2/govt/employees/${id}`, txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Employee ${id} updated successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: UpdateEmployee', `/api/v2/govt/employees/${req.params.id}`, null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to update employee', error.message);
    }
};

exports.getAllEmployees = async (req, res) => {
    try {
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetAllEmployees`);
        const resultBytes = await contract.evaluateTransaction('GetAllEmployees');
        
        let employees = [];
        if (resultBytes && resultBytes.length > 0) {
            employees = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetAllEmployees', `/api/v2/govt/employees`, null, 'SUCCESS', { employeesFetched: employees.length });

        return successResponse(res, employees, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetAllEmployees', `/api/v2/govt/employees`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch all employees', error.message);
    }
};
