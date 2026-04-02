require('dns').setDefaultResultOrder('ipv4first');
require('dotenv').config();
const app = require('./app');
const fabricService = require('./services/fabricService');

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        console.log('Starting NEVS Gateway Backend...');

        // Start listening immediately so SSE connections can be established
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        // Initialize Fabric Connection in the background
        fabricService.initConnection()
            .then(() => {
                console.log(`✅ Successfully connected to Fabric network (Channel: ${process.env.CHANNEL_NAME}, Chaincode: ${process.env.CHAINCODE_NAME})`);
            })
            .catch((err) => {
                console.error('❌ Failed to initialize Fabric connection:', err.message);
                // We don't exit the process here so God Mode endpoints still work to control peers
            });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
