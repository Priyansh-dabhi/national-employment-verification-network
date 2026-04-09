const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        const walletPath = path.join(__dirname, '..', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        console.log(`Wallet path: ${walletPath}`);

        const credsPath = path.join(__dirname, '..', '..', 'nevs-ledger', 'network', 'organizations', 'peerOrganizations', 'company.org', 'users', 'Admin@company.org', 'msp');
        
        const certPath = path.join(credsPath, 'signcerts', 'cert.pem');
        const keystorePath = path.join(credsPath, 'keystore');
        
        if (!fs.existsSync(certPath)) {
            console.error(`Certificate not found at ${certPath}`);
            return;
        }

        const certificate = fs.readFileSync(certPath).toString();

        const files = fs.readdirSync(keystorePath);
        const keyFile = files.find(file => file.endsWith('_sk'));
        if (!keyFile) {
            console.error('Private key not found in keystore');
            return;
        }

        const privateKey = fs.readFileSync(path.join(keystorePath, keyFile)).toString();

        const identity = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId: 'CompanyOrgMSP',
            type: 'X.509',
        };

        await wallet.put('Admin@company.org', identity);
        console.log('Successfully imported Admin@company.org into wallet');
    } catch (error) {
        console.error(`Error adding to wallet: ${error}`);
    }
}

main();
