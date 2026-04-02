import React from 'react';
import { motion } from 'framer-motion';
import { Database, Activity, WifiOff } from 'lucide-react';
import { useDashboard } from '../../store/DashboardContext';

const LedgerCloud = () => {
    const { isCloudActive, activePeerCount, networkHeight } = useDashboard();

    return (
        <div className="flex flex-col items-center justify-center relative z-20">
            {/* Outer Glow Core */}
            <motion.div
                className={`w-36 h-36 rounded-full flex items-center justify-center relative ${isCloudActive ? 'bg-surfaceHighlight shadow-glow-cyan border border-accentCyan/50' : 'bg-surface border border-gray-700'
                    }`}
                animate={isCloudActive ? {
                    boxShadow: ['0px 0px 20px rgba(0,240,255,0.2)', '0px 0px 40px rgba(0,240,255,0.6)', '0px 0px 20px rgba(0,240,255,0.2)']
                } : {}}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
                {/* Inner pulsing core */}
                <motion.div
                    className={`absolute inset-0 rounded-full opacity-20 ${isCloudActive ? 'bg-accentCyan' : 'bg-gray-600'}`}
                    animate={isCloudActive ? { scale: [1, 1.15, 1], opacity: [0.1, 0.3, 0.1] } : {}}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />

                <div className="flex flex-col items-center justify-center text-center z-10">
                    <Database className={`w-8 h-8 mb-2 ${isCloudActive ? 'text-accentCyan' : 'text-gray-500'}`} />
                    <span className="text-xs font-mono font-bold tracking-widest uppercase text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                        Ledger Core
                    </span>
                    {isCloudActive ? (
                        <div className="flex items-center gap-1 mt-1">
                            <Activity className="w-3 h-3 text-accentCyan animate-pulse" />
                            <span className="text-[10px] font-mono text-accentCyan">{activePeerCount} PEER{activePeerCount > 1 ? 'S' : ''}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1 mt-1">
                            <WifiOff className="w-3 h-3 text-statusRed" />
                            <span className="text-[10px] font-mono text-statusRed">OFFLINE</span>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default LedgerCloud;
