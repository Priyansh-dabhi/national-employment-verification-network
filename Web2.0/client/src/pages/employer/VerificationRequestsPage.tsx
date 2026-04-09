import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';

type VerificationRequest = {
  id: number;
  full_name: string;
  email: string;
  position?: string | null;
  employee_status: string;
  employment_status: string;
  joined_at?: string;
};

const statusColor: Record<string, { bg: string; text: string }> = {
  VERIFIED: { bg: 'rgba(34,197,94,0.1)', text: '#22c55e' },
  UNVERIFIED: { bg: 'rgba(148,163,184,0.1)', text: '#94a3b8' },
  PENDING: { bg: 'rgba(234,179,8,0.1)', text: '#eab308' },
  REJECTED: { bg: 'rgba(239,68,68,0.1)', text: '#ef4444' },
  ACTIVE: { bg: 'rgba(99,102,241,0.1)', text: '#6366f1' },
  LEFT: { bg: 'rgba(148,163,184,0.08)', text: '#94a3b8' },
};

export const VerificationRequestsPage = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await employerService.getVerificationRequests();
        setRequests((data.requests || []) as VerificationRequest[]);
      } catch {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading verification requests...</div>
      </EmployerLayout>
    );
  }

  const filtered = requests.filter((request) => {
    const query = search.toLowerCase();
    return (
      request.full_name.toLowerCase().includes(query) ||
      request.email.toLowerCase().includes(query) ||
      (request.position || '').toLowerCase().includes(query)
    );
  });

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>
          Verification Requests
        </h1>
        <p className="section-subtitle" style={{ marginBottom: '1rem' }}>
          Employees linked to your company and their current verification status.
        </p>

        <div style={{ marginBottom: '0.9rem' }}>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, or position"
          />
        </div>

        <Card style={{ padding: 0 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '2.8rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <ClipboardList size={36} style={{ margin: '0 auto 0.7rem', opacity: 0.35 }} />
              <p>{search ? 'No matching records found.' : 'No verification requests yet.'}</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="ui-table responsive">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Position</th>
                    <th>Verification</th>
                    <th>Employment</th>
                    <th>Date Added</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((request) => {
                    const verificationStyle = statusColor[request.employee_status] || statusColor.UNVERIFIED;
                    const employmentStyle = statusColor[request.employment_status] || statusColor.ACTIVE;
                    return (
                      <tr key={request.id}>
                        <td data-label="Employee" style={{ fontWeight: 600 }}>{request.full_name}</td>
                        <td data-label="Email">{request.email}</td>
                        <td data-label="Position">{request.position || '-'}</td>
                        <td data-label="Verification">
                          <span className="ui-pill" style={{ background: verificationStyle.bg, color: verificationStyle.text }}>
                            {request.employee_status}
                          </span>
                        </td>
                        <td data-label="Employment">
                          <span className="ui-pill" style={{ background: employmentStyle.bg, color: employmentStyle.text }}>
                            {request.employment_status}
                          </span>
                        </td>
                        <td data-label="Date Added">{request.joined_at ? new Date(request.joined_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </EmployerLayout>
  );
};
