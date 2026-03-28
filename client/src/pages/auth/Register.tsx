
import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { User, Building, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/authService';
import type { RegistrationData, UserRole, EmploymentStatus, OrganizationType } from '../../types';

// Step Components defined outside to prevent re-renders losing focus

const StepOne = ({ role, setRole }: { role: UserRole, setRole: (r: UserRole) => void }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div
            onClick={() => setRole('employee')}
            style={{
                cursor: 'pointer',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${role === 'employee' ? 'var(--color-highlight)' : 'var(--glass-border)'}`,
                background: role === 'employee' ? 'rgba(251, 191, 36, 0.1)' : 'var(--glass-bg)',
                textAlign: 'center',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ marginBottom: '1rem', display: 'inline-block', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                <User size={32} color={role === 'employee' ? 'var(--color-highlight)' : 'var(--color-text-muted)'} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Employee</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Verify your employment history.</p>
        </div>

        <div
            onClick={() => setRole('employer')}
            style={{
                cursor: 'pointer',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${role === 'employer' ? 'var(--color-highlight)' : 'var(--glass-border)'}`,
                background: role === 'employer' ? 'rgba(251, 191, 36, 0.1)' : 'var(--glass-bg)',
                textAlign: 'center',
                transition: 'all 0.2s'
            }}
        >
            <div style={{ marginBottom: '1rem', display: 'inline-block', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}>
                <Building size={32} color={role === 'employer' ? 'var(--color-highlight)' : 'var(--color-text-muted)'} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Employer</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Verify and manage employees.</p>
        </div>
    </div>
);

const PasswordStrength = ({ password }: { password: string }) => {
    if (!password) return null;

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isLongEnough = password.length >= 8;

    const strength = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;

    let color = 'var(--color-error)';
    let text = 'Weak';

    if (strength >= 4) {
        color = 'var(--color-success)';
        text = 'Strong';
    } else if (strength >= 2) {
        color = 'var(--color-warning)';
        text = 'Medium';
    }

    return (
        <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ flex: 1, height: '4px', background: 'var(--glass-border)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${(strength / 5) * 100}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
            </div>
            <span style={{ color }}>{text}</span>
        </div>
    );
};

const StepTwo = ({ commonData, handleCommonChange }: { commonData: any, handleCommonChange: any }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Input label="Email Address" name="email" value={commonData.email} onChange={handleCommonChange} type="email" placeholder="Enter Email Address" />
        <Input label="Mobile Number" name="mobile" value={commonData.mobile} onChange={handleCommonChange} placeholder="Enter Mobile Number" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
                <Input label="Password" name="password" value={commonData.password} onChange={handleCommonChange} type="password" placeholder="Enter Password" />
                <PasswordStrength password={commonData.password} />
            </div>
            <Input label="Confirm Password" name="confirmPassword" value={commonData.confirmPassword} onChange={handleCommonChange} type="password" placeholder="Enter Confirm Password" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input label="City" name="city" value={commonData.city} onChange={handleCommonChange} placeholder="Enter the City" />
            <Input label="State" name="state" value={commonData.state} onChange={handleCommonChange} placeholder="Enter the State" />
        </div>
    </div>
);

const StepThree = ({
    role,
    employeeData,
    handleEmployeeChange,
    employerData,
    handleEmployerChange,
    termsAccepted,
    setTermsAccepted
}: {
    role: UserRole,
    employeeData: any,
    handleEmployeeChange: any,
    employerData: any,
    handleEmployerChange: any,
    termsAccepted: boolean,
    setTermsAccepted: (v: boolean) => void
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {role === 'employee' ? (
            <>
                <Input label="Full Name" name="fullName" value={employeeData.fullName} onChange={handleEmployeeChange} placeholder="John Doe" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input label="Date of Birth" name="dob" value={employeeData.dob} onChange={handleEmployeeChange} type="date" />
                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Employment Status</label>
                        <select
                            name="employmentStatus"
                            value={employeeData.employmentStatus}
                            onChange={handleEmployeeChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-main)',
                                outline: 'none'
                            }}
                        >
                            <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="employed">Employed</option>
                            <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="unemployed">Unemployed</option>
                            <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="student">Student</option>
                            <option style={{ background: 'var(--color-bg-dark)', color: 'var(--color-text-main)' }} value="retired">Retired</option>
                        </select>
                    </div>
                </div>
                <div className="input-group">
                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Gender (Optional)</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" name="gender" value="male" onChange={handleEmployeeChange} className="custom-radio" /> Male
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" name="gender" value="female" onChange={handleEmployeeChange} className="custom-radio" /> Female
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input type="radio" name="gender" value="other" onChange={handleEmployeeChange} className="custom-radio" /> Other
                        </label>
                    </div>
                </div>
            </>
        ) : (
            <>
                <Input label="Organization Name" name="organizationName" value={employerData.organizationName} onChange={handleEmployerChange} placeholder="Tech Industries Ltd" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>Org Type</label>
                        <select
                            name="organizationType"
                            value={employerData.organizationType}
                            onChange={handleEmployerChange}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-text-light)',
                                outline: 'none'
                            }}
                        >
                            <option style={{ background: 'var(--color-bg-dark)' }} value="private">Private</option>
                            <option style={{ background: 'var(--color-bg-dark)' }} value="government">Government</option>
                            <option style={{ background: 'var(--color-bg-dark)' }} value="psu">PSU</option>
                        </select>
                    </div>
                    <Input label="Industry Sector" name="industrySector" value={employerData.industrySector} onChange={handleEmployerChange} placeholder="IT / Manufacturing" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input label="Authorized Representative Full Name" name="authorizedPersonName" value={employerData.authorizedPersonName} onChange={handleEmployerChange} placeholder="Jane Smith" />
                    <Input label="Designation" name="authorizedPersonDesignation" value={employerData.authorizedPersonDesignation} onChange={handleEmployerChange} placeholder="HR Manager" />
                </div>
            </>
        )}

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer', marginTop: '1rem' }}>
            <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                style={{ marginTop: '0.2rem', accentColor: 'var(--color-highlight)' }}
            />
            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                I agree to the <span style={{ color: 'var(--color-highlight)' }}>Terms of Service</span> and <span style={{ color: 'var(--color-highlight)' }}>Privacy Policy</span>.
            </span>
        </label>
    </div>
);

export const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [role, setRole] = useState<UserRole>('employee');
    const [loading, setLoading] = useState(false);

    // Form States
    const [commonData, setCommonData] = useState({
        email: '', mobile: '', password: '', confirmPassword: '', city: '', state: ''
    });

    const [employeeData, setEmployeeData] = useState({
        fullName: '', dob: '', gender: '', employmentStatus: 'employed' as EmploymentStatus
    });

    const [employerData, setEmployerData] = useState({
        organizationName: '', organizationType: 'private' as OrganizationType,
        industrySector: '', authorizedPersonName: '', authorizedPersonDesignation: ''
    });

    const [termsAccepted, setTermsAccepted] = useState(false);

    const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCommonData({ ...commonData, [e.target.name]: e.target.value });
    };

    const handleEmployeeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEmployeeData({ ...employeeData, [e.target.name]: e.target.value });
    };

    const handleEmployerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setEmployerData({ ...employerData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!termsAccepted) return;

        setLoading(true);

        const registrationPayload: RegistrationData = {
            email: commonData.email,
            mobile: commonData.mobile,
            password: commonData.password,
            role,
            details: role === 'employee'
                ? { ...employeeData, city: commonData.city, state: commonData.state }
                : { ...employerData, city: commonData.city, state: commonData.state }
        };

        try {
            await authService.register(registrationPayload);
            // Redirect to Success Page
            navigate('/registration-success');
        } catch (error) {
            console.error("Registration failed", error);
            alert("Registration failed. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ width: '100%', maxWidth: '600px' }}>
                <Card>
                    <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Create Account</h2>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            {[1, 2, 3].map(i => (
                                <div key={i} style={{
                                    width: '3rem', height: '4px', borderRadius: '2px',
                                    background: i <= step ? 'var(--color-highlight)' : 'rgba(255,255,255,0.1)'
                                }} />
                            ))}
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {step === 1 && <StepOne role={role} setRole={setRole} />}
                            {step === 2 && <StepTwo commonData={commonData} handleCommonChange={handleCommonChange} />}
                            {step === 3 && <StepThree
                                role={role}
                                employeeData={employeeData}
                                handleEmployeeChange={handleEmployeeChange}
                                employerData={employerData}
                                handleEmployerChange={handleEmployerChange}
                                termsAccepted={termsAccepted}
                                setTermsAccepted={setTermsAccepted}
                            />}
                        </motion.div>
                    </AnimatePresence>

                    <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'space-between' }}>
                        <Button
                            variant="ghost"
                            disabled={step === 1}
                            onClick={() => setStep(step - 1)}
                            style={{ opacity: step === 1 ? 0 : 1, color: 'var(--color-highlight)', padding: '0.5rem' }}
                        >
                            <ArrowLeft size={18} style={{ padding: '0.5rem' }} /> Back
                        </Button>

                        <Button
                            variant="primary"
                            onClick={(e: React.MouseEvent) => {
                                if (step < 3) setStep(step + 1);
                                else handleSubmit(e as any);
                            }}
                            disabled={loading || (step === 3 && !termsAccepted)}
                        >
                            {loading ? 'Creating...' : step === 3 ? 'Register' : 'Next'}
                            {!loading && step < 3 && <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />}
                        </Button>
                    </div>

                    <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '1.5rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--color-highlight)' }}>Sign In</Link>
                    </p>
                </Card>
            </div>
        </div>
    );
};
