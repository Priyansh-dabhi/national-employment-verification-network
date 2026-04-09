import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { hiringService, type EmploymentRecord } from '../../services/hiringService';
import { employerService } from '../../services/employerService';
import { Users, Lock, ShieldCheck, Clock, XCircle, CheckCircle, AlertTriangle, Building2, Briefcase,  UserMinus } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  PROPOSED: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: Clock, label: 'Proposed' },
  CONSENTED: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: ShieldCheck, label: 'Consented' },
  CONFIRMED: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', icon: CheckCircle, label: 'Active' },
  TERMINATED: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', icon: XCircle, label: 'Terminated' },
};

const TIER_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  TIER_1: { label: 'Tier 1 — Small Enterprise', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
  TIER_2: { label: 'Tier 2 — Medium Enterprise', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)' },
  TIER_3: { label: 'Tier 3 — Large Enterprise', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
};

export const MyEmployeesPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<EmploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyTier, setCompanyTier] = useState('TIER_1');
  const [filter, setFilter] = useState<string>('ALL');
  const [terminating, setTerminating] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profileData = await employerService.getProfile();
        const profile = profileData.profile as any;
        if (profile?.account_status !== 'VERIFIED') {
          navigate('/employer/dashboard');
          return;
        }
        setCompanyTier(profile?.tier || 'TIER_1');

        const data = await hiringService.getCompanyHires();
        setRecords(data.records || []);
      } catch (err) {
        const error = err as Error;
        if (error.message?.includes('401') || error.message?.includes('403')) navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleTerminate = async (recordId: string) => {
    if (!confirm('Are you sure you want to terminate this employment?')) return;
    setTerminating(recordId);
    try {
      await hiringService.terminateEmployee(recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, status: 'TERMINATED', terminated_at: new Date().toISOString() } : r));
    } catch (err) {
      alert('Failed to terminate employment.');
    } finally {
      setTerminating(null);
    }
  };

  const filtered = records.filter(r => filter === 'ALL' || r.status === filter);
  const tierInfo = TIER_CONFIG[companyTier] || TIER_CONFIG.TIER_1;

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading employees...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header with Tier Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>My Employees</h1>
            <p className="muted">View and manage all employment records.</p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: '12px',
            background: tierInfo.bg,
            border: `1px solid ${tierInfo.color}33`,
            color: tierInfo.color, fontWeight: 600, fontSize: '0.85rem'
          }}>
            <Building2 size={16} />
            {tierInfo.label}
          </div>
        </div>

        {/* Stats Bar */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem'
        }}>
          {(['PROPOSED', 'CONSENTED', 'CONFIRMED', 'TERMINATED'] as const).map(s => {
            const config = STATUS_CONFIG[s];
            const count = records.filter(r => r.status === s).length;
            return (
              <button
                key={s}
                onClick={() => setFilter(f => f === s ? 'ALL' : s)}
                style={{
                  padding: '0.85rem 1rem', borderRadius: '12px',
                  background: filter === s ? config.bg : 'var(--color-surface)',
                  border: filter === s ? `1.5px solid ${config.color}55` : '1px solid var(--color-border)',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                }}
              >
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: config.color }}>{count}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>{config.label}</p>
              </button>
            );
          })}
        </div>

        {/* Employee Cards */}
        {filtered.length === 0 ? (
          <div className="surface" style={{ padding: '3rem', textAlign: 'center' }}>
            <Users size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 0.7rem', opacity: 0.3 }} />
            <p className="muted">{filter === 'ALL' ? 'No employment records yet.' : `No ${filter.toLowerCase()} records.`}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
            {filtered.map(record => {
              const config = STATUS_CONFIG[record.status] || STATUS_CONFIG.PROPOSED;
              const StatusIcon = config.icon;

              return (
                <div
                  key={record.id}
                  style={{
                    borderRadius: '14px',
                    background: 'var(--color-surface)',
                    border: `1px solid ${record.status === 'TERMINATED' ? 'rgba(239,68,68,0.2)' : config.color + '33'}`,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Card Header */}
                  <div style={{
                    padding: '1.1rem 1.25rem',
                    borderBottom: '1px solid var(--color-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                      <div style={{
                        width: '42px', height: '42px', borderRadius: '999px',
                        background: config.bg, display: 'grid', placeItems: 'center',
                        color: config.color, fontWeight: 800, fontSize: '1rem'
                      }}>
                        {record.full_name?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '1rem' }}>{record.full_name}</p>
                        <p className="muted" style={{ fontSize: '0.8rem' }}>{record.email}</p>
                      </div>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      padding: '0.3rem 0.7rem', borderRadius: '8px',
                      background: config.bg, color: config.color,
                      fontSize: '0.75rem', fontWeight: 700
                    }}>
                      <StatusIcon size={13} /> {config.label}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                      <div>
                        <p className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Position</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Briefcase size={13} /> {record.position}
                        </p>
                      </div>
                      <div>
                        <p className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Department</p>
                        <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{record.department || 'General'}</p>
                      </div>
                      <div>
                        <p className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proposed</p>
                        <p style={{ fontSize: '0.85rem' }}>{new Date(record.proposed_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Location</p>
                        <p style={{ fontSize: '0.85rem' }}>{[record.city, record.state].filter(Boolean).join(', ') || '-'}</p>
                      </div>
                    </div>

                    {/* PDC Section — Private Data Collection */}
                    <div style={{
                      borderRadius: '10px',
                      padding: '0.85rem',
                      background: 'linear-gradient(135deg, rgba(167,139,250,0.06) 0%, rgba(56,189,248,0.06) 100%)',
                      border: '1px dashed rgba(167,139,250,0.3)',
                      marginBottom: '0.75rem'
                    }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem',
                        color: '#a78bfa', fontSize: '0.72rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em'
                      }}>
                        <Lock size={12} />
                        Private Data Collection (PDC)
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <div>
                          <p className="muted" style={{ fontSize: '0.7rem' }}>Salary</p>
                          <p style={{
                            fontWeight: 700, fontSize: '0.95rem', color: '#a78bfa',
                            fontFamily: 'monospace'
                          }}>
                            {record.salary || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="muted" style={{ fontSize: '0.7rem' }}>Compensation</p>
                          <p style={{
                            fontSize: '0.85rem', color: '#a78bfa',
                            fontFamily: 'monospace'
                          }}>
                            {record.compensation || '—'}
                          </p>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                        🔒 Only visible to authorized organizations (CentralGovtMSP, CompanyOrgMSP)
                      </p>
                    </div>

                    {/* Verification Hash */}
                    <div style={{
                      padding: '0.5rem 0.7rem', borderRadius: '8px',
                      background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                      fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--color-text-muted)',
                      overflowX: 'auto', whiteSpace: 'nowrap'
                    }}>
                      <span style={{ color: '#22c55e', fontWeight: 600 }}>SHA256:</span>{' '}
                      {record.verification_hash ? record.verification_hash.slice(0, 16) + '...' + record.verification_hash.slice(-8) : '-'}
                    </div>

                    {/* Action Button */}
                    {record.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleTerminate(record.id)}
                        disabled={terminating === record.id}
                        style={{
                          width: '100%', marginTop: '0.85rem',
                          padding: '0.6rem', borderRadius: '8px',
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                          color: '#ef4444', fontWeight: 600, fontSize: '0.85rem',
                          cursor: 'pointer', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s'
                        }}
                      >
                        <UserMinus size={15} />
                        {terminating === record.id ? 'Terminating...' : 'Terminate Employment'}
                      </button>
                    )}

                    {record.status === 'PROPOSED' && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.5rem',
                        borderRadius: '8px', background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        fontSize: '0.78rem', color: '#f59e0b', textAlign: 'center'
                      }}>
                        <AlertTriangle size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Awaiting employee consent
                      </div>
                    )}

                    {record.status === 'CONSENTED' && (
                      <div style={{
                        marginTop: '0.75rem', padding: '0.5rem',
                        borderRadius: '8px', background: 'rgba(56,189,248,0.08)',
                        border: '1px solid rgba(56,189,248,0.2)',
                        fontSize: '0.78rem', color: '#38bdf8', textAlign: 'center'
                      }}>
                        <ShieldCheck size={13} style={{ marginRight: '0.3rem', verticalAlign: 'middle' }} />
                        Awaiting government confirmation
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};
