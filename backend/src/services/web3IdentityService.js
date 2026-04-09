import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

const gatewayUrl = process.env.NEVS_GATEWAY_URL || 'http://localhost:3000';
const internalApiKey = process.env.INTERNAL_API_KEY || 'nevs-internal-secret-key';

export const mintEmployeeIdentity = async (employeeId) => {
    try {
        const web3Id = uuidv4();

        // 1. Mark as MINTING locally
        await pool.query(
            "UPDATE employees SET web3_employee_id = $1, web3_status = 'MINTING' WHERE id = $2",
            [web3Id, employeeId]
        );

        const employeeQuery = await pool.query('SELECT full_name, date_of_birth FROM employees WHERE id = $1', [employeeId]);
        const employee = employeeQuery.rows[0];

        // 2. Call Web3 Gateway via secure backchannel
        const response = await axios.post(
            `${gatewayUrl}/api/internal/mint-identity`,
            {
                employeeID: web3Id,
                fullName: employee.full_name,
                dateOfBirth: employee.date_of_birth
            },
            {
                headers: {
                    'x-api-key': internalApiKey,
                },
            }
        );

        if (response.status === 202) {
            console.log(`Identity minting initiated for employee ${employeeId}`);
        }
    } catch (error) {
        console.error('Failed to trigger Web3 identity minting for employee:', error);
        await pool.query(
            "UPDATE employees SET web3_status = 'FAILED' WHERE id = $1",
            [employeeId]
        );
    }
};

export const mintCompanyIdentity = async (employerId) => {
    try {
        const web3Id = uuidv4();

        await pool.query(
            "UPDATE employers SET web3_company_id = $1, web3_status = 'MINTING' WHERE id = $2",
            [web3Id, employerId]
        );

        const response = await axios.post(
            `${gatewayUrl}/api/internal/mint-company-identity`,
            {
                companyID: web3Id
            },
            {
                headers: {
                    'x-api-key': internalApiKey,
                },
            }
        );

        if (response.status === 202) {
            console.log(`Identity minting initiated for employer ${employerId}`);
        }
    } catch (error) {
        console.error('Failed to trigger Web3 identity minting for employer:', error);
        await pool.query(
            "UPDATE employers SET web3_status = 'FAILED' WHERE id = $1",
            [employerId]
        );
    }
};
