/**
 * responseHandler.js
 * Standardized API response format for God Mode Dashboard
 * 
 * Success Shape:
 * { success: true, timestamp: "...", peerUsed: "...", txId: "...", data: {...} }
 * 
 * Error Shape:
 * { success: false, timestamp: "...", message: "...", details: "..." }
 */

const successResponse = (res, data, meta = {}, statusCode = 200) => {
    const response = {
        success: true,
        timestamp: new Date().toISOString(),
        peerUsed: meta.peerUsed || null,
        txId: meta.txId || null,
        data: data
    };
    return res.status(statusCode).json(response);
};

const errorResponse = (res, statusCode, message, details = null) => {
    const response = {
        success: false,
        timestamp: new Date().toISOString(),
        message: message
    };
    if (details) {
        response.details = details;
    }
    return res.status(statusCode).json(response);
};

module.exports = {
    successResponse,
    errorResponse
};
