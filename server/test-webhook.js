import crypto from 'crypto';
import fetch from 'node-fetch';

const WEBHOOK_SECRET = 'bf89e7a1c3d84f0e9b5d23a7f1c8e654a1d7b39f';
const WEBHOOK_URL = 'https://beta.flomify.com/api/webhooks/lemonsqueezy';

const testWebhook = async () => {
  try {
    // Test payload
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

    // Create signature
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const signature = hmac.update(JSON.stringify(payload)).digest('hex');

    // Send request
    console.log('Sending test webhook...');
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': signature
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response body:', data);
  } catch (error) {
    console.error('Error testing webhook:', error);
  }
};

testWebhook(); 