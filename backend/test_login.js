const BASE_URL = 'http://localhost:5000/api/auth';

// Helper function to create a unique user for testing
const registerUser = async (role) => {
    const timestamp = Date.now();
    const endpoint = role === 'employee' ? '/register/employee' : '/register/employer';

    let body;
    if (role === 'employee') {
        body = {
            email: `test_${role}_${timestamp}@example.com`,
            mobile: `9${Math.floor(Math.random() * 1000000000)}`,
            password: 'password123',
            details: {
                fullName: `Test ${role} ${timestamp}`,
                dob: '1990-01-01',
                gender: 'Male',
                employmentStatus: 'Employed',
                city: 'Test City',
                state: 'Test State'
            }
        };
    } else {
        body = {
            email: `test_${role}_${timestamp}@example.com`,
            mobile: `8${Math.floor(Math.random() * 1000000000)}`,
            password: 'password123',
            details: {
                organizationName: `Test Org ${timestamp}`,
                organizationType: 'Private',
                industrySector: 'IT',
                authorizedPersonName: 'Test Auth User',
                authorizedPersonDesignation: 'Manager',
                city: 'Test City',
                state: 'Test State'
            }
        };
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (response.status !== 201) {
            console.error(`Failed to register ${role}:`, data);
            return null;
        }
        return { email: body.email, password: body.password, role };
    } catch (error) {
        console.error(`Error registering ${role}:`, error);
        return null;
    }
};

const testLogin = async (user, roleToLoginAs) => {
    const role = roleToLoginAs || user.role;
    console.log(`Testing Login for ${user.role} trying to log in as ${role}...`);
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password, role: role })
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);

        if (response.status === 200) {
            console.log('Login Successful!');
            // console.log('Token:', data.token); // don't print full token to avoid clutter
            console.log('Role:', data.role);
            return data.token;
        } else {
            console.error('Login Failed:', data);
            return null;
        }
    } catch (error) {
        console.error('Error logging in:', error);
        return null;
    }
};

const testGetMe = async (token) => {
    console.log('Testing Protected Route /me...');
    try {
        const response = await fetch(`${BASE_URL}/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log(`Status: ${response.status}`);
        if (response.status === 200) {
            console.log('Protected Route Access Successful:', data);
        } else {
            console.error('Protected Route Access Failed:', data);
        }
    } catch (error) {
        console.error('Error accessing protected route:', error);
    }
};

const runTests = async () => {
    // 1. Register and Login Employee
    const employeeUser = await registerUser('employee');
    if (employeeUser) {
        // Correct Role
        const token = await testLogin(employeeUser, 'employee');
        if (token) {
            await testGetMe(token);
        }
    }

    console.log('-----------------------------------');

    // 2. Register and Login Employer
    const employerUser = await registerUser('employer');
    if (employerUser) {
        // Correct Role
        const token = await testLogin(employerUser, 'employer');
        if (token) {
            await testGetMe(token);
        }
    }

    // 3. Test Invalid Login (Wrong Password)
    console.log('-----------------------------------');
    console.log('Testing Invalid Password...');
    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'invalid@example.com', password: 'wrongpassword', role: 'employee' })
        });
        console.log(`Status: ${response.status} (Expected: 404 or 401)`);
    } catch (e) { console.error(e); }

    // 4. Test Role Mismatch (Employee tries to login as Employer)
    if (employeeUser) {
        console.log('-----------------------------------');
        console.log('Testing Role Mismatch (Employee -> Employer)...');
        await testLogin(employeeUser, 'employer');
    }
};

runTests();
