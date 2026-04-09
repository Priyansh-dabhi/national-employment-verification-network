import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { API_BASE_URL, endpoints } from '../services/api';

const DashboardContext = createContext(null);

// Log entry helpers
let logIdCounter = 1;
const createLog = (message, type = 'info') => ({
    id: logIdCounter++,
    timestamp: new Date(),
    message,
    type // 'info' | 'success' | 'warn' | 'error'
});

export const DashboardProvider = ({ children }) => {
    // ── Network State ──
    const [peers, setPeers] = useState([
        { name: 'peer0.central.govt', status: 'OFFLINE', height: 0 },
        { name: 'peer1.central.govt', status: 'OFFLINE', height: 0 },
    ]);
    const [networkHeight, setNetworkHeight] = useState(0);
    const [isFabricReady, setIsFabricReady] = useState(false);

    // ── System Logs ──
    const [logs, setLogs] = useState([
        createLog('NEVS Command Center initialized. Awaiting telemetry...', 'info')
    ]);

    // ── Fabric SSE stream ──
    useEffect(() => {
        const url = `${API_BASE_URL}${endpoints.statusStream}`;
        console.log(`🔌 Connecting to Fabric status stream: ${url}`);
        const sse = new EventSource(url);

        sse.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setIsFabricReady(data.isReady);
            } catch (err) {
                console.error('Failed to parse status stream message:', err);
            }
        };

        sse.onerror = (err) => {
            console.error('SSE Error:', err);
            setIsFabricReady(false);
        };

        return () => sse.close();
    }, []);

    // ── Loading States & Triggers ──
    const [isSyncing, setIsSyncing] = useState(false);
    const [registryRefreshTrigger, setRegistryRefreshTrigger] = useState(0);

    const triggerRegistryRefresh = useCallback(() => {
        setRegistryRefreshTrigger(prev => prev + 1);
    }, []);

    // ── Add a log entry ──
    const addLog = useCallback((message, type = 'info') => {
        setLogs(prev => [...prev.slice(-100), createLog(message, type)]); // Keep max 100 logs
    }, []);

    // ── Update peers from sync status API ──
    const updatePeers = useCallback((syncData) => {
        if (syncData && syncData.peers) {
            setPeers(syncData.peers.map(p => ({
                name: p.name,
                status: p.status,
                height: p.height ?? 0,
            })));
            setNetworkHeight(syncData.networkHeight || 0);
        }
    }, []);

    // ── Derived States ──
    const isCloudActive = peers.some(p => p.status !== 'OFFLINE');
    const activePeerCount = peers.filter(p => p.status !== 'OFFLINE').length;

    const value = {
        peers,
        setPeers,
        networkHeight,
        setNetworkHeight,
        isCloudActive,
        activePeerCount,
        isFabricReady,
        logs,
        addLog,
        updatePeers,
        isSyncing,
        setIsSyncing,
        registryRefreshTrigger,
        triggerRegistryRefresh,
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};

export const useDashboard = () => {
    const ctx = useContext(DashboardContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
};

export default DashboardContext;
