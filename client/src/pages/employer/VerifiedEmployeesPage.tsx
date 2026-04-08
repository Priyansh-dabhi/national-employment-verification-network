import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { BadgeCheck, MapPin } from 'lucide-react';

interface VerifiedEmployee {
  id: number;
  full_name: string;
  email: string;
  city: string | null;
  state: string | null;
  position: string | null;
}

export const VerifiedEmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<VerifiedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await employerService.getVerifiedEmployees();
        setEmployees((data.employees || []) as unknown as VerifiedEmployee[]);
      } catch (error) {
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const filteredEmployees = employees.filter((employee) =>
    employee.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (employee.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (employee.position || '').toLowerCase().includes(search.toLowerCase()),
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
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Verified Employees</h1>
        <p className="muted" style={{ marginBottom: '1.4rem' }}>
          Employees verified by NEVN central authority.
        </p>

        <div style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search by name, email, or position..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="field-control"
          />
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="surface" style={{ padding: '2.8rem', textAlign: 'center' }}>
            <BadgeCheck size={38} color="var(--color-text-muted)" style={{ margin: '0 auto 0.7rem', opacity: 0.35 }} />
            <p className="muted">{search ? `No verified employees matching "${search}"` : 'No verified employees yet.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.9rem' }}>
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="surface" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.9rem' }}>
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '999px',
                      background: 'rgba(56, 189, 248, 0.15)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--color-highlight)',
                      fontWeight: 800,
                    }}
                  >
                    {employee.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {employee.full_name}
                    </p>
                    <p className="muted" style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {employee.email}
                    </p>
                  </div>
                  <BadgeCheck size={18} color="var(--color-success)" />
                </div>

                <div className="stack" style={{ gap: '0.35rem', fontSize: '0.84rem' }}>
                  {employee.position ? <p className="muted">Role: {employee.position}</p> : null}
                  {employee.city || employee.state ? (
                    <p className="muted" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={12} /> {[employee.city, employee.state].filter(Boolean).join(', ')}
                    </p>
                  ) : null}
                  <span className="chip" style={{ width: 'fit-content', marginTop: '0.35rem', background: 'rgba(34,197,94,0.16)', color: 'var(--color-success)' }}>
                    NEVN Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </EmployerLayout>
  );
};
