import React, { useState } from 'react';
import GlassCard from '../shared/GlassCard';
import { Power, PowerOff, Loader2 } from 'lucide-react';
import api, { endpoints } from '../../services/api';

const PeerActionButton = ({ peerName, action, isLoading, onClick }) => {
    const isStart = action === 'START';

    return (
        <button
            onClick={() => onClick(peerName, action)}
            disabled={isLoading}
            className={`
        relative overflow-hidden group px-4 py-3 rounded-xl flex items-center justify-between gap-3
        border transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed
        ${isStart
                    ? 'bg-statusGreen/10 border-statusGreen/30 hover:bg-statusGreen/20 hover:border-statusGreen/50 hover:shadow-glow-green text-statusGreen'
                    : 'bg-statusRed/10 border-statusRed/30 hover:bg-statusRed/20 hover:border-statusRed/50 hover:shadow-glow-red text-statusRed'
                }
      `}
        >
            <div className="flex flex-col items-start min-w-0 flex-1 overflow-hidden">
                <span className="text-xs uppercase tracking-widest opacity-80 mb-1 shrink-0">{action} PEER</span>
                <span className="font-mono font-medium text-gray-200 truncate w-full text-left" title={peerName}>{peerName}</span>
            </div>

            <div className={`p-2 rounded-lg shrink-0
        ${isStart ? 'bg-statusGreen/20' : 'bg-statusRed/20'} 
        transition-transform duration-300 group-hover:scale-110
      `}>
                {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : isStart ? (
                    <Power className="w-5 h-5" />
                ) : (
                    <PowerOff className="w-5 h-5" />
                )}
            </div>
        </button>
    );
};

const PeerControlPanel = () => {
    const [loadingAction, setLoadingAction] = useState(null); // e.g., 'peer0.central.govt-START'
    const [toast, setToast] = useState(null);

    const handleAction = async (peerName, action) => {
        // Basic confirmation guard
        if (action === 'STOP' && !window.confirm(`Are you sure you want to STOP ${peerName}? This simulates a node failure.`)) {
            return;
        }

        setLoadingAction(`${peerName}-${action}`);
        setToast(null);

        try {
            const endpoint = action === 'START' ? endpoints.peerStart : endpoints.peerStop;
            await api.post(endpoint, { peer: peerName });

            setToast({ type: 'success', message: `Command ${action} accepted for ${peerName}` });
        } catch (err) {
            console.error(`Failed to ${action} peer:`, err);
            setToast({ type: 'error', message: err.message || `Failed to ${action} ${peerName}` });
        } finally {
            setLoadingAction(null);
            // Auto-clear toast
            setTimeout(() => setToast(null), 5000);
        }
    };

    return (
        <div className="space-y-4">
            <GlassCard title="Node Lifecycle Control" hoverEffect>
                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-3">
                        <PeerActionButton
                            peerName="peer0.central.govt"
                            action="STOP"
                            isLoading={loadingAction === 'peer0.central.govt-STOP'}
                            onClick={handleAction}
                        />
                        <PeerActionButton
                            peerName="peer0.central.govt"
                            action="START"
                            isLoading={loadingAction === 'peer0.central.govt-START'}
                            onClick={handleAction}
                        />
                    </div>

                    <div className="space-y-3">
                        <PeerActionButton
                            peerName="peer1.central.govt"
                            action="STOP"
                            isLoading={loadingAction === 'peer1.central.govt-STOP'}
                            onClick={handleAction}
                        />
                        <PeerActionButton
                            peerName="peer1.central.govt"
                            action="START"
                            isLoading={loadingAction === 'peer1.central.govt-START'}
                            onClick={handleAction}
                        />
                    </div>
                </div>
            </GlassCard>

            {/* Mini Toast Notification */}
            {toast && (
                <div className={`p-4 rounded-xl border text-sm font-mono flex items-center gap-3 animate-pulse ${toast.type === 'success'
                    ? 'bg-statusGreen/10 border-statusGreen/30 text-statusGreen'
                    : 'bg-statusRed/10 border-statusRed/30 text-statusRed'
                    }`}>
                    <span>{toast.type === 'success' ? '✓' : '⚠'}</span>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default PeerControlPanel;
