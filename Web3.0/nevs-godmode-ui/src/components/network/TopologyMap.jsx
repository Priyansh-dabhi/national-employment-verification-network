import React from 'react';
import { useNetworkSync, usePeerControl } from '../../hooks/useNetworkSync';
import { useDashboard } from '../../store/DashboardContext';
import LedgerCloud from './LedgerCloud';
import ConnectionBeam from './ConnectionBeam';
import PeerNodeCard from './PeerNodeCard';

const TopologyMap = () => {
    // Start the polling loop
    useNetworkSync();

    const { peers, networkHeight } = useDashboard();
    const { stopPeer, startPeer } = usePeerControl();
    const [togglingPeers, setTogglingPeers] = React.useState(new Map());

    const handleToggle = async (peerName, currentStatus) => {
        // Track the target status we are aiming for
        const targetState = currentStatus === 'OFFLINE' ? 'ONLINE' : 'OFFLINE';
        setTogglingPeers(prev => new Map(prev).set(peerName, targetState));

        try {
            if (currentStatus === 'OFFLINE') {
                await startPeer(peerName);
            } else {
                await stopPeer(peerName);
            }
        } catch (err) {
            // Only clear on error. On success, we wait for the polling loop to confirm.
            setTogglingPeers(prev => {
                const next = new Map(prev);
                next.delete(peerName);
                return next;
            });
        }
    };

    // Watch for actual status changes coming from the polling loop (useNetworkSync -> context -> peers)
    React.useEffect(() => {
        if (togglingPeers.size === 0) return;

        setTogglingPeers(prev => {
            let changed = false;
            const next = new Map(prev);

            // For every peer we are currently toggling...
            for (const [togglingPeerName, targetState] of prev.entries()) {
                const peerData = peers.find(p => p.name === togglingPeerName);
                if (peerData) {
                    const isNowOnline = peerData.status === 'SYNCED' || peerData.status === 'CATCHING_UP';
                    const isNowOffline = peerData.status === 'OFFLINE';

                    if ((targetState === 'ONLINE' && isNowOnline) || (targetState === 'OFFLINE' && isNowOffline)) {
                        // The peer has reached the target state physically. We can stop spinning.
                        next.delete(togglingPeerName);
                        changed = true;
                    }
                }
            }

            return changed ? next : prev;
        });
    }, [peers]);

    return (
        <div className="flex flex-col items-center justify-center w-full py-10 relative">
            {/* Network Height Badge */}
            <div className="absolute top-2 right-4 flex items-center gap-2 font-mono text-xs text-gray-400">
                <span className="uppercase tracking-widest">Network Height</span>
                <span className="text-white text-sm font-bold drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">{networkHeight}</span>
            </div>

            {/* 1. Cloud Core */}
            <div className="z-10 mb-[-20px]">
                <LedgerCloud />
            </div>

            {/* 2. Connection Beams Area */}
            <div className="flex justify-center gap-[100px] w-full max-w-[600px] z-0">
                {peers.map((peer, i) => (
                    <ConnectionBeam
                        key={peer.name}
                        isActive={peer.status !== 'OFFLINE'}
                        isCatchingUp={peer.status === 'CATCHING_UP'}
                        direction={i === 0 ? 'left' : 'right'}
                    />
                ))}
            </div>

            {/* 3. Peer Nodes Area */}
            <div className="flex flex-wrap justify-center gap-12 mt-[-20px] z-10 w-full">
                {peers.map(peer => (
                    <PeerNodeCard
                        key={peer.name}
                        name={peer.name}
                        status={peer.status}
                        height={peer.height ?? 0}
                        isToggling={togglingPeers.has(peer.name)}
                        onToggle={() => handleToggle(peer.name, peer.status)}
                    />
                ))}
            </div>
        </div>
    );
};

export default TopologyMap;
