import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, RefreshCw, ChevronDown, ChevronRight, ChevronLeft, Search, Shield } from 'lucide-react';
import api, { endpoints } from '../../services/api';
import { useDashboard } from '../../store/DashboardContext';

const LedgerRecordRow = ({ record, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
        >
            <div
                className="flex items-center gap-3 px-4 py-3 border-b border-borderGlow/20 hover:bg-surfaceHighlight/30 cursor-pointer transition-colors group"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Expand Icon */}
                <div className="text-gray-500 group-hover:text-accentCyan transition-colors">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>

                {/* Record ID */}
                <div className="min-w-20">
                    <span className="font-mono text-xs text-accentCyan">{record.recordId}</span>
                </div>

                {/* Employee ID */}
                <div className="min-w-20">
                    <span className="font-mono text-xs text-white">{record.employeeId}</span>
                </div>

                {/* Position */}
                <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-300 truncate block">{record.position}</span>
                </div>

                {/* Employer */}
                <div className="hidden md:block min-w-25">
                    <span className="font-mono text-xs text-gray-400">{record.employerId}</span>
                </div>

                {/* Status Badge */}
                <div className="min-w-20 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono border ${record.status === 'ACTIVE'
                        ? 'bg-statusGreen/10 border-statusGreen/30 text-statusGreen'
                        : 'bg-statusRed/10 border-statusRed/30 text-statusRed'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${record.status === 'ACTIVE' ? 'bg-statusGreen animate-pulse' : 'bg-statusRed'
                            }`} />
                        {record.status}
                    </span>
                </div>
            </div>

            {/* Expanded JSON Detail */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 py-3 bg-black/30 border-b border-borderGlow/20">
                            <pre className="text-[11px] font-mono text-accentCyan/70 leading-relaxed whitespace-pre-wrap">
                                {JSON.stringify(record, null, 2)}
                            </pre>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

const LedgerRecordsPanel = () => {
    const { addLog, registryRefreshTrigger } = useDashboard();
    const [records, setRecords] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get(endpoints.employment);
            if (response && response.success) {
                setRecords(response.data || []);
                setCurrentPage(1);
                addLog(`Ledger scan complete: ${(response.data || []).length} records found`, 'info');
            }
        } catch (err) {
            addLog(`Ledger scan failed: ${err.message}`, 'error');
            setRecords([]);
        } finally {
            setIsLoading(false);
        }
    }, [addLog]);

    // Fetch on mount AND whenever a new packet is committed
    useEffect(() => {
        fetchRecords();
    }, [fetchRecords, registryRefreshTrigger]);

    // Filter records by search
    const filteredRecords = records.filter(r => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (r.recordId || '').toLowerCase().includes(q) ||
            (r.employeeId || '').toLowerCase().includes(q) ||
            (r.employerId || '').toLowerCase().includes(q) ||
            (r.position || '').toLowerCase().includes(q)
        );
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage) || 1;
    const paginatedRecords = filteredRecords.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="glass-panel rounded-xl flex flex-col border-borderGlow/30 overflow-hidden shadow-glow-cyan/10">
            {/* Header */}
            <div className="px-4 py-3 border-b border-borderGlow/50 bg-surfaceHighlight/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accentCyan" />
                    <h2 className="text-xs font-mono font-bold tracking-widest text-white uppercase">
                        Blockchain Employment Registry
                    </h2>
                    <span className="text-[10px] font-mono text-gray-500 ml-2">
                        {records.length} RECORD{records.length !== 1 ? 'S' : ''}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative hidden sm:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="bg-surface/50 border border-borderGlow rounded-md pl-8 pr-3 py-1.5 text-[11px] font-mono text-gray-200 focus:outline-none focus:border-accentCyan/50 transition-all w-48"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={fetchRecords}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-borderGlow rounded-md hover:border-accentCyan/50 hover:text-accentCyan transition-all text-[10px] font-mono text-gray-400 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-accentCyan' : ''}`} />
                        SCAN
                    </button>
                </div>
            </div>

            {/* Column Headers */}
            <div className="flex items-center gap-3 px-4 py-2 bg-surface/60 border-b border-borderGlow/30 text-[9px] font-mono uppercase tracking-widest text-gray-500">
                <div className="w-4" /> {/* Spacer for chevron */}
                <div className="min-w-20">Record</div>
                <div className="min-w-20">Employee</div>
                <div className="flex-1">Position</div>
                <div className="hidden md:block min-w-25">Employer</div>
                <div className="min-w-20 text-right">Status</div>
            </div>

            {/* Records List */}
            <div className="max-h-75 flex-1 overflow-y-auto bg-black/20">
                {isLoading && records.length === 0 ? (
                    <div className="p-8 text-center">
                        <RefreshCw className="w-6 h-6 text-accentCyan animate-spin mx-auto mb-2" />
                        <span className="font-mono text-xs text-gray-500">Scanning blockchain state...</span>
                    </div>
                ) : paginatedRecords.length === 0 ? (
                    <div className="p-8 text-center">
                        <Database className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                        <span className="font-mono text-xs text-gray-500">
                            {search ? 'No matching records found.' : 'No employment records on ledger.'}
                        </span>
                    </div>
                ) : (
                    paginatedRecords.map((record, i) => (
                        <LedgerRecordRow key={record.recordId || i} record={record} index={i} />
                    ))
                )}
            </div>

            {/* Pagination Footer */}
            {filteredRecords.length > 0 && (
                <div className="px-4 py-3 bg-surfaceHighlight/20 border-t border-borderGlow/50 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-gray-400">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1 rounded bg-surface border border-borderGlow hover:border-accentCyan/50 hover:text-accentCyan disabled:opacity-30 disabled:hover:border-borderGlow disabled:hover:text-gray-400 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] font-mono text-accentCyan">
                            PAGE {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1 rounded bg-surface border border-borderGlow hover:border-accentCyan/50 hover:text-accentCyan disabled:opacity-30 disabled:hover:border-borderGlow disabled:hover:text-gray-400 transition-colors"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LedgerRecordsPanel;
