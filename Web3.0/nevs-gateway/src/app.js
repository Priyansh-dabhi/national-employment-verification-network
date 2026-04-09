const express = require('express');
const cors = require('cors');
const employmentRoutes = require('./routes/employmentRoutes');
const govtRoutes = require('./routes/govtRoutes');
const companyRoutes = require('./routes/companyRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const verifierRoutes = require('./routes/verifierRoutes');
const { errorResponse } = require('./utils/responseHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const godModeRoutes = require('./routes/godModeRoutes');
app.use('/api/godmode', godModeRoutes);
app.use('/api/employment', employmentRoutes);

// Phase 4 Routes
const internalRoutes = require('./routes/internalRoutes');
app.use('/api/internal', internalRoutes);

// Phase 2 Routes
app.use('/api/v2/govt', govtRoutes);
app.use('/api/v2/company', companyRoutes);
app.use('/api/v2/employee', employeeRoutes);
app.use('/api/v2/verifier', verifierRoutes);

// 404 handler
app.use((req, res) => {
    errorResponse(res, 404, 'Endpoint not found');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    errorResponse(res, 500, 'Internal server error', err.message);
});

module.exports = app;
