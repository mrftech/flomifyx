import fetch from 'node-fetch';

const BASE_URL = 'https://beta.flomify.com';

async function testWebhook() {
  try {
    console.log('\nTesting webhook endpoint...');
    
    // Test data
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        message: "Test webhook payload"
      }
    };

    // Send test webhook request
    const response = await fetch(`${BASE_URL}/api/webhooks/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log('Response status:', response.status);
    
    const responseData = await response.text();
    console.log('Response body:', responseData);

    if (response.ok) {
      console.log('✅ Webhook test successful!');
    } else {
      console.log('❌ Webhook test failed');
    }
  } catch (error) {
    console.error('Error testing webhook:', error.message);
  }
}

console.log('Starting webhook test...');
testWebhook(); 