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

const CONTRACT_NAME = 'CompanyRegistryContract';

exports.registerCompany = async (req, res) => {
    try {
        const { companyId, name, registrationNo, industry, tier, adminEmail } = req.body;

        if (!companyId || !name || !registrationNo || !industry || !tier || !adminEmail) {
            return errorResponse(res, 400, 'Missing required fields in request body');
        }

        const createdAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: RegisterCompany [${companyId}]`);
        const result = await contract.submitTransaction(
            'RegisterCompany',
            companyId,
            name,
            registrationNo,
            industry,
            tier,
            adminEmail,
            createdAt
        );

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: RegisterCompany', '/api/v2/govt/companies', txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Company ${companyId} registered successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        }, 201);
    } catch (error) {
        logTransaction('submitTransaction: RegisterCompany', '/api/v2/govt/companies', null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to register company', error.message);
    }
};

exports.approveCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: ApproveCompany [${id}]`);
        const result = await contract.submitTransaction('ApproveCompany', id, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: ApproveCompany', `/api/v2/govt/companies/${id}/approve`, txId, 'SUCCESS', null);

        return successResponse(res, { message: `Company ${id} approved successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: ApproveCompany', `/api/v2/govt/companies/${req.params.id}/approve`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to approve company', error.message);
    }
};

exports.suspendCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        
        if (!reason) {
            return errorResponse(res, 400, 'reason is required in request body');
        }

        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: SuspendCompany [${id}]`);
        const result = await contract.submitTransaction('SuspendCompany', id, reason, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: SuspendCompany', `/api/v2/govt/companies/${id}/suspend`, txId, 'SUCCESS', { reason });

        return successResponse(res, { message: `Company ${id} suspended successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: SuspendCompany', `/api/v2/govt/companies/${req.params.id}/suspend`, null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to suspend company', error.message);
    }
};

exports.rejectCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: RejectCompany [${id}]`);
        const result = await contract.submitTransaction('RejectCompany', id, updatedAt);

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: RejectCompany', `/api/v2/govt/companies/${id}/reject`, txId, 'SUCCESS', null);

        return successResponse(res, { message: `Company ${id} rejected successfully` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: RejectCompany', `/api/v2/govt/companies/${req.params.id}/reject`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to reject company', error.message);
    }
};

exports.getCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetCompany [${id}]`);
        const resultBytes = await contract.evaluateTransaction('GetCompany', id);
        const company = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetCompany', `/api/v2/govt/companies/${id}`, null, 'SUCCESS', company);

        return successResponse(res, company, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetCompany', `/api/v2/govt/companies/${req.params.id}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 404, 'Failed to fetch company', error.message);
    }
};

exports.getAllCompanies = async (req, res) => {
    try {
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetAllCompanies`);
        const resultBytes = await contract.evaluateTransaction('GetAllCompanies');
        
        let companies = [];
        if (resultBytes && resultBytes.length > 0) {
            companies = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetAllCompanies', `/api/v2/govt/companies`, null, 'SUCCESS', { companiesFetched: companies.length });

        return successResponse(res, companies, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetAllCompanies', `/api/v2/govt/companies`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch all companies', error.message);
    }
};

exports.getCompaniesByStatus = async (req, res) => {
    try {
        const { status } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetCompaniesByStatus [${status}]`);
        const resultBytes = await contract.evaluateTransaction('GetCompaniesByStatus', status);
        
        let companies = [];
        if (resultBytes && resultBytes.length > 0) {
            companies = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetCompaniesByStatus', `/api/v2/govt/companies/status/${status}`, null, 'SUCCESS', { companiesFetched: companies.length });

        return successResponse(res, companies, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetCompaniesByStatus', `/api/v2/govt/companies/status/${req.params.status}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch companies by status', error.message);
    }
};
