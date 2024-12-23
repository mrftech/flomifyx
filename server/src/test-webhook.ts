import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://beta.flomify.com';

interface WebhookResponse {
  received: boolean;
  timestamp: string;
}

async function testWebhook(): Promise<void> {
  try {
    console.log(`Testing webhook at ${BASE_URL}/api/webhooks/test`);
    
    const response = await fetch(`${BASE_URL}/api/webhooks/test`, {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as WebhookResponse;
    console.log('Response:', data);
    console.log('✅ Webhook test successful!');
  } catch (error) {
    console.error('❌ Error testing webhook:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

testWebhook(); 