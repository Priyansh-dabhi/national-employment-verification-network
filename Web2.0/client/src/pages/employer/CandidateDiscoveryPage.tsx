import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { hiringService } from '../../services/hiringService';
import { Search, UserPlus, MapPin, Briefcase, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { HireModal } from '../../components/employer/HireModal';

interface Candidate {
  id: number;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  account_status: string;
  employment_status: string | null;
  already_at_company: boolean;
  currently_employed: boolean;
}

export const CandidateDiscoveryPage = () => {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Hiring Modal State
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await employerService.getProfile();
        if (data.profile?.account_status !== 'VERIFIED') {
          navigate('/employer/dashboard');
          return;
        }

        const candidateData = await employerService.getAvailableEmployees();
        setCandidates((candidateData.employees || []) as unknown as Candidate[]);
      } catch (error) {
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleHireSubmit = async (data: { position: string; salary: string; compensation: string }) => {
    if (!selectedCandidate) return;
    try {
      const result = await hiringService.proposeHire(selectedCandidate.id, data.position, data.salary, data.compensation);
      // Mark the candidate as already_at_company so they can't be hired again
      setCandidates((prev) => prev.map(c => c.id === selectedCandidate.id ? { ...c, already_at_company: true } : c));
      
      let msg = `Employment proposed successfully for ${selectedCandidate.full_name}!`;
      if (result.warning) msg += `\n\n⚠️ ${result.warning}`;
      if (result.mockLedger) msg += `\n\n📦 Block #${result.mockLedger.blockNumber} | TX: ${result.mockLedger.txId.slice(0, 16)}...`;
      alert(msg);
    } catch (error: any) {
      const errMsg = error?.message || 'Failed to propose employment.';
      alert(errMsg);
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Discover Candidates</h1>
        <p className="muted" style={{ marginBottom: '1.4rem' }}>
          Find and directly hire available verified employees on the NEVN platform.
        </p>

        <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search candidates by name or email..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field-control"
            style={{ paddingLeft: '2.8rem' }}
          />
        </div>

        {filteredCandidates.length === 0 ? (
          <div className="surface" style={{ padding: '2.8rem', textAlign: 'center' }}>
            <Briefcase size={38} color="var(--color-text-muted)" style={{ margin: '0 auto 0.7rem', opacity: 0.35 }} />
            <p className="muted">{search ? `No candidates matching "${search}"` : 'No available candidates found.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filteredCandidates.map((candidate) => (
              <div key={candidate.id} className="surface" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '999px',
                      background: candidate.already_at_company ? 'rgba(245,158,11,0.15)' : candidate.currently_employed ? 'rgba(239,68,68,0.12)' : 'rgba(56, 189, 248, 0.15)',
                      display: 'grid',
                      placeItems: 'center',
                      color: candidate.already_at_company ? '#f59e0b' : candidate.currently_employed ? '#ef4444' : 'var(--color-highlight)',
                      fontWeight: 800,
                      fontSize: '1.1rem'
                    }}
                  >
                    {candidate.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {candidate.full_name}
                    </p>
                    <p className="muted" style={{ fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {candidate.email}
                    </p>
                  </div>
                </div>

                <div className="stack" style={{ gap: '0.5rem', flex: 1 }}>
                  {candidate.city || candidate.state ? (
                    <p className="muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                      <MapPin size={14} /> {[candidate.city, candidate.state].filter(Boolean).join(', ')}
                    </p>
                  ) : null}

                  {candidate.already_at_company ? (
                    <span className="chip" style={{ width: 'fit-content', background: 'rgba(245,158,11,0.16)', color: '#f59e0b', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <AlertTriangle size={12} /> Already at your company
                    </span>
                  ) : candidate.currently_employed ? (
                    <span className="chip" style={{ width: 'fit-content', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Briefcase size={12} /> Employed elsewhere
                    </span>
                  ) : (
                    <span className="chip" style={{ width: 'fit-content', background: 'rgba(34,197,94,0.16)', color: 'var(--color-success)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle size={12} /> Available to Hire
                    </span>
                  )}
                </div>

                <Button
                  variant={candidate.already_at_company ? 'outline' : 'primary'}
                  onClick={() => {
                    if (candidate.already_at_company) {
                      alert('⚠️ This employee already has an active/pending record at your company.');
                      return;
                    }
                    setSelectedCandidate(candidate);
                    setIsModalOpen(true);
                  }}
                  style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.4rem' }}
                  disabled={candidate.already_at_company}
                >
                  <UserPlus size={16} /> {candidate.already_at_company ? 'Already Hired' : 'Direct Hire'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <HireModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCandidate(null);
        }}
        applicantName={selectedCandidate?.full_name || ''}
        onSubmit={handleHireSubmit}
      />
    </EmployerLayout>
  );
};
