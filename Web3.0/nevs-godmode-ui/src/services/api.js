import axios from 'axios';

// The backend gateway runs on port 3000 locally
export const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor to unwrap our standardized API response format
// { success: true, data: {...}, timestamp: "...", peerUsed: "..." }
api.interceptors.response.use(
    (response) => {
        // If the backend returned our standardized success response, extract the data
        if (response.data && response.data.success !== undefined) {
            if (response.data.success) {
                return response.data; // Return full wrapper so components can access meta (peerUsed, txId)
            } else {
                return Promise.reject(new Error(response.data.message || 'API Error'));
            }
        }
        return response.data;
    },
    (error) => {
        const errorMsg = error.response?.data?.message || error.message || 'Network Error';
        return Promise.reject(new Error(errorMsg));
    }
);

export const endpoints = {
    networkStatus: '/godmode/network/status',
    syncStatus: '/godmode/peers/sync-status',
    statusStream: '/godmode/status/stream',
    peerStop: '/godmode/peer/stop',
    peerStart: '/godmode/peer/start',
    employment: '/employment',
};

export default api;
