const fetch = require('node-fetch');

async function testCreate() {
    try {
        const response = await fetch('http://localhost:5000/api/production', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product: 'Solar', quantity: 10 })
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Body:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

testCreate();
