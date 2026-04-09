import React from 'react';
import GlassCard from '../shared/GlassCard';
import PeerCard from './PeerCard';
import { useGodModePolling } from '../../hooks/useGodModePolling';

const NetworkStatusPanel = () => {
    const { networkData } = useGodModePolling();
    const peers = networkData?.peers || [];
    const networkHeight = networkData?.networkHeight || 0;

    return (
        <GlassCard title="Network Status" hoverEffect>
            {peers.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-gray-500 font-mono animate-pulse text-sm uppercase tracking-widest">
                    Scanning Fabric Topology...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {peers.map(peer => (
                        <PeerCard
                            key={peer.name}
                            name={peer.name}
                            status={peer.status}
                            height={peer.height}
                            networkHeight={networkHeight}
                        />
                    ))}
                </div>
            )}
        </GlassCard>
    );
};

export default NetworkStatusPanel;
