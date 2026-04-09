import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from './EmployerLayout';
import { employerService } from '../../services/employerService';
import { UserCheck, UserX, Users, Plus, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface CompanyEmployee {
  id: number;
  full_name: string;
  email: string;
  position: string | null;
  account_status: string;
  employment_status: 'ACTIVE' | 'LEFT';
  joined_at: string;
  left_at: string | null;
}

export const EmployeeManagementPage = () => {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'LEFT'>('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [accountStatus, setAccountStatus] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({ employee_email: '', position: '', reason: '' });

  const loadData = async () => {
    try {
      const [employeesResponse, profileResponse] = await Promise.all([
        employerService.getCompanyEmployees(),
        employerService.getProfile(),
      ]);

      setEmployees((employeesResponse.employees || []) as unknown as CompanyEmployee[]);
      setAccountStatus(String(profileResponse.profile?.account_status || ''));
    } catch {
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [navigate]);

  const handleMarkLeft = async (employeeId: number) => {
    setMarkingId(employeeId);
    setMessage(null);

    try {
      await employerService.markEmployeeLeft(employeeId);
      await loadData();
      setMessage({ text: 'Employee status updated.', type: 'success' });
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to update employee.', type: 'error' });
    } finally {
      setMarkingId(null);
    }
  };

  const handleAddEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormLoading(true);
    setMessage(null);

    try {
      await employerService.requestEmployeeVerification(form.employee_email, form.position, form.reason);
      setForm({ employee_email: '', position: '', reason: '' });
      setShowAddForm(false);
      setMessage({ text: 'Employee linked successfully.', type: 'success' });
      await loadData();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Failed to link employee.', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => employee.employment_status === activeTab);
  const isVerified = accountStatus === 'VERIFIED';

  if (loading) {
    return (
      <EmployerLayout>
        <div style={{ paddingTop: '5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div style={{ maxWidth: '980px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.9rem', flexWrap: 'wrap', marginBottom: '1.4rem' }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.25rem' }}>Employee Management</h1>
            <p className="muted">Track active and previous employees linked to your company.</p>
          </div>
          <Button onClick={() => isVerified && setShowAddForm(true)} disabled={!isVerified}>
            <Plus size={15} /> Add Employee
          </Button>
        </div>

        {!isVerified ? (
          <div
            style={{
              display: 'flex',
              gap: '0.7rem',
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              background: 'rgba(245, 158, 11, 0.09)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              color: 'var(--color-warning)',
              fontSize: '0.86rem',
            }}
          >
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>
              Your company must be <strong>VERIFIED</strong> before adding or managing employees.
            </span>
          </div>
        ) : null}

        {message ? (
          <div
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              border:
                message.type === 'success'
                  ? '1px solid rgba(34,197,94,0.28)'
                  : '1px solid rgba(239,68,68,0.28)',
              background:
                message.type === 'success'
                  ? 'rgba(34,197,94,0.1)'
                  : 'rgba(239,68,68,0.1)',
              color: message.type === 'success' ? 'var(--color-success)' : '#fecaca',
              fontSize: '0.84rem',
            }}
          >
            {message.text}
          </div>
        ) : null}

        {showAddForm ? (
          <div className="surface" style={{ padding: '1rem', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.8rem', fontWeight: 700 }}>Add / Link Employee</h3>
            <form onSubmit={handleAddEmployee} className="grid-2" style={{ gap: '0.8rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="field-label">Employee Email *</label>
                <input
                  className="field-control"
                  required
                  type="email"
                  value={form.employee_email}
                  onChange={(event) => setForm({ ...form, employee_email: event.target.value })}
                  placeholder="employee@example.com"
                />
              </div>

              <div>
                <label className="field-label">Position / Role</label>
                <input
                  className="field-control"
                  value={form.position}
                  onChange={(event) => setForm({ ...form, position: event.target.value })}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div>
                <label className="field-label">Reason (Optional)</label>
                <input
                  className="field-control"
                  value={form.reason}
                  onChange={(event) => setForm({ ...form, reason: event.target.value })}
                  placeholder="e.g. Background check"
                />
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.7rem' }}>
                <Button type="submit" isLoading={formLoading}>
                  Link Employee
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        ) : null}

        <div className="tab-group" style={{ marginBottom: '0.9rem' }}>
          {(['ACTIVE', 'LEFT'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`tab-trigger ${activeTab === tab ? 'active' : ''}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem' }}
            >
              {tab === 'ACTIVE' ? <UserCheck size={14} /> : <UserX size={14} />}
              {tab === 'ACTIVE' ? 'Active' : 'Left'} ({employees.filter((employee) => employee.employment_status === tab).length})
            </button>
          ))}
        </div>

        <div className="surface table-wrap">
          {filteredEmployees.length === 0 ? (
            <div style={{ padding: '2.4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Users size={34} style={{ margin: '0 auto 0.7rem', opacity: 0.35 }} />
              <p>No {activeTab.toLowerCase()} employees found.</p>
            </div>
          ) : (
            <table className="ui-table responsive">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Position</th>
                  <th>Verification</th>
                  <th>{activeTab === 'ACTIVE' ? 'Joined' : 'Left'}</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td data-label="Name" style={{ fontWeight: 700 }}>{employee.full_name}</td>
                    <td data-label="Email">{employee.email}</td>
                    <td data-label="Position">{employee.position || '-'}</td>
                    <td data-label="Verification">
                      <span
                        className="chip"
                        style={{
                          background:
                            employee.account_status === 'VERIFIED'
                              ? 'rgba(34,197,94,0.16)'
                              : 'rgba(148,163,184,0.16)',
                          color:
                            employee.account_status === 'VERIFIED'
                              ? 'var(--color-success)'
                              : 'var(--color-text-muted)',
                        }}
                      >
                        {employee.account_status}
                      </span>
                    </td>
                    <td data-label={activeTab === 'ACTIVE' ? 'Joined' : 'Left'}>
                      {activeTab === 'ACTIVE'
                        ? new Date(employee.joined_at).toLocaleDateString()
                        : employee.left_at
                          ? new Date(employee.left_at).toLocaleDateString()
                          : '-'}
                    </td>
                    <td data-label="Action">
                      {activeTab === 'ACTIVE' && isVerified ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkLeft(employee.id)}
                          disabled={markingId === employee.id}
                        >
                          {markingId === employee.id ? 'Updating...' : 'Mark Left'}
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </EmployerLayout>
  );
};
