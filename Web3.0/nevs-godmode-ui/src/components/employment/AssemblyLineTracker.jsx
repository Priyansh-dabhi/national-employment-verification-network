import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Cpu } from 'lucide-react';
import PendingPacketCard from './PendingPacketCard';
import { generateMockPacket } from '../../utils/mockDataGenerator';
import { useDashboard } from '../../store/DashboardContext';
import api, { endpoints } from '../../services/api';

const AssemblyLineTracker = () => {
    const { addLog, triggerRegistryRefresh, isFabricReady } = useDashboard();

    const [packets, setPackets] = useState([
        generateMockPacket(),
        generateMockPacket(),
        generateMockPacket(),
    ]);
    const [committingIds, setCommittingIds] = useState(new Set());

    const handleCommit = useCallback(async (localId) => {
        const packet = packets.find(p => p.localId === localId);
        if (!packet) return;

        // 1. Mark as committing
        setCommittingIds(prev => new Set(prev).add(localId));
        addLog(`Submitting employment packet ${packet.recordID} to blockchain...`, 'info');

        try {
            // 2. POST to backend with exactly the 6 required fields
            const response = await api.post(endpoints.employment, {
                recordID: packet.recordID,
                employeeID: packet.employeeID,
                employerID: packet.employerID,
                position: packet.position,
                startDate: packet.startDate,
                status: packet.status,
            });

            if (response && response.success) {
                const txId = response.txId || 'N/A'; // Fixed pulling txId from the correct root level
                addLog(`✓ ${packet.recordID} committed! TxID: ${txId}`, 'success');
                triggerRegistryRefresh();
            }
        } catch (err) {
            addLog(`✗ Failed to commit ${packet.recordID}: ${err.message}`, 'error');
        } finally {
            // 3. Remove the packet (triggers exit animation)
            setPackets(prev => prev.filter(p => p.localId !== localId));
            setCommittingIds(prev => {
                const next = new Set(prev);
                next.delete(localId);
                return next;
            });

            // 4. Generate a replacement packet after a brief pause
            setTimeout(() => {
                setPackets(prev => [...prev, generateMockPacket()]);
            }, 400);
        }
    }, [packets, addLog, triggerRegistryRefresh]);

    return (
        <div className="glass-panel rounded-xl flex flex-col h-full border-borderGlow/30 overflow-hidden shadow-glow-cyan/10">
            <div className="px-4 py-3 border-b border-borderGlow/50 bg-surfaceHighlight/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-accentCyan" />
                    <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase">Assembly Line Factory</h2>
                </div>
                <div className="flex items-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}>
                        <Settings className="w-3.5 h-3.5 text-gray-500" />
                    </motion.div>
                </div>
            </div>

            <div className="flex-1 p-4 bg-black/20 flex gap-4 overflow-x-auto items-center">
                <AnimatePresence mode="popLayout">
                    {packets.map((packet) => (
                        <PendingPacketCard
                            key={packet.localId}
                            data={packet}
                            onCommit={handleCommit}
                            isCommitting={committingIds.has(packet.localId)}
                            isDisabled={!isFabricReady}
                        />
                    ))}
                </AnimatePresence>

                {/* Empty factory slot indicator */}
                <div className="min-w-[200px] h-full border-2 border-dashed border-borderGlow/30 rounded-lg flex flex-col items-center justify-center text-gray-600">
                    <Settings className="w-6 h-6 mb-2 opacity-50" />
                    <span className="font-mono text-[10px]">AWAITING DATA</span>
                </div>
            </div>
        </div>
    );
};

export default AssemblyLineTracker;
