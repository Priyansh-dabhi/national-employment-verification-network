import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:5000/api';

const registerAndLoginEmployee = async () => {
    const email = `test_upload_${Date.now()}@example.com`;
    const password = 'password123';

    // 1. Register Employee
    await fetch(`${BASE_URL}/auth/register/employee`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email, mobile: `12${Date.now()}`.substring(0, 10), password,
            details: { fullName: 'Upload Tester', dob: '1990-01-01', gender: 'male', employmentStatus: 'employed', city: 'City', state: 'State' }
        })
    });

    // 2. Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'employee' })
    });
    return loginRes.json();
};

const testUploadAndView = async () => {
    try {
        console.log('--- Registering & Logging in Employee ---');
        const authData = await registerAndLoginEmployee();
        const token = authData.token;
        console.log('Login Success! Token obtained.');

        // Create a dummy file
        const dummyFilePath = path.join(process.cwd(), 'dummy_test_doc.pdf');
        fs.writeFileSync(dummyFilePath, 'This is a simulated PDF content for testing secure uploads.');

        console.log('\n--- Testing Document Upload ---');

        const form = new FormData();
        const fileBlob = new Blob([fs.readFileSync(dummyFilePath)], { type: 'application/pdf' });
        form.append('file', fileBlob, 'dummy_test_doc.pdf');
        form.append('document_type', 'ID_PROOF');

        const uploadRes = await fetch(`${BASE_URL}/documents/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form
        });

        const uploadData = await uploadRes.json();
        console.log(`Upload Status: ${uploadRes.status}`);
        console.log('Upload Response:', uploadData);

        if (uploadRes.status === 201 && uploadData.documentId) {
            console.log('\n--- Testing Document View (Signed URL) ---');
            const viewRes = await fetch(`${BASE_URL}/documents/${uploadData.documentId}/view`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const viewData = await viewRes.json();
            console.log(`View Status: ${viewRes.status}`);
            console.log('View Response (Signed URL):', viewData);

            if (viewData.signedUrl) {
                console.log('\nSuccess! Secure Document Upload flow works and generated an expiring signed URL.');
                console.log('You can open the URL in your browser to verify the file download. Note that the downloaded file will be ENCRYPTED binary data because we encrypted the buffer before sending to Cloudinary. It needs to be decrypted via the backend or a client using the key.');
            }
        }

        // Cleanup dummy file
        if (fs.existsSync(dummyFilePath)) fs.unlinkSync(dummyFilePath);

    } catch (e) {
        console.error('Test Failed:', e);
    }
};

testUploadAndView();
