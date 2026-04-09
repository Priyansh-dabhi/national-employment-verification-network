// Mock Data Generator for Assembly Line Employment Packets
// Aligned exactly to the backend POST /api/employment requirements:
//   { recordID, employeeID, employerID, position, startDate, status }
// The backend auto-generates createdAt and updatedAt.

const POSITIONS = [
    'Software Engineer',
    'Data Scientist',
    'Network Administrator',
    'Blockchain Specialist',
    'Systems Architect',
    'Security Analyst',
    'DevOps Engineer',
    'Project Manager',
    'Database Administrator',
    'AI Research Lead',
];

const EMPLOYERS = [
    'ORG-CENTRAL',
    'ORG-DEFENCE',
    'ORG-FINANCE',
    'ORG-HEALTH',
    'ORG-INFRA',
    'ORG-EDUCATION',
    'ORG-JUDICIARY',
    'ORG-COMMERCE',
];

const generateId = (length = 6) => {
    return Math.floor(Math.random() * Math.pow(10, length)).toString().padStart(length, '0');
};

export const generateMockPacket = () => {
    // Generate distinct random IDs for every new packet
    const randomRecId = generateId();
    const randomEmpId = generateId();

    return {
        localId: `pkt-${Date.now()}-${randomRecId}`,
        recordID: `REC-${randomRecId}`,
        employeeID: `EMP-${randomEmpId}`,
        employerID: EMPLOYERS[Math.floor(Math.random() * EMPLOYERS.length)],
        position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
        startDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
    };
};
