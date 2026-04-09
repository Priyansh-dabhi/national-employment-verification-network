const fabricService = require('../services/fabricService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { logTransaction } = require('../utils/logger');

const getActivePeer = () => {
    const peers = fabricService.getConnectedPeers();
    const alive = peers.find(p => p.connected);
    return alive ? alive.name : (peers.length > 0 ? peers[0].name : 'unknown');
};

const CONTRACT_NAME = 'VerificationContract';

exports.verifyEmployment = async (req, res) => {
    try {
        const { verificationId, employmentId, employeeId, verifierId } = req.body;

        if (!verificationId || !employmentId || !employeeId || !verifierId) {
            return errorResponse(res, 400, 'Missing required fields in request body');
        }

        const requestedAt = new Date().toISOString();
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Submitting Transaction: VerifyEmployment [${verificationId}]`);
        const result = await contract.submitTransaction(
            'VerifyEmployment',
            verificationId,
            employmentId,
            employeeId,
            verifierId,
            requestedAt
        );

        const txId = result ? result.toString('utf8') : null;
        logTransaction('submitTransaction: VerifyEmployment', '/api/v2/verifier/verify', txId, 'SUCCESS', req.body);

        return successResponse(res, { message: `Verification check ${verificationId} processed` }, {
            peerUsed: getActivePeer(),
            txId: txId
        });
    } catch (error) {
        logTransaction('submitTransaction: VerifyEmployment', '/api/v2/verifier/verify', null, 'FAILURE', req.body, error.message);
        return errorResponse(res, 500, 'Failed to process verification', error.message);
    }
};

exports.getVerificationRecord = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetVerificationRecord [${id}]`);
        const resultBytes = await contract.evaluateTransaction('GetVerificationRecord', id);
        const record = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GetVerificationRecord', `/api/v2/verifier/record/${id}`, null, 'SUCCESS', record);

        return successResponse(res, record, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetVerificationRecord', `/api/v2/verifier/record/${req.params.id}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 404, 'Failed to fetch verification record', error.message);
    }
};

exports.getEmploymentHistory = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GetEmploymentHistory [${employeeId}]`);
        const resultBytes = await contract.evaluateTransaction('GetEmploymentHistory', employeeId);
        
        let records = [];
        if (resultBytes && resultBytes.length > 0) {
            records = JSON.parse(resultBytes.toString('utf8'));
        }

        logTransaction('evaluateTransaction: GetEmploymentHistory (V2)', `/api/v2/verifier/history/${employeeId}`, null, 'SUCCESS', { recordsFetched: records.length });

        return successResponse(res, records, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GetEmploymentHistory (V2)', `/api/v2/verifier/history/${req.params.employeeId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to fetch employee history', error.message);
    }
};

exports.generateVerificationProof = async (req, res) => {
    try {
        const { employmentId } = req.params;
        const contract = fabricService.getContractV2(CONTRACT_NAME);

        console.log(`Evaluating Transaction: GenerateVerificationProof [${employmentId}]`);
        const resultBytes = await contract.evaluateTransaction('GenerateVerificationProof', employmentId);
        const proof = JSON.parse(resultBytes.toString('utf8'));

        logTransaction('evaluateTransaction: GenerateVerificationProof', `/api/v2/verifier/proof/${employmentId}`, null, 'SUCCESS', proof);

        return successResponse(res, proof, { peerUsed: getActivePeer() });
    } catch (error) {
        logTransaction('evaluateTransaction: GenerateVerificationProof', `/api/v2/verifier/proof/${req.params.employmentId}`, null, 'FAILURE', null, error.message);
        return errorResponse(res, 500, 'Failed to generate verification proof', error.message);
    }
};
