import { useEffect, useRef, useCallback } from 'react';
import api, { endpoints } from '../services/api';
import { useDashboard } from '../store/DashboardContext';

const POLL_INTERVAL = 3000; // 3 seconds

export const useNetworkSync = () => {
    const { updatePeers, addLog, setIsSyncing } = useDashboard();
    const prevPeersRef = useRef([]); // To detect status transitions for logging

    const fetchSyncStatus = useCallback(async () => {
        try {
            setIsSyncing(true);
            const response = await api.get(endpoints.syncStatus);
            if (response && response.success && response.data) {
                const syncData = response.data;

                // Detect status transitions for terminal logging
                const prevPeers = prevPeersRef.current;
                if (syncData.peers) {
                    syncData.peers.forEach(peer => {
                        const prev = prevPeers.find(p => p.name === peer.name);
                        if (prev && prev.status !== peer.status) {
                            // Status changed — log it
                            if (peer.status === 'SYNCED') {
                                addLog(`${peer.name} SYNCED at block ${peer.height}`, 'success');
                            } else if (peer.status === 'CATCHING_UP') {
                                addLog(`${peer.name} CATCHING_UP (height: ${peer.height}, network: ${syncData.networkHeight})`, 'warn');
                            } else if (peer.status === 'OFFLINE') {
                                addLog(`${peer.name} went OFFLINE`, 'error');
                            }
                        }
                    });
                    prevPeersRef.current = syncData.peers;
                }

                updatePeers(syncData);
            }
        } catch (err) {
            // Don't spam logs on every failed poll
            console.warn('Sync poll failed:', err.message);
        } finally {
            setIsSyncing(false);
        }
    }, [updatePeers, addLog, setIsSyncing]);

    useEffect(() => {
        // Initial fetch
        fetchSyncStatus();

        const interval = setInterval(fetchSyncStatus, POLL_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchSyncStatus]);

    return { fetchSyncStatus };
};

// ── Peer Control Actions ──
export const usePeerControl = () => {
    const { addLog } = useDashboard();

    const stopPeer = useCallback(async (peerName) => {
        addLog(`Initiating KILL sequence for ${peerName}...`, 'warn');
        try {
            const response = await api.post(endpoints.peerStop, { peer: peerName });
            if (response && response.success) {
                addLog(`${peerName} STOPPED successfully`, 'error');
            }
        } catch (err) {
            addLog(`Failed to stop ${peerName}: ${err.message}`, 'error');
        }
    }, [addLog]);

    const startPeer = useCallback(async (peerName) => {
        addLog(`Initiating START sequence for ${peerName}...`, 'info');
        try {
            const response = await api.post(endpoints.peerStart, { peer: peerName });
            if (response && response.success) {
                addLog(`${peerName} START command sent. Awaiting sync...`, 'success');
            }
        } catch (err) {
            addLog(`Failed to start ${peerName}: ${err.message}`, 'error');
        }
    }, [addLog]);

    return { stopPeer, startPeer };
};
