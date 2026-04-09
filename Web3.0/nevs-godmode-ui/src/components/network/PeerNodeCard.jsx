import React from 'react';
import { Server, Power, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PeerNodeCard = ({
    name = "peer0.central.govt",
    status = "SYNCED", // SYNCED, CATCHING_UP, OFFLINE
    height = 42,
    isToggling = false,
    onToggle
}) => {
    const isOnline = status !== 'OFFLINE';
    const isCatchingUp = status === 'CATCHING_UP';

    // Status colors
    const statusColors = {
        SYNCED: 'text-statusGreen',
        CATCHING_UP: 'text-statusAmber',
        OFFLINE: 'text-statusRed'
    };

    const statusBg = {
        SYNCED: 'bg-statusGreen/10 border-statusGreen/30',
        CATCHING_UP: 'bg-statusAmber/10 border-statusAmber/30',
        OFFLINE: 'bg-statusRed/10 border-statusRed/30'
    };

    return (
        <motion.div
            className={`relative w-64 glass-panel rounded-xl p-5 flex flex-col items-center ${isOnline ? 'shadow-glow-cyan/20 border-accentCyan/30' : 'opacity-70 grayscale-[0.5]'
                }`}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.2 }}
        >
            {/* Background glow effect based on status */}
            <div className={`absolute inset-0 rounded-xl blur-xl -z-10 ${status === 'SYNCED' ? 'bg-statusGreen/5' :
                status === 'CATCHING_UP' ? 'bg-statusAmber/5' :
                    'bg-statusRed/5'
                }`} />

            {/* Header */}
            <div className="flex w-full justify-between items-start mb-4">
                <Server className={`w-6 h-6 ${isOnline ? 'text-accentCyan' : 'text-gray-500'}`} />
                <div className={`px-2 py-0.5 rounded text-[10px] font-mono border flex items-center gap-1 ${statusBg[status]} ${statusColors[status]}`}>
                    {status === 'SYNCED' && <div className="w-1.5 h-1.5 rounded-full bg-statusGreen animate-pulse" />}
                    {isCatchingUp && <RefreshCw className="w-3 h-3 animate-spin" />}
                    {status === 'OFFLINE' && <AlertCircle className="w-3 h-3" />}
                    {status}
                </div>
            </div>

            {/* Peer Name */}
            <h3 className="font-mono font-semibold text-white text-sm mb-1">{name}</h3>
            <p className="font-sans text-xs text-gray-400 mb-6 border-b border-borderGlow/50 w-full text-center pb-2">
                Fabric Node
            </p>

            {/* Metrics Layout */}
            <div className="flex w-full justify-between items-end">
                <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Block Height</span>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-mono ${isOnline ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]' : 'text-gray-600'}`}>
                            {height}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">BLKS</span>
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    disabled={isToggling}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isOnline
                        ? 'bg-statusRed/10 text-statusRed hover:bg-statusRed hover:text-white border border-statusRed/30 shadow-glow-red/20'
                        : 'bg-statusGreen/10 text-statusGreen hover:bg-statusGreen hover:text-white border border-statusGreen/30 shadow-glow-green/20'
                        } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isOnline ? "Kill Node" : "Start Node"}
                >
                    {isToggling ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                        <Power className="w-4 h-4" />
                    )}
                </button>
            </div>

            {/* Overlay for Catching Up to show a subtle progress bar effect */}
            {isCatchingUp && (
                <div className="absolute bottom-0 left-0 h-1 bg-statusAmber w-full rounded-b-xl overflow-hidden">
                    <motion.div
                        className="h-full bg-white/50"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />
                </div>
            )}
        </motion.div>
    );
};

export default PeerNodeCard;
