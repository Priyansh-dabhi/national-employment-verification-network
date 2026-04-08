/**
 * fabricCAService.js
 * Handles identity minting via Fabric CA
 */
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const path = require('path');

class FabricCAService {
    constructor() {
        this.caURL = process.env.FABRIC_CA_URL || 'https://127.0.0.1:7054';
        this.caName = process.env.FABRIC_CA_NAME || 'ca-central-govt';
        this.caAdmin = process.env.FABRIC_CA_ADMIN || 'admin';
        this.caAdminPw = process.env.FABRIC_CA_ADMIN_PW || 'adminpw';
        this.mspId = process.env.MSPID || 'CentralGovtMSP';
        this.walletPath = process.env.WALLET_PATH || path.join(__dirname, '..', '..', 'wallet');
        
        // For local development, TLS verification is set to false
        // In production, `trustedRoots` should be populated with the root CA certificate
        this.caClient = new FabricCAServices(this.caURL, { trustedRoots: [], verify: false }, this.caName);
    }

    async getWallet() {
        return await Wallets.newFileSystemWallet(this.walletPath);
    }

    async enrollAdmin() {
        try {
            const wallet = await this.getWallet();
            const adminIdentity = await wallet.get(this.caAdmin);
            if (adminIdentity) {
                console.log('An identity for the admin user already exists in the wallet');
                return;
            }
            
            console.log(`Enrolling admin user ${this.caAdmin} with CA...`);
            const enrollment = await this.caClient.enroll({
                enrollmentID: this.caAdmin,
                enrollmentSecret: this.caAdminPw
            });
            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };
            await wallet.put(this.caAdmin, x509Identity);
            console.log('Successfully enrolled admin user and imported it into the wallet');
        } catch (error) {
            console.error(`Failed to enroll admin user: ${error}`);
            throw error;
        }
    }

    async registerEmployee(employeeID) {
        try {
            const wallet = await this.getWallet();
            await this.enrollAdmin();
            const adminIdentity = await wallet.get(this.caAdmin);
            if (!adminIdentity) {
                throw new Error('An identity for the admin user does not exist in the wallet');
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, this.caAdmin);

            const enrollmentID = `employee_${employeeID}`;
            
            // Check if user already exists
            const userIdentity = await wallet.get(enrollmentID);
            if (userIdentity) {
                console.log(`An identity for ${enrollmentID} already exists in the wallet`);
                return { enrollmentID };
            }

            console.log(`Registering employee ${enrollmentID} with CA...`);
            // Register the user
            const secret = await this.caClient.register({
                affiliation: '',
                enrollmentID: enrollmentID,
                role: 'client',
                attrs: [
                    { name: "employeeID", value: employeeID, ecert: true },
                    { name: "role", value: "employee", ecert: true }
                ]
            }, adminUser);

            console.log(`Enrolling employee ${enrollmentID} with CA...`);
            // Enroll the user
            const enrollment = await this.caClient.enroll({
                enrollmentID: enrollmentID,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put(enrollmentID, x509Identity);
            console.log(`Successfully registered and enrolled user ${enrollmentID} and imported it into the wallet`);

            return { enrollmentID, certificate: enrollment.certificate };
        } catch (error) {
            console.error(`Failed to register user: ${error}`);
            throw error;
        }
    }

    async registerCompanyIdentity(companyID) {
        try {
            const wallet = await this.getWallet();
            await this.enrollAdmin();
            const adminIdentity = await wallet.get(this.caAdmin);
            if (!adminIdentity) {
                throw new Error('An identity for the admin user does not exist in the wallet');
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, this.caAdmin);

            const enrollmentID = `company_${companyID}`;
            
            // Check if user already exists
            const userIdentity = await wallet.get(enrollmentID);
            if (userIdentity) {
                console.log(`An identity for ${enrollmentID} already exists in the wallet`);
                return { enrollmentID };
            }

            console.log(`Registering company ${enrollmentID} with CA...`);
            // Register the user
            const secret = await this.caClient.register({
                affiliation: '',
                enrollmentID: enrollmentID,
                role: 'client',
                attrs: [
                    { name: "companyId", value: companyID, ecert: true },
                    { name: "role", value: "company", ecert: true }
                ]
            }, adminUser);

            console.log(`Enrolling company ${enrollmentID} with CA...`);
            // Enroll the user
            const enrollment = await this.caClient.enroll({
                enrollmentID: enrollmentID,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: this.mspId,
                type: 'X.509',
            };

            await wallet.put(enrollmentID, x509Identity);
            console.log(`Successfully registered and enrolled user ${enrollmentID}`);

            return { enrollmentID, certificate: enrollment.certificate };
        } catch (error) {
            console.error(`Failed to register company user: ${error}`);
            throw error;
        }
    }
}

module.exports = new FabricCAService();
