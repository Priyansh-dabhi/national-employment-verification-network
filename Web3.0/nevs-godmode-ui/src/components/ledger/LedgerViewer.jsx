import React, { useState } from 'react';
import GlassCard from '../shared/GlassCard';
import { Search, RefreshCw, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { useGodModePolling } from '../../hooks/useGodModePolling';

const LedgerRow = ({ record }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            <tr
                className="border-b border-borderGlow/30 hover:bg-surfaceHighlight/30 cursor-pointer transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <td className="p-4">
                    <div className="flex items-center text-accentCyan">
                        {isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                        <span className="font-mono text-sm">{record.recordId}</span>
                    </div>
                </td>
                <td className="p-4 font-mono text-sm">{record.employeeId}</td>
                <td className="p-4 font-sans text-sm text-gray-300">{record.position}</td>
                <td className="p-4 hidden md:table-cell font-mono text-sm">{record.employerId}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-mono border ${record.status === 'ACTIVE'
                        ? 'bg-statusGreen/10 border-statusGreen/30 text-statusGreen'
                        : 'bg-gray-800 border-gray-600 text-gray-400'
                        }`}>
                        {record.status}
                    </span>
                </td>
            </tr>

            {/* Expanded JSON view */}
            {isExpanded && (
                <tr>
                    <td colSpan="5" className="p-0 bg-surfaceHighlight/10">
                        <div className="p-4 pl-10 border-b border-borderGlow/30 overflow-x-auto">
                            <pre className="text-xs font-mono text-accentCyan/80 leading-relaxed">
                                {JSON.stringify(record, null, 2)}
                            </pre>
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const LedgerViewer = () => {
    const { ledgerRecords, isLedgerLoading, refreshLedger } = useGodModePolling();
    const [search, setSearch] = useState('');

    // Client-side search filtering
    const filteredRecords = ledgerRecords.filter(r =>
        (r.recordId || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.employeeId || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <GlassCard title="Employment Ledger Explorer" hoverEffect noPadding>
            <div className="p-4 border-b border-borderGlow/50 flex flex-col sm:flex-row gap-4 justify-between items-center bg-surfaceHighlight/20">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Search Record/Employee ID..."
                        className="w-full bg-surface/50 border border-borderGlow rounded-lg pl-9 pr-4 py-2 text-sm font-mono text-gray-200 focus:outline-none focus:border-accentCyan/50 focus:shadow-glow-cyan transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <button
                    onClick={refreshLedger}
                    disabled={isLedgerLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-borderGlow rounded-lg hover:border-accentCyan/50 hover:text-accentCyan transition-all text-sm font-mono text-gray-400 disabled:opacity-50"
                >
                    {isLedgerLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-accentCyan" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    SYNC LEDGER
                </button>
            </div>

            <div className="overflow-x-auto max-h-[400px]">
                {filteredRecords.length === 0 ? (
                    <div className="p-8 text-center font-mono text-sm text-gray-500">
                        {isLedgerLoading ? 'Downloading Blockchain State...' : 'No ledger records found.'}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-surface/90 backdrop-blur z-10">
                            <tr className="border-b border-borderGlow text-xs uppercase tracking-wider text-gray-400 font-mono">
                                <th className="p-4 font-medium">Record ID</th>
                                <th className="p-4 font-medium">Employee</th>
                                <th className="p-4 font-medium">Position</th>
                                <th className="p-4 hidden md:table-cell font-medium">Employer</th>
                                <th className="p-4 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRecords.map((record, idx) => (
                                <LedgerRow key={record.recordId || idx} record={record} />
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </GlassCard>
    );
};

export default LedgerViewer;
