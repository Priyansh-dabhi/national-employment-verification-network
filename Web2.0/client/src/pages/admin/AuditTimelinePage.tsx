import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useNavigate } from 'react-router-dom';
import {
  Blocks, Hash, ShieldCheck, Clock, Filter, ChevronDown, ChevronUp,
  CheckCircle, UserCheck, FileSignature, XCircle, Activity, Layers, Users2, Building2, BarChart3
} from 'lucide-react';
import './Admin.css';

const FUNCTION_ICONS: Record<string, any> = {
  ProposeEmployment: FileSignature,
  EmployeeConsent: UserCheck,
  ConfirmEmployment: CheckCircle,
  TerminateEmployment: XCircle,
};

const FUNCTION_COLORS: Record<string, string> = {
  ProposeEmployment: '#f59e0b',
  EmployeeConsent: '#38bdf8',
  ConfirmEmployment: '#22c55e',
  TerminateEmployment: '#ef4444',
};

export const AuditTimelinePage = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [employmentRecords, setEmploymentRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFn, setFilterFn] = useState<string>('');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'records'>('timeline');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [timelineData, statsData, recordsData] = await Promise.all([
        adminService.getAuditTimeline(50, 0, filterFn || undefined),
        adminService.getEmploymentStats(),
        adminService.getAllEmploymentRecords(),
      ]);
      setTransactions(timelineData.transactions || []);
      setStats(statsData);
      setEmploymentRecords(recordsData.records || []);
    } catch (err: any) {
      if (err.message?.includes('Failed')) {
        adminService.logout();
        navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterFn]);

  const handleConfirmHire = async (recordId: string) => {
    setConfirmingId(recordId);
    try {
      await adminService.confirmHire(recordId);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to confirm');
    } finally {
      setConfirmingId(null);
    }
  };

  const truncateHash = (hash: string) => hash ? `${hash.slice(0, 10)}...${hash.slice(-6)}` : '-';

  if (loading) {
    return (
      <div className="admin-dash-bg">
        <main className="admin-main">
          <div style={{ textAlign: 'center', paddingTop: '5rem', color: '#64748b' }}>
            <Activity size={32} style={{ margin: '0 auto 0.7rem', animation: 'spin 1s linear infinite' }} />
            <p>Loading blockchain simulation data...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-dash-bg">
      <main className="admin-main">
        {/* Hero */}
        <section className="admin-hero" style={{ borderLeft: '3px solid #a78bfa' }}>
          <div className="admin-hero__icon" style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa' }}>
            <Blocks size={20} />
          </div>
          <div>
            <h1 className="admin-hero__title">Mock Blockchain Ledger</h1>
            <p className="admin-hero__subtitle">
              Simulated Hyperledger Fabric audit trail — every employment lifecycle event recorded as a mock block.
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        {stats && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem', marginBottom: '1.5rem'
          }}>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #f59e0b' }}>
              <p className="admin-metric-label"><FileSignature size={14} style={{ marginRight: 4 }} /> Proposed</p>
              <p className="admin-metric-value">{stats.employment?.proposed || 0}</p>
            </div>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #38bdf8' }}>
              <p className="admin-metric-label"><UserCheck size={14} style={{ marginRight: 4 }} /> Consented</p>
              <p className="admin-metric-value">{stats.employment?.consented || 0}</p>
            </div>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #22c55e' }}>
              <p className="admin-metric-label"><CheckCircle size={14} style={{ marginRight: 4 }} /> Confirmed</p>
              <p className="admin-metric-value">{stats.employment?.confirmed || 0}</p>
            </div>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #ef4444' }}>
              <p className="admin-metric-label"><XCircle size={14} style={{ marginRight: 4 }} /> Terminated</p>
              <p className="admin-metric-value">{stats.employment?.terminated || 0}</p>
            </div>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #a78bfa' }}>
              <p className="admin-metric-label"><Layers size={14} style={{ marginRight: 4 }} /> Total Blocks</p>
              <p className="admin-metric-value">{stats.ledger?.total_blocks || 0}</p>
            </div>
            <div className="admin-metric-card" style={{ borderTop: '2px solid #6366f1' }}>
              <p className="admin-metric-label"><Activity size={14} style={{ marginRight: 4 }} /> Transactions</p>
              <p className="admin-metric-value">{stats.ledger?.total_transactions || 0}</p>
            </div>
          </div>
        )}

        {/* Company Tier Summary */}
        {stats?.companies && stats.companies.length > 0 && (
          <div style={{
            display: 'flex', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap'
          }}>
            {stats.companies.map((c: any) => {
              const tierConf: Record<string, { icon: any; label: string; color: string }> = {
                TIER_1: { icon: Building2, label: 'Tier 1', color: '#94a3b8' },
                TIER_2: { icon: Building2, label: 'Tier 2', color: '#38bdf8' },
                TIER_3: { icon: Building2, label: 'Tier 3', color: '#a78bfa' },
              };
              const tc = tierConf[c.tier] || tierConf.TIER_1;
              const TierIcon = tc.icon;
              return (
                <span key={c.tier} style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.35rem 0.8rem', borderRadius: '8px',
                  background: `${tc.color}15`, border: `1px solid ${tc.color}33`,
                  color: tc.color, fontSize: '0.78rem', fontWeight: 600
                }}>
                  <TierIcon size={13} /> {tc.label}: {c.count} verified
                </span>
              );
            })}
          </div>
        )}

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <button onClick={() => setActiveTab('timeline')} style={{
            padding: '0.65rem 1.3rem', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === 'timeline' ? '#a78bfa' : '#1e293b',
            color: activeTab === 'timeline' ? '#0f172a' : '#cbd5e1',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <Blocks size={15} /> Blockchain Timeline
          </button>
          <button onClick={() => setActiveTab('records')} style={{
            padding: '0.65rem 1.3rem', borderRadius: '8px', fontWeight: 600, border: 'none', cursor: 'pointer',
            background: activeTab === 'records' ? '#a78bfa' : '#1e293b',
            color: activeTab === 'records' ? '#0f172a' : '#cbd5e1',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <BarChart3 size={15} /> Employment Records ({employmentRecords.length})
          </button>
        </div>

        {activeTab === 'timeline' && (
          <>
            {/* Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <button onClick={() => setFilterFn('')} style={{
                padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                background: !filterFn ? 'rgba(167,139,250,0.15)' : 'transparent',
                color: !filterFn ? '#a78bfa' : '#94a3b8', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
              }}>
                <Filter size={12} style={{ marginRight: 4 }} /> All
              </button>
              {['ProposeEmployment', 'EmployeeConsent', 'ConfirmEmployment', 'TerminateEmployment'].map(fn => (
                <button key={fn} onClick={() => setFilterFn(fn)} style={{
                  padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid var(--color-border)',
                  background: filterFn === fn ? `${FUNCTION_COLORS[fn]}15` : 'transparent',
                  color: filterFn === fn ? FUNCTION_COLORS[fn] : '#94a3b8',
                  fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer'
                }}>
                  {fn}
                </button>
              ))}
            </div>

            {/* Timeline */}
            {transactions.length === 0 ? (
              <div style={{
                padding: '3rem', textAlign: 'center', borderRadius: '12px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)'
              }}>
                <Blocks size={40} color="#64748b" style={{ margin: '0 auto 0.7rem', opacity: 0.3 }} />
                <p style={{ color: '#64748b' }}>No blockchain transactions recorded yet.</p>
              </div>
            ) : (
              <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                {/* Timeline Line */}
                <div style={{
                  position: 'absolute', left: '0.85rem', top: 0, bottom: 0, width: '2px',
                  background: 'linear-gradient(to bottom, #a78bfa, #22c55e, #38bdf8)'
                }} />

                {transactions.map((tx: any, i: number) => {
                  const FnIcon = FUNCTION_ICONS[tx.function_name] || Activity;
                  const fnColor = FUNCTION_COLORS[tx.function_name] || '#94a3b8';
                  const isExpanded = expandedTx === tx.tx_id;

                  return (
                    <div key={tx.tx_id} style={{ position: 'relative', marginBottom: '1rem' }}>
                      {/* Node dot */}
                      <div style={{
                        position: 'absolute', left: '-1.6rem', top: '1.1rem',
                        width: '14px', height: '14px', borderRadius: '999px',
                        background: fnColor, border: '2px solid var(--color-bg)',
                        boxShadow: `0 0 8px ${fnColor}44`
                      }} />

                      <div style={{
                        borderRadius: '12px',
                        background: 'var(--color-surface)',
                        border: `1px solid ${fnColor}22`,
                        overflow: 'hidden',
                        transition: 'all 0.2s'
                      }}>
                        {/* Tx Header */}
                        <button
                          onClick={() => setExpandedTx(isExpanded ? null : tx.tx_id)}
                          style={{
                            width: '100%', padding: '0.85rem 1.1rem',
                            background: 'none', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            color: 'inherit'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                            <div style={{
                              width: '36px', height: '36px', borderRadius: '10px',
                              background: `${fnColor}15`, display: 'grid', placeItems: 'center', color: fnColor
                            }}>
                              <FnIcon size={17} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                              <p style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.15rem' }}>
                                {tx.function_name}
                              </p>
                              <div style={{ display: 'flex', gap: '0.7rem', fontSize: '0.73rem', color: '#94a3b8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Blocks size={11} /> Block #{tx.block_number}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Hash size={11} /> {truncateHash(tx.tx_id)}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  <Clock size={11} /> {new Date(tx.timestamp).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700,
                              background: tx.status === 'VALID' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                              color: tx.status === 'VALID' ? '#22c55e' : '#ef4444'
                            }}>
                              {tx.status}
                            </span>
                            {isExpanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
                          </div>
                        </button>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div style={{
                            padding: '0 1.1rem 1rem', borderTop: '1px solid var(--color-border)'
                          }}>
                            {/* MSP Info */}
                            <div style={{
                              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem',
                              marginTop: '0.85rem', marginBottom: '0.85rem'
                            }}>
                              <div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Caller MSP</p>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#a78bfa' }}>{tx.caller_msp}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Caller Role</p>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tx.caller_role}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Channel</p>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tx.channel_name}</p>
                              </div>
                              <div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Chaincode</p>
                                <p style={{ fontWeight: 600, fontSize: '0.88rem' }}>{tx.chaincode_name}</p>
                              </div>
                            </div>

                            {/* Transaction Args */}
                            <div style={{
                              borderRadius: '8px', padding: '0.7rem',
                              background: 'rgba(15,23,42,0.5)', fontFamily: 'monospace', fontSize: '0.75rem',
                              color: '#94a3b8', overflow: 'auto', maxHeight: '120px', marginBottom: '0.85rem'
                            }}>
                              <p style={{ color: '#22c55e', marginBottom: '0.3rem', fontWeight: 600 }}>// Transaction Arguments</p>
                              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(typeof tx.args === 'string' ? JSON.parse(tx.args) : tx.args, null, 2)}
                              </pre>
                            </div>

                            {/* Endorsements */}
                            <div>
                              <p style={{
                                fontSize: '0.75rem', fontWeight: 700, color: '#a78bfa',
                                marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem'
                              }}>
                                <ShieldCheck size={13} /> Multi-Org Endorsements ({Array.isArray(tx.endorsements) ? tx.endorsements.length : 0})
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                {(Array.isArray(tx.endorsements) ? tx.endorsements : []).map((e: any, idx: number) => (
                                  <div key={idx} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '0.45rem 0.7rem', borderRadius: '8px',
                                    background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)',
                                    fontSize: '0.75rem'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{
                                        width: '8px', height: '8px', borderRadius: '999px',
                                        background: e.msp_id?.includes('Govt') ? '#22c55e' : '#38bdf8'
                                      }} />
                                      <span style={{ fontWeight: 600 }}>{e.peer_name}</span>
                                      <span style={{ color: '#94a3b8' }}>({e.msp_id})</span>
                                    </div>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', color: '#64748b' }}>
                                      sig: {e.signature_hash?.slice(0, 12)}...
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Full TX ID */}
                            <div style={{
                              marginTop: '0.7rem', padding: '0.4rem 0.7rem', borderRadius: '6px',
                              background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.1)',
                              fontFamily: 'monospace', fontSize: '0.68rem', color: '#22c55e',
                              wordBreak: 'break-all'
                            }}>
                              <strong>TX_ID:</strong> {tx.tx_id}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'records' && (
          <div className="admin-table-container">
            <div className="admin-table-header">
              <h2 className="admin-table-title">All Employment Records</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Company</th>
                    <th>Position</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Proposed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employmentRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>
                        No employment records found.
                      </td>
                    </tr>
                  ) : (
                    employmentRecords.map((rec: any) => {
                      const statusColors: Record<string, string> = {
                        PROPOSED: '#f59e0b', CONSENTED: '#38bdf8', CONFIRMED: '#22c55e', TERMINATED: '#ef4444'
                      };
                      const tierLabels: Record<string, string> = {
                        TIER_1: 'T1', TIER_2: 'T2', TIER_3: 'T3'
                      };
                      return (
                        <tr key={rec.id}>
                          <td>
                            <span className="admin-table-cell-name">{rec.employee_name}</span>
                            <br />
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{rec.employee_email}</span>
                          </td>
                          <td>{rec.organization_name}</td>
                          <td>{rec.position}</td>
                          <td>
                            <span style={{
                              padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                              background: rec.tier === 'TIER_3' ? 'rgba(167,139,250,0.15)' : rec.tier === 'TIER_2' ? 'rgba(56,189,248,0.15)' : 'rgba(148,163,184,0.15)',
                              color: rec.tier === 'TIER_3' ? '#a78bfa' : rec.tier === 'TIER_2' ? '#38bdf8' : '#94a3b8'
                            }}>
                              {tierLabels[rec.tier] || rec.tier}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700,
                              background: `${statusColors[rec.status] || '#94a3b8'}15`,
                              color: statusColors[rec.status] || '#94a3b8'
                            }}>
                              {rec.status}
                            </span>
                          </td>
                          <td className="admin-table-cell-date">{new Date(rec.proposed_at).toLocaleDateString()}</td>
                          <td>
                            {rec.status === 'CONSENTED' && (
                              <button
                                onClick={() => handleConfirmHire(rec.id)}
                                disabled={confirmingId === rec.id}
                                className="admin-action-btn"
                                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
                              >
                                {confirmingId === rec.id ? 'Confirming...' : 'Confirm'}
                              </button>
                            )}
                            {rec.status !== 'CONSENTED' && (
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
