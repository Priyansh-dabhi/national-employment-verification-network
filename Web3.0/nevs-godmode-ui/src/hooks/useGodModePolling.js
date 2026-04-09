import { useState, useEffect, useCallback } from 'react';
import api, { endpoints } from '../services/api';

const POLLING_INTERVAL_MS = 3000;

export const useGodModePolling = () => {
    const [networkData, setNetworkData] = useState({
        networkHeight: 0,
        peers: []
    });

    const [ledgerRecords, setLedgerRecords] = useState([]);

    const [isPolling, setIsPolling] = useState(true);
    const [error, setError] = useState(null);
    const [isLedgerLoading, setIsLedgerLoading] = useState(false);

    // Poll sync status
    const fetchSyncStatus = useCallback(async () => {
        if (!isPolling) return;
        try {
            const response = await api.get(endpoints.syncStatus);
            if (response.success && response.data) {
                setNetworkData(response.data);
                setError(null);
            }
        } catch (err) {
            console.error('Failed to fetch sync status:', err);
            setError('Connection to Command Center lost.');
        }
    }, [isPolling]);

    // Fetch ledger data (not polled automatically to save bandwidth, manually refreshed or triggered on load)
    const fetchLedger = useCallback(async () => {
        setIsLedgerLoading(true);
        try {
            // Fetch all employment records from the correctly working endpoint
            const response = await api.get('/employment');

            if (response && response.success) {
                // The gateway returns { success: true, count: X, data: [...] }
                setLedgerRecords(response.data || []);
                setError(null);
            }
        } catch (err) {
            console.warn('Backend read-path error:', err.message);
            setError('Failed to fetch employment ledger. Is the chaincode running?');
            setLedgerRecords([]);
        } finally {
            setIsLedgerLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSyncStatus();
        fetchLedger(); // Initial fetch

        const interval = setInterval(() => {
            fetchSyncStatus();
        }, POLLING_INTERVAL_MS);

        return () => clearInterval(interval);
    }, [fetchSyncStatus, fetchLedger]);

    // Expose controls to components
    return {
        networkData,
        ledgerRecords,
        isLedgerLoading,
        error,
        refreshLedger: fetchLedger,
        pausePolling: () => setIsPolling(false),
        resumePolling: () => setIsPolling(true)
    };
};
