import fs from 'fs';

let code = fs.readFileSync('client/src/pages/dashboard/EmployerDashboard.tsx', 'utf8');

// 1. Add missing imports
if (!code.includes("import { employerService } from")) {
    code = code.replace(
      "import { jobService } from '../../services/jobService';",
      "import { jobService } from '../../services/jobService';\nimport { employerService } from '../../services/employerService';"
    );
}

// 2. Add required lucide icons if missing
code = code.replace(
  "import { Search, Building, FileCheck, History, Clock, XCircle, CheckCircle, Briefcase, Lock, ArrowRight, Users }",
  "import { Search, Building, FileCheck, History, Clock, XCircle, CheckCircle, Briefcase, Lock, ArrowRight, Users, User, Share }"
);

// 3. Update States
if (!code.includes("const [activeTab")) {
    code = code.replace(
      "const [searchTerm, setSearchTerm] = useState('');",
      "const [searchTerm, setSearchTerm] = useState('');\n    const [activeTab, setActiveTab] = useState<'employees' | 'candidates'>('employees');\n    const [candidates, setCandidates] = useState<any[]>([]);\n    const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);\n    const [proposeData, setProposeData] = useState({ position: '', salary: '', compensation: '' });\n    const [isProposing, setIsProposing] = useState(false);"
    );
}

// 4. Update the data fetching
if (!code.includes("const avail = await employerService.getAvailableEmployees();")) {
    code = code.replace(
        "// const allEmployees = await verificationService.getAllEmployees();\n                // setEmployees(allEmployees);",
        "try {\n                    const compEmps = await employerService.getCompanyEmployees();\n                    // Map or filter to fit the Employee type\n                    const empList = compEmps.employees.map((ce: any) => ({ ...ce, name: ce.full_name, status: ce.account_status, lastCheck: new Date(ce.joined_at).toLocaleDateString() }));\n                    setEmployees(empList);\n                    const avail = await employerService.getAvailableEmployees();\n                    setCandidates(avail.employees);\n                } catch(e) { console.error('Failed fetching employees data', e); }"
    );
}

// 5. Add Handle Propose Hire logic
if (!code.includes("const handleProposeHire = async ()")) {
    code = code.replace(
      "const isVerified = verificationStatus === 'verified';",
      "const isVerified = verificationStatus === 'verified';\n    const handleProposeHire = async () => {\n        if (!selectedEmployee) return;\n        try {\n            setIsProposing(true);\n            await employerService.proposeHire(Number(selectedEmployee.id), proposeData.position, proposeData.salary, proposeData.compensation);\n            setIsProposeModalOpen(false);\n            setProposeData({ position: '', salary: '', compensation: '' });\n            setSelectedEmployee(null);\n            // Refresh available candidates\n            const avail = await employerService.getAvailableEmployees();\n            setCandidates(avail.employees);\n        } catch(e) {\n            console.error(e);\n        } finally {\n            setIsProposing(false);\n        }\n    };\n"
    );
}

// 6. Update Rendered UI specifically the Tab controls and Candidate search table
const uiUpdate = `
                <Card>
                    <div className="tab-group" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                        <button type="button" onClick={() => setActiveTab('employees')} className={\`tab-trigger \${activeTab === 'employees' ? 'active' : ''}\`} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'employees' ? 'var(--color-highlight)' : 'var(--color-text-muted)', fontWeight: activeTab === 'employees' ? 600 : 400, cursor: 'pointer' }}>My Employees</button>
                        <button type="button" onClick={() => setActiveTab('candidates')} className={\`tab-trigger \${activeTab === 'candidates' ? 'active' : ''}\`} style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', color: activeTab === 'candidates' ? 'var(--color-highlight)' : 'var(--color-text-muted)', fontWeight: activeTab === 'candidates' ? 600 : 400, cursor: 'pointer' }}>Candidate Search</button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{activeTab === 'employees' ? 'Employee Verification Status' : 'Available Verified Candidates'}</h2>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        {activeTab === 'employees' ? (
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
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                                {candidates.filter(c => c.full_name.toLowerCase().includes(searchTerm.toLowerCase())).map((c: any) => (
                                    <div key={c.id} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.02)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--color-highlight)' }}>
                                                <User size={20} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600 }}>{c.full_name}</p>
                                                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{c.city}, {c.state}</p>
                                            </div>
                                        </div>
                                        <Button variant="primary" size="sm" style={{ width: '100%' }} onClick={() => { setSelectedEmployee({...c, name: c.full_name}); setIsProposeModalOpen(true); }} disabled={!isVerified}>
                                            <Share size={14} style={{ marginRight: '0.4rem' }}/> Propose Hire
                                        </Button>
                                    </div>
                                ))}
                                {candidates.length === 0 && !loading && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', gridColumn: '1 / -1' }}>No available verified candidates found.</div>
                                )}
                            </div>
                        )}
                        {!loading && filteredEmployees.length === 0 && activeTab === 'employees' && (
                            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                No employees found matching "{searchTerm}"
                            </div>
                        )}
                    </div>
                </Card>
`;

code = code.replace(/<Card>[\s\S]*?<\/Card>\s*\{?\/\* Audit Log/m, uiUpdate + '\n\n                {/* Audit Log');

// Add the proposal modal to the end
const modalFragment = `
            <Modal
                isOpen={isProposeModalOpen}
                onClose={() => setIsProposeModalOpen(false)}
                title="Propose Employment Contract"
            >
                {selectedEmployee && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ marginBottom: '0.5rem', color: 'var(--color-text-muted)' }}>
                            Proposing hire for <strong style={{ color: '#fff' }}>{selectedEmployee.name}</strong>.
                        </p>
                        <Input
                            label="Position / Role"
                            value={proposeData.position}
                            onChange={(e) => setProposeData({ ...proposeData, position: e.target.value })}
                            placeholder="e.g. Senior Software Engineer"
                            required
                        />
                        <Input
                            label="Annual Salary"
                            value={proposeData.salary}
                            onChange={(e) => setProposeData({ ...proposeData, salary: e.target.value })}
                            placeholder="e.g. $120,000 or ₹15,00,000"
                            required
                        />
                        <div className="input-group">
                            <label className="input-label">Additional Compensation/Benefits</label>
                            <textarea
                                value={proposeData.compensation}
                                onChange={(e) => setProposeData({ ...proposeData, compensation: e.target.value })}
                                placeholder="Health insurance, ESOPs, etc."
                                className="ui-input"
                                rows={3}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                            <Button variant="ghost" onClick={() => setIsProposeModalOpen(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleProposeHire} isLoading={isProposing} disabled={!proposeData.position || !proposeData.salary}>Send Proposal</Button>
                        </div>
                    </div>
                )}
            </Modal>
`;

if (!code.includes("title=\"Propose Employment Contract\"")) {
    code = code.replace("            <BlockchainProofModal", modalFragment + "\n            <BlockchainProofModal");
}

fs.writeFileSync('client/src/pages/dashboard/EmployerDashboard.tsx', code);
