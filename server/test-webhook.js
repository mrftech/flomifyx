import fetch from 'node-fetch';

const testWebhook = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        test: true,
        message: 'Test webhook payload',
        timestamp: new Date().toISOString()
      })
    });

    const data = await response.json();
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
};

testWebhook(); 