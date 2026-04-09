import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Send, CheckCircle, RefreshCw } from 'lucide-react';

const PendingPacketCard = ({ data, onCommit, isCommitting, isDisabled }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }} // Moves up to cloud when committed
            className="glass-panel rounded-lg p-3 w-64 border-accentCyan/30 relative overflow-hidden flex flex-col gap-2"
        >
            {/* Background scanline effect */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjEiIGZpbGw9IiMwMGYwZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-50 z-0 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center z-10 border-b border-borderGlow/50 pb-1.5">
                <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-accentCyan" />
                    <span className="text-[10px] font-mono font-bold text-accentCyan">DATA PACKET</span>
                </div>
                <span className="text-[9px] font-mono text-gray-500">{data.recordID}</span>
            </div>

            {/* Body Data */}
            <div className="flex flex-col gap-1 z-10 text-[11px] font-mono">
                <div className="flex justify-between">
                    <span className="text-gray-500">EMP:</span>
                    <span className="text-gray-200">{data.employeeID}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">ORG:</span>
                    <span className="text-gray-200">{data.employerID}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">ROLE:</span>
                    <span className="text-gray-200 truncate max-w-[100px] text-right" title={data.position}>
                        {data.position}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">STATUS:</span>
                    <span className="text-statusGreen">{data.status}</span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={() => onCommit(data.localId)}
                disabled={isCommitting || isDisabled}
                className="mt-1 flex items-center justify-center gap-2 w-full py-1.5 rounded-md bg-accentCyan/10 hover:bg-accentCyan/20 text-accentCyan border border-accentCyan/50 transition-all font-mono text-[10px] z-10 font-semibold disabled:opacity-50"
            >
                {isCommitting ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                        <RefreshCw className="w-3 h-3" />
                    </motion.div>
                ) : isDisabled ? (
                    <span>WAITING FOR SYNC...</span>
                ) : (
                    <><Send className="w-3 h-3" /> COMMIT TO LEDGER</>
                )}
            </button>

            {/* Commit Overlay */}
            {isCommitting && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <CheckCircle className="w-6 h-6 text-statusGreen mb-1 animate-pulse" />
                        <span className="text-[9px] font-mono text-statusGreen">COMMITTING...</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default PendingPacketCard;
