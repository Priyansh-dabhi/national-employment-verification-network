

const BASE_URL = 'http://localhost:5000/api/auth';

const testEmployeeRegistration = async () => {
    console.log('Testing Employee Registration...');
    const body = {
        email: `emp_${Date.now()}@example.com`,
        mobile: `987654${Math.floor(Math.random() * 10000)}`,
        password: 'password123',
        details: {
            fullName: 'John Doe',
            dob: '1990-01-01',
            gender: 'Male',
            employmentStatus: 'Employed',
            city: 'New York',
            state: 'NY'
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/register/employee`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

const testEmployerRegistration = async () => {
    console.log('\nTesting Employer Registration...');
    const body = {
        email: `org_${Date.now()}@example.com`,
        mobile: `876543${Math.floor(Math.random() * 10000)}`,
        password: 'securepass',
        details: {
            organizationName: 'Tech Corp',
            organizationType: 'Private',
            industrySector: 'IT',
            authorizedPersonName: 'Jane Smith',
            authorizedPersonDesignation: 'HR Manager',
            city: 'San Francisco',
            state: 'CA'
        }
    };

    try {
        const response = await fetch(`${BASE_URL}/register/employer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

const runTests = async () => {
    await testEmployeeRegistration();
    await testEmployerRegistration();
};

runTests();
