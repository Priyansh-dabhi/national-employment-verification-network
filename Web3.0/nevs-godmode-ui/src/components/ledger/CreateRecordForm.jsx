import React, { useState } from 'react';
import GlassCard from '../shared/GlassCard';
import { Plus, Database, Check } from 'lucide-react';
import api, { endpoints } from '../../services/api';
import { useGodModePolling } from '../../hooks/useGodModePolling';
import { useDashboard } from '../../store/DashboardContext';

const CreateRecordForm = () => {
    const { refreshLedger } = useGodModePolling();
    const { isFabricReady } = useDashboard();
    const [formData, setFormData] = useState({
        recordID: '',
        employeeID: '',
        employerID: '',
        position: '',
        status: 'ACTIVE',
        startDate: new Date().toISOString()
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successTx, setSuccessTx] = useState(null);
    const [errorText, setErrorText] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSuccessTx(null);
        setErrorText(null);

        try {
            const response = await api.post(endpoints.employment, formData);

            if (response.success) {
                setSuccessTx({
                    id: response.txId || 'Transaction Committed',
                    peer: response.peerUsed || 'Automatic'
                });
                setFormData({ ...formData, recordID: '', employeeID: '', employerID: '', position: '' });

                // Auto refresh ledger safely after 1.5s to let blocks settle if needed
                setTimeout(() => refreshLedger(), 1500);

                // Clear success message after 5s
                setTimeout(() => setSuccessTx(null), 5000);
            }
        } catch (err) {
            console.error('Failed to inject ledger record:', err);
            setErrorText(err.message || 'Transaction rejected by network');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputClass = "w-full bg-surfaceHighlight/30 border border-borderGlow rounded-lg px-4 py-2.5 text-sm font-mono text-gray-200 focus:outline-none focus:border-accentPurple/50 focus:shadow-[0_0_15px_rgba(176,0,255,0.2)] transition-all placeholder:text-gray-600";
    const labelClass = "block text-xs uppercase tracking-widest text-gray-400 mb-1.5 font-mono";

    return (
        <GlassCard title="Inject Ledger Record" hoverEffect>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Record ID</label>
                        <input required name="recordID" value={formData.recordID} onChange={handleChange} placeholder="e.g. REC-001" className={inputClass} disabled={!isFabricReady} />
                    </div>
                    <div>
                        <label className={labelClass}>Employee ID</label>
                        <input required name="employeeID" value={formData.employeeID} onChange={handleChange} placeholder="e.g. USER123" className={inputClass} disabled={!isFabricReady} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Employer ID</label>
                        <input required name="employerID" value={formData.employerID} onChange={handleChange} placeholder="e.g. CORP-99" className={inputClass} disabled={!isFabricReady} />
                    </div>
                    <div>
                        <label className={labelClass}>Role / Position</label>
                        <input required name="position" value={formData.position} onChange={handleChange} placeholder="e.g. Data Scientist" className={inputClass} disabled={!isFabricReady} />
                    </div>
                </div>

                {errorText && (
                    <div className="text-xs text-statusRed font-mono mt-2 flex items-center gap-2">
                        <span>⚠</span> {errorText}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting || !isFabricReady}
                    className="w-full mt-6 relative overflow-hidden group bg-accentPurple/10 border border-accentPurple/30 text-accentPurple hover:bg-accentPurple/20 hover:border-accentPurple/60 hover:shadow-[0_0_20px_rgba(176,0,255,0.4)] transition-all duration-300 rounded-lg px-4 py-3 font-mono tracking-widest uppercase text-sm flex items-center justify-center disabled:opacity-50"
                >
                    {!isFabricReady ? (
                        <span className="flex items-center gap-2"><Database className="w-4 h-4 animate-pulse opacity-50" /> NETWORK SYNCING...</span>
                    ) : isSubmitting ? (
                        <span className="flex items-center gap-2"><Database className="w-4 h-4 animate-bounce" /> INJECTING...</span>
                    ) : successTx ? (
                        <span className="flex items-center gap-2 text-statusGreen"><Check className="w-4 h-4" /> SUCCESS</span>
                    ) : (
                        <span className="flex items-center gap-2"><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> SUBMIT TO FABRIC</span>
                    )}
                </button>

                {successTx && (
                    <div className="mt-3 text-center border border-statusGreen/20 bg-statusGreen/5 rounded p-2">
                        <p className="text-xs font-mono text-statusGreen opacity-80">
                            Endorsed by: <span className="font-bold">{successTx.peer}</span>
                        </p>
                        {successTx.id !== 'Transaction Committed' && (
                            <p className="text-xs font-mono text-gray-300 break-all mt-1">{successTx.id}</p>
                        )}
                    </div>
                )}
            </form>
        </GlassCard>
    );
};

export default CreateRecordForm;
