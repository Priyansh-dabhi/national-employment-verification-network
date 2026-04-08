/**
 * webhookDispatcher.js
 * Secure webhook delivery to Web2 backend
 */
const axios = require('axios');
const crypto = require('crypto');
const { logTransaction } = require('../utils/logger');

class WebhookDispatcher {
    constructor() {
        this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:4000';
        this.webhookSecret = process.env.WEBHOOK_SECRET || 'nevs-webhook-hmac-secret';
        
        // Map chaincode events to slugified webhook paths
        this.eventMap = {
            'EmployeeRegistered': '/api/webhooks/fabric/employee-registered',
            'EmploymentProposed': '/api/webhooks/fabric/employment-proposed',
            'EmploymentConsented': '/api/webhooks/fabric/employment-consented',
            'EmploymentConfirmed': '/api/webhooks/fabric/employment-confirmed',
            'EmploymentTerminated': '/api/webhooks/fabric/employment-terminated'
        };
    }

    _signPayload(payloadString) {
        return crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payloadString)
            .digest('hex');
    }

    async _retry(fn, maxRetries = 3, baseDelay = 2000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await fn();
            } catch (err) {
                if (attempt === maxRetries) {
                    throw err;
                }
                const delay = baseDelay * Math.pow(2, attempt - 1);
                console.warn(`Webhook dispatch failed. Retrying in ${delay}ms... (Attempt ${attempt}/${maxRetries}): ${err.message}`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    async dispatch(eventName, payload, txId, blockNumber) {
        const path = this.eventMap[eventName];
        if (!path) {
            console.warn(`WebhookDispatcher: Unknown event '${eventName}', skipping.`);
            return;
        }

        const url = `${this.webhookBaseUrl}${path}`;
        const body = {
            eventName,
            txId,
            blockNumber: blockNumber ? Number(blockNumber) : null,
            timestamp: new Date().toISOString(),
            payload
        };

        const bodyString = JSON.stringify(body);
        const signature = this._signPayload(bodyString);

        const executeDispatch = async () => {
            const response = await axios.post(url, bodyString, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-nevs-signature': signature,
                    'x-nevs-event': eventName,
                    'x-nevs-txid': txId
                },
                timeout: 5000
            });
            return response;
        };

        try {
            await this._retry(executeDispatch);
            logTransaction(`WebhookDispatch:${eventName}`, url, txId, 'SUCCESS', null);
            console.log(`Successfully dispatched webhook for ${eventName} to ${url}`);
        } catch (error) {
            logTransaction(`WebhookDispatch:${eventName}`, url, txId, 'FAILED', null, error.message);
            console.error(`Failed to dispatch webhook for ${eventName} after retries:`, error.message);
            // We don't throw here to avoid crashing the event listener loop
        }
    }
}

module.exports = new WebhookDispatcher();
