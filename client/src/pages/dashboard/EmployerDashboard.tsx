import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { VerificationRequestForm } from '../../components/forms/VerificationRequestForm';
import { VerificationStatusBanner } from '../../components/ui/VerificationStatusBanner';
import { BlockchainProofModal } from '../../components/ui/BlockchainProofModal';
import { verificationService } from '../../services/verificationService';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import type { Employee, VerificationStatus } from '../../types';
import { Search, Building, FileCheck, History, Clock, XCircle, CheckCircle, User } from 'lucide-react';

export const EmployerDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [isProofModalOpen, setIsProofModalOpen] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');

    useEffect(() => {
        const fetchProfileAndData = async () => {
            try {
                const profile = await authService.getProfile();
                setUser(profile.user);

                if (profile.user.account_status) {
                    setVerificationStatus(profile.user.account_status.toLowerCase() as VerificationStatus);
                }

                // const allEmployees = await verificationService.getAllEmployees();
                // setEmployees(allEmployees);
            } catch (error) {
                console.error("Failed to fetch profile", error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };
        fetchProfileAndData();
    }, [navigate]);

    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRequestSubmit = async (employeeId: string) => {
        console.log("Requesting verification for:", employeeId);
        try {
            const newEmp = await verificationService.requestVerification(employeeId);
            setEmployees([newEmp, ...employees]);
            setIsRequestModalOpen(false);
        } catch (error) {
            console.error("Request failed", error);
        }
    };

    const handleViewDetails = (emp: Employee) => {
        setSelectedEmployee(emp);
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px' }}>Loading portal...</div>;
    }

    if (!user) return null;

    return (
        <div className="container" style={{ paddingTop: '100px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Employer Portal</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Manage employee verifications and requests.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                        <Building size={20} />
                    </div>
                    <div>
                        <p style={{ fontWeight: 600, lineHeight: 1.2 }}>{user.organization_name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{user.org_type} | {user.industry_sector}</p>
                    </div>
                </div>
            </div>

            <VerificationStatusBanner
                status={verificationStatus}
                userRole="employer"
            />

            <Card style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input
                            label="Search Employees"
                            placeholder="Search by name or position..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="primary">
                        <Search size={18} style={{ marginRight: '0.5rem' }} /> Search
                    </Button>
                    <Button variant="outline" onClick={() => setIsRequestModalOpen(true)}>
                        Request New Verification
                    </Button>
                </div>
            </Card>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Employee Verification Status</h2>
                        <Button variant="ghost" size="sm">View All</Button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Employee</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Position</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Status</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Last Check</th>
                                    <th style={{ padding: '1rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading...</td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((emp) => (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                            <td style={{ padding: '1rem', fontWeight: 600 }}>{emp.name}</td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{emp.position}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <StatusBadge status={emp.status} />
                                            </td>
                                            <td style={{ padding: '1rem', color: 'var(--color-text-muted)' }}>{emp.lastCheck}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    style={{ padding: '0.3rem', color: 'var(--color-highlight)', borderRadius: '5px' }}
                                                    onClick={() => handleViewDetails(emp)}
                                                >
                                                    View Details
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {!loading && filteredEmployees.length === 0 && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No employees found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </Card>

                {/* Audit Log / Recent Activity */}
                <Card>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <History size={20} color="var(--color-highlight)" /> Recent Activity
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { type: 'approved', msg: 'Alice Smith verified', time: '2 hours ago' },
                            { type: 'requested', msg: 'Verification for New Hire', time: '5 hours ago' },
                            { type: 'rejected', msg: 'Invalid doc: ID-8821', time: '1 day ago' },
                            { type: 'approved', msg: 'Bob Williams verified', time: '2 days ago' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'start', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ marginTop: '0.25rem' }}>
                                    {item.type === 'approved' ? <CheckCircle size={16} color="var(--color-success)" /> :
                                        item.type === 'rejected' ? <XCircle size={16} color="var(--color-error)" /> :
                                            <Clock size={16} color="var(--color-warning)" />}
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{item.msg}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.time}</p>
                                </div>
                            </div>
                        ))}
                        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
                            <Button variant="ghost" size="sm" style={{ color: 'var(--color-text-muted)' }}>View Full Log</Button>
                        </div>
                    </div>
                </Card>
            </div>

            <Modal
                isOpen={isRequestModalOpen}
                onClose={() => setIsRequestModalOpen(false)}
                title="Request Employee Verification"
            >
                <VerificationRequestForm
                    onSubmit={handleRequestSubmit}
                    onCancel={() => setIsRequestModalOpen(false)}
                />
            </Modal>

            {/* Employee Details Modal */}
            <Modal
                isOpen={!!selectedEmployee}
                onClose={() => setSelectedEmployee(null)}
                title="Employee Verification Details"
            >
                {selectedEmployee && (
                    <div style={{ padding: '0.5rem 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>{selectedEmployee.name.charAt(0)}</span>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{selectedEmployee.name}</h3>
                                <p style={{ color: 'var(--color-text-muted)' }}>{selectedEmployee.position}</p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{selectedEmployee.email}</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <StatusBadge status={selectedEmployee.status} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Verification ID</h4>
                                <p style={{ fontFamily: 'monospace' }}>VER-{selectedEmployee.id}-2024</p>
                            </div>
                            <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Last Verified</h4>
                                <p>{selectedEmployee.lastCheck}</p>
                            </div>
                        </div>

                        {selectedEmployee.status === 'verified' && (
                            <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-success)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileCheck size={18} /> Blockchain Record Found
                                </h4>
                                <Button
                                    variant="outline"
                                    style={{ width: '100%', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                                    onClick={() => {
                                        setSelectedEmployee(null);
                                        setIsProofModalOpen(true);
                                    }}
                                >
                                    View Blockchain Proof
                                </Button>
                            </div>
                        )}

                        {selectedEmployee.status === 'unverified' && (
                            <div style={{ padding: '1rem', background: 'rgba(234, 179, 8, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(234, 179, 8, 0.1)', textAlign: 'center' }}>
                                <p style={{ color: 'var(--color-warning)', marginBottom: '1rem' }}>This employee is not yet verified.</p>
                                <Button variant="primary" onClick={() => {
                                    setSelectedEmployee(null);
                                    setIsRequestModalOpen(true);
                                }}>Initate Verification Request</Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <BlockchainProofModal
                isOpen={isProofModalOpen}
                onClose={() => setIsProofModalOpen(false)}
                proof={{
                    txId: "0x8f2d...3a1b",
                    timestamp: new Date().toISOString(),
                    blockNumber: 13456789,
                    hash: "28f...a9c",
                    verifierId: "GOV-AUTH-001"
                }}
            />
        </div>
    );
}
