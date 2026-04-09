import React from 'react';
import { Activity, WifiOff } from 'lucide-react';
import { useGodModePolling } from '../../hooks/useGodModePolling';

const Header = () => {
    const { networkData, error } = useGodModePolling();

    const maxHeight = networkData?.networkHeight || '--';

    return (
        <header className="glass-panel rounded-2xl p-6 flex items-center justify-between border-b border-borderGlow/50">
            <div className="flex items-center gap-4">
                {error ? (
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-statusRed/20 border border-statusRed/50 shadow-glow-red">
                        <WifiOff className="text-statusRed w-6 h-6 animate-pulse" />
                    </div>
                ) : (
                    <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-surfaceHighlight border border-accentCyan/30 shadow-glow-cyan">
                        <Activity className="text-accentCyan w-6 h-6 animate-pulse" />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold tracking-wider text-white font-mono uppercase">
                        NEVS Command Center
                    </h1>
                    <p className="text-sm text-gray-400 font-mono mt-1">
                        {error ? <span className="text-statusRed">{error}</span> : 'Global Hyperledger Fabric Architecture'}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-lg bg-surfaceHighlight/50 border border-borderGlow">
                    <div className="text-xs text-gray-500 uppercase font-mono tracking-widest mb-1">Max Height</div>
                    <div className="text-xl font-mono text-accentCyan flex justify-end items-center gap-2">
                        {maxHeight}
                        <span className="text-sm text-gray-500 mt-1">BLK</span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
