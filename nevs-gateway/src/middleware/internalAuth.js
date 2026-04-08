/**
 * internalAuth.js
 * Middleware to protect internal gateway endpoints
 */
const { errorResponse } = require('../utils/responseHandler');

module.exports = (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.INTERNAL_API_KEY) {
        return errorResponse(res, 401, 'Unauthorized: Invalid API key', 'Missing or incorrect x-api-key header.');
    }
    next();
};
