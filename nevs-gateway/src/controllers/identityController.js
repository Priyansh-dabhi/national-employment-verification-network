/**
 * identityController.js
 * Handles identity minting requests from Web2
 */
const fabricCAService = require('../services/fabricCAService');
const fabricService = require('../services/fabricService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

class IdentityController {
    async mintIdentity(req, res) {
        try {
            const { employeeID, fullName, dateOfBirth, idHash } = req.body;
            
            if (!employeeID || !fullName) {
                return errorResponse(res, 400, 'Missing required fields', 'employeeID and fullName are required.');
            }

            // Register and enroll via CA
            const { enrollmentID } = await fabricCAService.registerEmployee(employeeID);

            // Respond 202 Accepted immediately
            res.status(202).json({
                success: true,
                timestamp: new Date().toISOString(),
                data: {
                    status: 'MINTING',
                    employeeID: employeeID,
                    enrollmentID: enrollmentID,
                    message: "Identity registration submitted to blockchain"
                }
            });

            // Submit chaincode transaction asynchronously
            try {
                const contract = fabricService.network.getContract(process.env.CHAINCODE_NAME_V2 || 'nevs');
                await contract.submitTransaction('RegisterEmployee', employeeID, fullName, "MINTING", "GOVT");
                console.log(`Successfully submitted RegisterEmployee for ${employeeID}`);
            } catch (err) {
                console.error(`Failed to submit RegisterEmployee to chaincode for ${employeeID}:`, err);
            }

        } catch (error) {
            console.error('Error minting identity:', error);
            if (error.message && error.message.includes('already exists')) {
                return errorResponse(res, 409, 'Identity already exists', error.message);
            }
            return errorResponse(res, 500, 'Fabric CA registration failed', error.message);
        }
    }

    async mintCompanyIdentity(req, res) {
        try {
            const { companyID } = req.body;
            
            if (!companyID) {
                return errorResponse(res, 400, 'Missing required fields: companyID');
            }

            // Register and enroll via CA
            const { enrollmentID } = await fabricCAService.registerCompanyIdentity(companyID);

            res.status(202).json({
                success: true,
                timestamp: new Date().toISOString(),
                data: {
                    status: 'MINTING',
                    companyID: companyID,
                    enrollmentID: enrollmentID
                }
            });
        } catch (error) {
            if (error.message && error.message.includes('already exists')) {
                return errorResponse(res, 409, 'Identity already exists', error.message);
            }
            return errorResponse(res, 500, 'Fabric CA registration failed', error.message);
        }
    }

    async getIdentityStatus(req, res) {
        try {
            const { employeeID } = req.params;
            const wallet = await fabricCAService.getWallet();
            const enrollmentID = `employee_${employeeID}`;
            
            const identity = await wallet.get(enrollmentID);
            
            return successResponse(res, {
                exists: !!identity,
                enrollmentID: enrollmentID,
                walletIdentity: !!identity
            });
        } catch (error) {
            return errorResponse(res, 500, 'Failed to check identity status', error.message);
        }
    }
}

module.exports = new IdentityController();
