/**
 * logger.js
 * Structured logging for Fabric transactions
 */
const logTransaction = (action, endpoint, txId, status, payload, errorMsg = null) => {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        endpoint,
        txId: txId || 'N/A',
        status,
    };

    if (payload) {
        logEntry.ledgerResponse = payload;
    }

    if (errorMsg) {
        logEntry.error = errorMsg;
    }

    console.log(JSON.stringify(logEntry, null, 2));
};

module.exports = {
    logTransaction
};
