/**
 * eventListenerService.js
 * Listens to nevs chaincode events and forwards them to webhookDispatcher
 */
const webhookDispatcher = require('./webhookDispatcher');

class EventListenerService {
    constructor() {
        this.enabled = process.env.EVENT_LISTENER_ENABLED === 'true';
        this.maxRetries = parseInt(process.env.EVENT_RETRY_MAX || '5', 10);
        this.network = null;
        this.listenerPromise = null;
        this.contract = null;
    }

    async start(network) {
        if (!this.enabled) {
            console.log('Event listener service is disabled by configuration.');
            return;
        }

        if (!network) {
            throw new Error('Network instance is required to start the event listener');
        }

        this.network = network;
        this.contract = network.getContract(process.env.CHAINCODE_NAME_V2 || 'nevs');

        console.log('Starting event listener service for chaincode nevs...');

        try {
            this.listenerPromise = await this.contract.addContractListener(this._handleContractEvent.bind(this));
            console.log('Successfully registered contract listener.');
        } catch (error) {
            console.error('Failed to start event listener:', error);
            this._reconnect();
        }
    }

    async _handleContractEvent(event) {
        try {
            const eventName = event.eventName;
            const payload = event.payload ? JSON.parse(event.payload.toString('utf8')) : {};
            const transactionEvent = event.getTransactionEvent();
            const txId = transactionEvent.transactionId;
            const blockEvent = transactionEvent.getBlockEvent ? transactionEvent.getBlockEvent() : null;
            const blockNumber = blockEvent ? blockEvent.blockNumber : null;

            console.log(`Received contract event: ${eventName} from tx: ${txId} `);
            
            // Dispatch to webhook
            await webhookDispatcher.dispatch(eventName, payload, txId, blockNumber);
            
        } catch (error) {
            console.error(`Failed to handle contract event: ${error.message}`);
        }
    }

    async _reconnect() {
        if (!this.enabled) return;

        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            const delay = Math.min(3000 * Math.pow(2, attempt - 1), 48000);
            console.log(`Event listener reconnect attempt ${attempt}/${this.maxRetries}, waiting ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
            
            try {
                if (this.contract) {
                    // Try to re-add the listener
                    this.listenerPromise = await this.contract.addContractListener(this._handleContractEvent.bind(this));
                    console.log('Event listener reconnected successfully');
                    return;
                }
            } catch (err) {
                console.error(`Reconnect attempt ${attempt} failed:`, err.message);
            }
        }
        console.error('Event listener: max reconnect attempts reached. Service is down.');
    }

    stop() {
        if (this.contract && this.listenerPromise) {
            this.contract.removeContractListener(this.listenerPromise);
            this.listenerPromise = null;
            console.log('Event listener service stopped.');
        }
    }
}

module.exports = new EventListenerService();
