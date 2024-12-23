import crypto from 'crypto';
import fetch from 'node-fetch';

const BASE_URL = 'https://beta.flomify.com';
const WEBHOOK_SECRET = 'bf89e7a1c3d84f0e9b5d23a7f1c8e654a1d7b39f';

const testEndpoints = async () => {
  try {
    // Test root endpoint
    console.log('\nTesting root endpoint...');
    const rootResponse = await fetch(BASE_URL);
    console.log('Root status:', rootResponse.status);
    console.log('Root body:', await rootResponse.text());

    // Test health endpoint
    console.log('\nTesting health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    console.log('Health status:', healthResponse.status);
    console.log('Health body:', await healthResponse.text());

    // Test webhook test endpoint
    console.log('\nTesting webhook test endpoint...');
    const testResponse = await fetch(`${BASE_URL}/api/webhooks/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ test: true })
    });
    console.log('Test webhook status:', testResponse.status);
    console.log('Test webhook body:', await testResponse.text());

    // Test LemonSqueezy webhook
    console.log('\nTesting LemonSqueezy webhook...');
    const payload = {
      meta: {
        test_mode: true,
        event_name: 'subscription_created',
        webhook_id: 'test-webhook'
      },
      data: {
        id: 'test-subscription',
        type: 'subscriptions',
        attributes: {
          status: 'active',
          user_email: 'test@example.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      }
    };

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const signature = hmac.update(JSON.stringify(payload)).digest('hex');

    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/lemonsqueezy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      },
      body: JSON.stringify(payload)
    });

    console.log('LemonSqueezy webhook status:', webhookResponse.status);
    console.log('LemonSqueezy webhook body:', await webhookResponse.text());

  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
};

console.log('Starting endpoint tests...');
testEndpoints(); 