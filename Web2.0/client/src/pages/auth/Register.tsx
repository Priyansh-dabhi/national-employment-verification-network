import { type FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, CheckCircle2, ClipboardCheck, UserRound } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { authService } from '../../services/authService';
import type { EmploymentStatus, OrganizationType, RegistrationData } from '../../types';

type Role = 'employee' | 'employer';

export const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('employee');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [common, setCommon] = useState({
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
  });

  const [employee, setEmployee] = useState({
    fullName: '',
    dob: '',
    gender: '',
    employmentStatus: 'employed' as EmploymentStatus,
  });

  const [employer, setEmployer] = useState({
    organizationName: '',
    organizationType: 'private' as OrganizationType,
    industrySector: '',
    authorizedPersonName: '',
    authorizedPersonDesignation: '',
  });

  const passwordMismatch = useMemo(
    () => common.confirmPassword.length > 0 && common.password !== common.confirmPassword,
    [common.confirmPassword, common.password],
  );

  const validate = () => {
    if (passwordMismatch) return 'Password and confirm password must match.';
    if (!termsAccepted) return 'Please accept terms and privacy policy to continue.';
    if (role === 'employee' && (!employee.fullName || !employee.dob)) {
      return 'Please complete employee profile details.';
    }
    if (
      role === 'employer' &&
      (!employer.organizationName ||
        !employer.industrySector ||
        !employer.authorizedPersonName ||
        !employer.authorizedPersonDesignation)
    ) {
      return 'Please complete organization details.';
    }
    return null;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: RegistrationData = {
      email: common.email.trim(),
      mobile: common.mobile.trim(),
      password: common.password,
      role,
      details:
        role === 'employee'
          ? {
              fullName: employee.fullName.trim(),
              dob: employee.dob,
              gender: employee.gender.trim() || undefined,
              employmentStatus: employee.employmentStatus,
              city: common.city.trim(),
              state: common.state.trim(),
            }
          : {
              organizationName: employer.organizationName.trim(),
              organizationType: employer.organizationType,
              industrySector: employer.industrySector.trim(),
              authorizedPersonName: employer.authorizedPersonName.trim(),
              authorizedPersonDesignation: employer.authorizedPersonDesignation.trim(),
              city: common.city.trim(),
              state: common.state.trim(),
            },
    };

    setLoading(true);
    try {
      await authService.register(payload);
      navigate('/registration-success');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-grid">
        <aside className="auth-brand">
          <div>
            <span className="auth-brand__badge">
              <ClipboardCheck size={14} />
              NEVN ONBOARDING
            </span>
            <h1 className="auth-brand__title">Create your verified account</h1>
            <p className="auth-brand__desc">
              Register once and use secure identity and employment verification workflows across the platform.
            </p>
          </div>
          <div className="auth-brand__meta">
            <div className="auth-brand__meta-item">
              <CheckCircle2 size={15} />
              Step-by-step onboarding with inline validation
            </div>
            <div className="auth-brand__meta-item">
              <CheckCircle2 size={15} />
              Compatible with employee and employer verification paths
            </div>
          </div>
        </aside>

        <section className="auth-card">
          <h2 className="auth-title">Register</h2>
          <p className="auth-subtitle">Complete all sections to create your NEVN account.</p>

          <div className="role-selector" role="tablist" aria-label="Select account role">
            <button
              type="button"
              className={`role-chip ${role === 'employee' ? 'active' : ''}`}
              onClick={() => setRole('employee')}
            >
              <UserRound size={14} />
              Employee
            </button>
            <button
              type="button"
              className={`role-chip ${role === 'employer' ? 'active' : ''}`}
              onClick={() => setRole('employer')}
            >
              <Building2 size={14} />
              Employer
            </button>
          </div>

          <form className="auth-sections" onSubmit={handleSubmit} autoComplete="off">
            <input type="text" name="fake_username" autoComplete="username" style={{ display: 'none' }} />
            <input type="password" name="fake_password" autoComplete="new-password" style={{ display: 'none' }} />

            <section className="auth-section">
              <h3 className="auth-section__title">1. Basic Credentials</h3>
              <p className="auth-section__desc">Use your active email and set a secure password.</p>
              <div className="grid-2">
                <Input
                  label="Email Address"
                  name="register_email"
                  type="email"
                  autoComplete="email"
                  value={common.email}
                  onChange={(event) => setCommon({ ...common, email: event.target.value })}
                  required
                />
                <Input
                  label="Mobile Number"
                  name="register_mobile"
                  autoComplete="off"
                  value={common.mobile}
                  onChange={(event) => setCommon({ ...common, mobile: event.target.value })}
                  required
                />
              </div>
              <div className="grid-2" style={{ marginTop: '0.8rem' }}>
                <PasswordInput
                  label="Password"
                  name="register_password"
                  autoComplete="new-password"
                  value={common.password}
                  onChange={(event) => setCommon({ ...common, password: event.target.value })}
                  hint="Use at least 8 characters."
                  required
                />
                <PasswordInput
                  label="Confirm Password"
                  name="register_confirm_password"
                  autoComplete="new-password"
                  value={common.confirmPassword}
                  onChange={(event) => setCommon({ ...common, confirmPassword: event.target.value })}
                  error={passwordMismatch ? 'Passwords do not match.' : undefined}
                  required
                />
              </div>
            </section>

            <section className="auth-section">
              <h3 className="auth-section__title">2. Contact Details</h3>
              <p className="auth-section__desc">Provide your city and state for profile verification context.</p>
              <div className="grid-2">
                <Input
                  label="City"
                  name="register_city"
                  autoComplete="address-level2"
                  value={common.city}
                  onChange={(event) => setCommon({ ...common, city: event.target.value })}
                  required
                />
                <Input
                  label="State"
                  name="register_state"
                  autoComplete="address-level1"
                  value={common.state}
                  onChange={(event) => setCommon({ ...common, state: event.target.value })}
                  required
                />
              </div>
            </section>

            <section className="auth-section">
              <h3 className="auth-section__title">3. {role === 'employee' ? 'Employee Profile' : 'Organization Details'}</h3>
              <p className="auth-section__desc">
                {role === 'employee'
                  ? 'Provide your personal employment information.'
                  : 'Provide your organization and authorized representative information.'}
              </p>

              {role === 'employee' ? (
                <div className="stack" style={{ gap: '0.8rem' }}>
                  <Input
                    label="Full Name"
                    name="employee_full_name"
                    autoComplete="name"
                    value={employee.fullName}
                    onChange={(event) => setEmployee({ ...employee, fullName: event.target.value })}
                    required
                  />
                  <div className="grid-2">
                    <Input
                      label="Date of Birth"
                      name="employee_dob"
                      type="date"
                      autoComplete="bday"
                      value={employee.dob}
                      onChange={(event) => setEmployee({ ...employee, dob: event.target.value })}
                      required
                    />
                    <div className="ui-field">
                      <label htmlFor="employment_status" className="field-label">
                        Employment Status
                      </label>
                      <select
                        id="employment_status"
                        className="ui-select"
                        value={employee.employmentStatus}
                        onChange={(event) =>
                          setEmployee({ ...employee, employmentStatus: event.target.value as EmploymentStatus })
                        }
                      >
                        <option value="employed">Employed</option>
                        <option value="unemployed">Unemployed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                      </select>
                    </div>
                  </div>
                  <Input
                    label="Gender (Optional)"
                    name="employee_gender"
                    autoComplete="sex"
                    value={employee.gender}
                    onChange={(event) => setEmployee({ ...employee, gender: event.target.value })}
                  />
                </div>
              ) : (
                <div className="stack" style={{ gap: '0.8rem' }}>
                  <Input
                    label="Organization Name"
                    name="employer_org_name"
                    autoComplete="organization"
                    value={employer.organizationName}
                    onChange={(event) => setEmployer({ ...employer, organizationName: event.target.value })}
                    required
                  />
                  <div className="grid-2">
                    <div className="ui-field">
                      <label htmlFor="organization_type" className="field-label">
                        Organization Type
                      </label>
                      <select
                        id="organization_type"
                        className="ui-select"
                        value={employer.organizationType}
                        onChange={(event) =>
                          setEmployer({ ...employer, organizationType: event.target.value as OrganizationType })
                        }
                      >
                        <option value="private">Private</option>
                        <option value="government">Government</option>
                        <option value="psu">PSU</option>
                      </select>
                    </div>
                    <Input
                      label="Industry Sector"
                      name="employer_industry"
                      autoComplete="off"
                      value={employer.industrySector}
                      onChange={(event) => setEmployer({ ...employer, industrySector: event.target.value })}
                      required
                    />
                  </div>
                  <div className="grid-2">
                    <Input
                      label="Authorized Person Name"
                      name="employer_auth_name"
                      autoComplete="name"
                      value={employer.authorizedPersonName}
                      onChange={(event) => setEmployer({ ...employer, authorizedPersonName: event.target.value })}
                      required
                    />
                    <Input
                      label="Designation"
                      name="employer_designation"
                      autoComplete="organization-title"
                      value={employer.authorizedPersonDesignation}
                      onChange={(event) =>
                        setEmployer({ ...employer, authorizedPersonDesignation: event.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              )}
            </section>

            <section className="auth-section">
              <h3 className="auth-section__title">4. Consent</h3>
              <p className="auth-section__desc">Confirm agreement with NEVN terms and privacy policy.</p>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.target.checked)}
                  style={{ marginTop: '0.18rem', accentColor: 'var(--color-primary)' }}
                />
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.86rem' }}>
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
            </section>

            {error ? <div className="ui-alert ui-alert--error">{error}</div> : null}

            <Button type="submit" size="lg" fullWidth isLoading={loading}>
              Create Account
            </Button>
          </form>

          <p style={{ marginTop: '0.95rem', color: 'var(--color-text-soft)', fontSize: '0.88rem', textAlign: 'center' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </section>
      </div>
    </div>
  );
};
